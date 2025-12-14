import { useMemo } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { usePosts } from '@/hooks/usePosts';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { NavBar } from '@/components/NavBar';
import { ZapButton } from '@/components/ZapButton';
import { Images } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';

// Eden's npub: npub1enuxqa5g0cggf849yqzd53nu0x28w69sk6xzpx2q4ej75r8tuz2sh9l3eu
const EDEN_PUBKEY = 'ccf86076887e10849ea52004da467c79947768b0b68c209940ae65ea0cebe095';
const STALL_ID = 'ic5HtZ7CBy7JZPPFs36Kas';

// Media detection patterns
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i;
const URL_REGEX = /https?:\/\/[^\s]+/g;

// Blocked media URLs
const BLOCKED_URLS = new Set([
  'https://m.primal.net/JhON.mov',
  'https://m.primal.net/JhOJ.mov',
  'https://m.primal.net/JhOH.mov',
  'https://m.primal.net/JhNo.mov',
]);

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  source: 'post' | 'product';
  productId?: string;
  event?: NostrEvent; // The source event for zapping
}

function extractMediaFromContent(content: string): { images: string[]; videos: string[] } {
  const urls = content.match(URL_REGEX);
  const images: string[] = [];
  const videos: string[] = [];

  if (urls) {
    for (const url of urls) {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
      if (IMAGE_EXTENSIONS.test(cleanUrl)) {
        images.push(cleanUrl);
      } else if (VIDEO_EXTENSIONS.test(cleanUrl)) {
        videos.push(cleanUrl);
      }
    }
  }

  return { images, videos };
}

// Deterministic "random" size based on index for consistent layout
function getItemSize(index: number): 'small' | 'medium' | 'large' {
  const pattern = [
    'large', 'small', 'medium', 'small',
    'medium', 'large', 'small', 'small',
    'small', 'medium', 'large', 'medium',
    'large', 'small', 'small', 'medium',
  ];
  return pattern[index % pattern.length] as 'small' | 'medium' | 'large';
}

const Gallery = () => {
  useSeoMeta({
    title: 'Gallery - Eden Weeks Art',
    description: 'Browse the complete gallery of artwork and creative works by Eden Weeks.',
  });

  const { data: posts, isLoading: postsLoading } = usePosts(EDEN_PUBKEY, 100, { excludeReplies: true, mediaOnly: true });
  const { data: products, isLoading: productsLoading } = useProducts(EDEN_PUBKEY, STALL_ID);

  const isLoading = postsLoading || productsLoading;

  // Collect all media items
  const mediaItems = useMemo(() => {
    const items: MediaItem[] = [];
    const seenUrls = new Set<string>();

    // Extract from products first (higher priority)
    if (products) {
      products.forEach(product => {
        product.data.images?.forEach(url => {
          if (!seenUrls.has(url) && !BLOCKED_URLS.has(url)) {
            seenUrls.add(url);
            items.push({
              url,
              type: 'image',
              source: 'product',
              productId: product.data.id,
              event: product.event,
            });
          }
        });
      });
    }

    // Extract from posts
    if (posts) {
      posts.forEach(post => {
        const { images, videos } = extractMediaFromContent(post.content);

        images.forEach(url => {
          if (!seenUrls.has(url) && !BLOCKED_URLS.has(url)) {
            seenUrls.add(url);
            items.push({ url, type: 'image', source: 'post', event: post });
          }
        });

        videos.forEach(url => {
          if (!seenUrls.has(url) && !BLOCKED_URLS.has(url)) {
            seenUrls.add(url);
            items.push({ url, type: 'video', source: 'post', event: post });
          }
        });
      });
    }

    return items;
  }, [posts, products]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of my artwork, creative experiments, and visual stories.
          </p>
        </div>

        {/* Masonry Grid */}
        {isLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-full rounded-xl break-inside-avoid"
                style={{ height: `${150 + (i % 3) * 100}px` }}
              />
            ))}
          </div>
        ) : mediaItems.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {mediaItems.map((item, index) => {
              const size = getItemSize(index);
              const heightClass = size === 'large' ? 'aspect-[3/4]' : size === 'medium' ? 'aspect-square' : 'aspect-[4/3]';

              return (
                <div
                  key={`${item.url}-${index}`}
                  className="break-inside-avoid mb-4 group/card"
                >
                  {item.type === 'image' ? (
                    <div className="relative">
                      {item.source === 'product' && item.productId ? (
                        <Link to={`/product/${item.productId}`} className="block group">
                          <div className={`relative ${heightClass} overflow-hidden rounded-xl bg-muted`}>
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        </Link>
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block group"
                        >
                          <div className={`relative ${heightClass} overflow-hidden rounded-xl bg-muted`}>
                            <img
                              src={item.url}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        </a>
                      )}
                      {/* Zap Button */}
                      {item.event && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <div className="bg-amber-50 hover:bg-amber-100 rounded-full px-3 py-1.5 shadow-lg">
                            <ZapButton
                              target={item.event}
                              className="text-amber-600 hover:text-amber-700 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                        <video
                          src={item.url}
                          controls
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Zap Button for videos */}
                      {item.event && (
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <div className="bg-amber-50 hover:bg-amber-100 rounded-full px-3 py-1.5 shadow-lg">
                            <ZapButton
                              target={item.event}
                              className="text-amber-600 hover:text-amber-700 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <Images className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No images or videos found yet.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-violet-100 to-indigo-100 py-12 mt-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Eden Weeks Logo"
                className="h-12 w-auto"
              />
              <span className="font-serif text-2xl font-bold text-violet-900">
                Eden Weeks
              </span>
            </div>

            <p className="text-violet-700 text-center max-w-md">
              Young artist from Cambridgeshire, England. Creating original artwork
              and custom commissions with passion.
            </p>

            <div className="flex items-center gap-2 text-sm text-violet-600">
              <span>Powered by Nostr & Bitcoin</span>
              <span>•</span>
              <a
                href="https://shakespeare.diy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-violet-900 transition-colors underline"
              >
                Vibed with Shakespeare
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Gallery;
