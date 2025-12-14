import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

// Media detection patterns
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|mkv|m4v)(\?.*)?$/i;
const URL_REGEX = /https?:\/\/[^\s]+/g;

function hasMedia(content: string): boolean {
  const urls = content.match(URL_REGEX) || [];
  return urls.some(url => IMAGE_EXTENSIONS.test(url) || VIDEO_EXTENSIONS.test(url));
}

interface PostsOptions {
  excludeReplies?: boolean;
  mediaOnly?: boolean;
}

/**
 * Hook to fetch kind 1 posts from a specific user
 * @param pubkey - The user's public key
 * @param limit - Maximum number of posts to fetch (default 50)
 * @param options - Filter options (excludeReplies, mediaOnly)
 */
export function usePosts(pubkey: string, limit = 50, options: PostsOptions | boolean = {}) {
  const { nostr } = useNostr();

  // Support legacy boolean parameter for backwards compatibility
  const opts: PostsOptions = typeof options === 'boolean'
    ? { excludeReplies: options }
    : options;

  const { excludeReplies = false, mediaOnly = false } = opts;

  return useQuery({
    queryKey: ['posts', pubkey, limit, excludeReplies, mediaOnly],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Fetch more if we're filtering
      const fetchMultiplier = (excludeReplies ? 3 : 1) * (mediaOnly ? 5 : 1);

      const events = await nostr.query(
        [{
          kinds: [1],
          authors: [pubkey],
          limit: limit * fetchMultiplier,
        }],
        { signal }
      );

      let filtered = events;

      // Filter out replies (posts that have 'e' tags referencing other events)
      if (excludeReplies) {
        filtered = filtered.filter(event => {
          const hasReplyTag = event.tags.some(tag => tag[0] === 'e');
          return !hasReplyTag;
        });
      }

      // Filter to only posts with media (images or videos)
      if (mediaOnly) {
        filtered = filtered.filter(event => hasMedia(event.content));
      }

      // Sort by created_at descending (newest first) and limit
      return filtered
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit);
    },
    enabled: !!pubkey,
  });
}
