import { useMemo } from 'react';
import { type NostrEvent } from '@nostrify/nostrify';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import { cn } from '@/lib/utils';

interface NoteContentProps {
  event: NostrEvent;
  className?: string;
}

// Common image extensions
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;
// Common video extensions
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i;

function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url);
}

function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url);
}

/** Parses content of text note events so that URLs and hashtags are linkified, images displayed, and videos embedded. */
export function NoteContent({
  event,
  className,
}: NoteContentProps) {
  // Extract media URLs and text content
  const { textParts, imageUrls, videoUrls } = useMemo(() => {
    const text = event.content;
    const images: string[] = [];
    const videos: string[] = [];

    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;

      // Add text before this match
      if (index > lastIndex) {
        const textBefore = text.substring(lastIndex, index);
        if (textBefore.trim()) {
          parts.push(textBefore);
        }
      }

      if (url) {
        // Clean URL (remove trailing punctuation that might have been captured)
        const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

        if (isImageUrl(cleanUrl)) {
          // Collect image URLs separately
          images.push(cleanUrl);
        } else if (isVideoUrl(cleanUrl)) {
          // Collect video URLs separately
          videos.push(cleanUrl);
        } else {
          // Regular URL - render as link
          parts.push(
            <a
              key={`url-${keyCounter++}`}
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {cleanUrl}
            </a>
          );
        }
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        try {
          const nostrId = `${nostrPrefix}${nostrData}`;
          const decoded = nip19.decode(nostrId);

          if (decoded.type === 'npub') {
            const pubkey = decoded.data;
            parts.push(
              <NostrMention key={`mention-${keyCounter++}`} pubkey={pubkey} />
            );
          } else {
            // For other types, just show as a link
            parts.push(
              <Link
                key={`nostr-${keyCounter++}`}
                to={`/${nostrId}`}
                className="text-blue-500 hover:underline"
              >
                {fullMatch}
              </Link>
            );
          }
        } catch {
          // If decoding fails, just render as text
          parts.push(fullMatch);
        }
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-indigo-600 hover:underline font-medium"
          >
            {hashtag}
          </Link>
        );
      }

      lastIndex = index + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      if (remaining.trim()) {
        parts.push(remaining);
      }
    }

    // If no special content was found, just use the plain text
    if (parts.length === 0 && images.length === 0 && videos.length === 0) {
      parts.push(text);
    }

    return { textParts: parts, imageUrls: images, videoUrls: videos };
  }, [event]);

  // Determine image grid layout based on count
  const getImageGridClass = (count: number): string => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2'; // 2 on top, 1 on bottom
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3'; // 5+ images
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Text content */}
      {textParts.length > 0 && (
        <div className="whitespace-pre-wrap break-words">
          {textParts}
        </div>
      )}

      {/* Images in tiled grid */}
      {imageUrls.length > 0 && (
        <div className={cn(
          "grid gap-2 rounded-xl overflow-hidden",
          getImageGridClass(imageUrls.length)
        )}>
          {imageUrls.map((url, index) => (
            <a
              key={`img-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block overflow-hidden bg-muted",
                // Make first image span full width if 3 images
                imageUrls.length === 3 && index === 0 && "col-span-2",
                // Aspect ratio based on count
                imageUrls.length === 1 ? "aspect-auto max-h-[500px]" : "aspect-square"
              )}
            >
              <img
                src={url}
                alt=""
                className={cn(
                  "w-full h-full object-cover hover:scale-105 transition-transform duration-300",
                  imageUrls.length === 1 && "object-contain"
                )}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {/* Videos */}
      {videoUrls.map((url, index) => (
        <div key={`video-${index}`} className="rounded-xl overflow-hidden bg-black">
          <video
            src={url}
            controls
            preload="metadata"
            className="w-full max-h-[500px]"
          >
            <source src={url} />
            Your browser does not support the video tag.
          </video>
        </div>
      ))}
    </div>
  );
}

// Helper component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName
          ? "text-blue-500"
          : "text-gray-500 hover:text-gray-700"
      )}
    >
      @{displayName}
    </Link>
  );
}
