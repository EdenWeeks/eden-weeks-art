import type { NostrEvent } from '@nostrify/nostrify';

import { useShopQuery } from '@/hooks/useShopQuery';

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
  return useShopQuery({
    queryKey: ['products', 'gamma', MERCHANT_PUBKEY, limit],
    filters: [{ kinds: [PRODUCT_KIND], authors: [MERCHANT_PUBKEY], limit }],
    derive: (events) =>
      dedupeByDTag(events.filter(validateGammaProduct)).sort(
        (a, b) => b.created_at - a.created_at
      ),
  });
}

/** Eden's collections (kind 30405) — the storefront's category taxonomy. */
export function useCollections() {
  return useShopQuery({
    queryKey: ['collections', MERCHANT_PUBKEY],
    filters: [{ kinds: [COLLECTION_KIND], authors: [MERCHANT_PUBKEY] }],
    derive: (events) => {
      const valid = events.filter((event) => {
        const d = event.tags.find(([name]) => name === 'd')?.[1];
        const title = event.tags.find(([name]) => name === 'title')?.[1];
        return d && title;
      });
      return dedupeByDTag(valid).sort((a, b) => b.created_at - a.created_at);
    },
  });
}
