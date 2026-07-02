import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { MERCHANT_PUBKEY } from '@/lib/merchant';
import { PRODUCT_KIND, COLLECTION_KIND } from '@/lib/productAdmin';

/** Kind 30402 event with the tags a product listing requires. */
export function validateGammaProduct(event: NostrEvent): boolean {
  if (event.kind !== PRODUCT_KIND) return false;
  const d = event.tags.find(([name]) => name === 'd')?.[1];
  const title = event.tags.find(([name]) => name === 'title')?.[1];
  const price = event.tags.find(([name]) => name === 'price');
  return Boolean(d && title && price);
}

/** Newest event per addressable `d` tag. */
export function dedupeByDTag(events: NostrEvent[]): NostrEvent[] {
  const newestByD = new Map<string, NostrEvent>();
  for (const event of events) {
    const d = event.tags.find(([name]) => name === 'd')?.[1];
    if (!d) continue;
    const existing = newestByD.get(d);
    if (!existing || event.created_at > existing.created_at) {
      newestByD.set(d, event);
    }
  }
  return Array.from(newestByD.values());
}

/**
 * All of Eden's Gamma (kind 30402) product events, including hidden ones —
 * intended for the admin UI. The storefront uses `useUnifiedProducts`, which
 * applies the visibility filter.
 */
export function useGammaProducts(limit = 100) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['products', 'gamma', MERCHANT_PUBKEY, limit],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [PRODUCT_KIND], authors: [MERCHANT_PUBKEY], limit }],
        { signal }
      );
      return dedupeByDTag(events.filter(validateGammaProduct)).sort(
        (a, b) => b.created_at - a.created_at
      );
    },
  });
}

/** Eden's collections (kind 30405) — the storefront's category taxonomy. */
export function useCollections() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['collections', MERCHANT_PUBKEY],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [COLLECTION_KIND], authors: [MERCHANT_PUBKEY] }],
        { signal }
      );
      const valid = events.filter((event) => {
        const d = event.tags.find(([name]) => name === 'd')?.[1];
        const title = event.tags.find(([name]) => name === 'title')?.[1];
        return d && title;
      });
      return dedupeByDTag(valid).sort((a, b) => b.created_at - a.created_at);
    },
  });
}
