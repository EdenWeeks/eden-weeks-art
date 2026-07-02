import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { MERCHANT_PUBKEY, STALL_ID } from '@/lib/merchant';
import { PRODUCT_KIND } from '@/lib/productAdmin';
import { parseProductEvent, type ProductData as GammaProductData } from '@/lib/productUtils';
import type { ProductData as Nip15ProductData } from '@/hooks/useProducts';
import { validateGammaProduct, dedupeByDTag } from '@/hooks/useGammaProducts';

export type ProductProtocol = 'nip15' | 'gamma';

const NIP15_PRODUCT_KIND = 30018;

/**
 * One product shape for the storefront, whichever protocol it came from.
 * Until Eden's catalog is fully migrated to Gamma (NIP-99 kind 30402), her
 * legacy LNbits listings (NIP-15 kind 30018) must keep showing alongside the
 * new ones. A migrated product exists under BOTH kinds with the same
 * identifier — the Gamma version wins so it never shows twice.
 */
export interface UnifiedProduct {
  protocol: ProductProtocol;
  /** d-tag (Gamma) / product id (NIP-15) — shared across a migration. */
  id: string;
  name: string;
  description?: string;
  images: string[];
  price: number;
  currency: string;
  /** null/undefined = unlimited or unknown. */
  stock?: number | null;
  categories: string[];
  event: NostrEvent;
  /** Present when protocol === 'nip15'. */
  nip15?: Nip15ProductData;
  /** Present when protocol === 'gamma'. */
  gamma?: GammaProductData;
}

function fromNip15(event: NostrEvent): UnifiedProduct | null {
  try {
    const data: Nip15ProductData = JSON.parse(event.content);
    if (!data.id || !data.stall_id || !data.name || !data.currency || data.price === undefined) {
      return null;
    }
    if (STALL_ID && data.stall_id !== STALL_ID) return null;
    return {
      protocol: 'nip15',
      id: data.id,
      name: data.name,
      description: data.description,
      images: data.images ?? [],
      price: data.price,
      currency: data.currency,
      stock: data.quantity,
      categories: event.tags.filter(([name]) => name === 't').map(([, t]) => t),
      event,
      nip15: data,
    };
  } catch {
    return null;
  }
}

function fromGamma(event: NostrEvent): UnifiedProduct | null {
  const data = parseProductEvent(event);
  if (!data) return null;
  return {
    protocol: 'gamma',
    id: data.id,
    name: data.title,
    description: data.content || data.summary,
    images: data.images.map((image) => image.url),
    price: Number(data.price.amount),
    currency: data.price.currency,
    stock: data.stock ?? null,
    categories: data.categories,
    event,
    gamma: data,
  };
}

/** Storefront sees only sellable Gamma listings (hidden stays owner-only). */
function isPubliclyVisible(product: UnifiedProduct): boolean {
  if (product.protocol !== 'gamma') return true;
  const visibility = product.gamma?.visibility;
  return !visibility || visibility === 'on-sale' || visibility === 'pre-order';
}

/**
 * Merge both protocols and drop the NIP-15 copy of anything already migrated
 * (same identifier under both kinds).
 */
export function mergeProducts(
  nip15: UnifiedProduct[],
  gamma: UnifiedProduct[]
): UnifiedProduct[] {
  const gammaIds = new Set(gamma.map((product) => product.id));
  const unmigrated = nip15.filter((product) => !gammaIds.has(product.id));
  return [...gamma, ...unmigrated].sort((a, b) => b.event.created_at - a.event.created_at);
}

/**
 * Eden's storefront catalog across both protocols, in a single relay query.
 * `includeHidden` is for the owner's admin views.
 */
export function useUnifiedProducts(options?: { includeHidden?: boolean }) {
  const { nostr } = useNostr();
  const includeHidden = options?.includeHidden ?? false;

  return useQuery({
    queryKey: ['products', 'unified', MERCHANT_PUBKEY, includeHidden],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [NIP15_PRODUCT_KIND, PRODUCT_KIND], authors: [MERCHANT_PUBKEY] }],
        { signal }
      );

      const nip15 = events
        .filter((event) => event.kind === NIP15_PRODUCT_KIND)
        .map(fromNip15)
        .filter((product): product is UnifiedProduct => product !== null);

      const gamma = dedupeByDTag(
        events.filter((event) => event.kind === PRODUCT_KIND).filter(validateGammaProduct)
      )
        .map(fromGamma)
        .filter((product): product is UnifiedProduct => product !== null);

      const merged = mergeProducts(nip15, gamma);
      return includeHidden ? merged : merged.filter(isPubliclyVisible);
    },
  });
}

/** A single product by identifier, preferring the Gamma version if migrated. */
export function useUnifiedProduct(id: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['product', 'unified', MERCHANT_PUBKEY, id],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query(
        [{ kinds: [NIP15_PRODUCT_KIND, PRODUCT_KIND], authors: [MERCHANT_PUBKEY], '#d': [id] }],
        { signal }
      );

      const gammaEvents = dedupeByDTag(
        events.filter((event) => event.kind === PRODUCT_KIND).filter(validateGammaProduct)
      );
      if (gammaEvents.length > 0) {
        return fromGamma(gammaEvents[0]);
      }

      const nip15Event = events
        .filter((event) => event.kind === NIP15_PRODUCT_KIND)
        .sort((a, b) => b.created_at - a.created_at)[0];
      return nip15Event ? fromNip15(nip15Event) : null;
    },
    enabled: !!id,
  });
}
