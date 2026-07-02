import type { NostrEvent } from '@nostrify/nostrify';

import { PRODUCT_KIND } from '@/lib/productAdmin';
import type { ProductData as Nip15ProductData } from '@/hooks/useProducts';

/**
 * Build the unsigned Gamma listing (kind 30402) equivalent of a NIP-15
 * product (kind 30018) — the "Transfer to NIP-99" action.
 *
 * The Gamma event reuses the NIP-15 product id as its `d` tag. That single
 * decision drives the whole migration story: the storefront's unified query
 * treats same-id listings as one product and prefers the Gamma version, so the
 * NIP-15 event can stay published (LNbits keeps working) without the site ever
 * showing a duplicate.
 */
export function buildGammaFromNip15(
  data: Nip15ProductData,
  event: NostrEvent
): { kind: number; content: string; tags: string[][]; created_at: number } {
  const now = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ['d', data.id],
    ['title', data.name],
    ['price', String(data.price), data.currency],
  ];

  (data.images ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .forEach((url, index) => tags.push(['image', url, '', index.toString()]));

  tags.push(['type', 'simple', 'physical']);
  tags.push(['visibility', 'on-sale']);

  // NIP-15 quantity: null = unlimited (no stock tag).
  if (data.quantity !== null && data.quantity !== undefined) {
    tags.push(['stock', String(data.quantity)]);
  }

  (data.specs ?? []).forEach(([key, value]) => tags.push(['spec', key, value]));

  // Carry over the product's searchable categories (`t` tags live on the
  // NIP-15 event itself, not in its JSON content).
  const categories = new Set(
    event.tags.filter(([name]) => name === 't').map(([, category]) => category)
  );
  categories.forEach((category) => tags.push(['t', category]));

  // Keep the original listing date.
  tags.push(['published_at', String(event.created_at)]);

  return {
    kind: PRODUCT_KIND,
    content: data.description ?? '',
    tags,
    created_at: now,
  };
}
