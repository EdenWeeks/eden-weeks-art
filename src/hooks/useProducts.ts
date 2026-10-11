import type { NostrEvent } from '@nostrify/nostrify';

import { useShopQuery } from '@/hooks/useShopQuery';

export interface ProductShipping {
  id: string;
  cost: number;
}

export interface ProductData {
  id: string;
  stall_id: string;
  name: string;
  description?: string;
  images?: string[];
  currency: string;
  price: number;
  quantity: number | null;
  specs?: Array<[string, string]>;
  shipping?: ProductShipping[];
}

export interface Product {
  event: NostrEvent;
  data: ProductData;
}

/** Parse + validate a NIP-15 product event; null if it isn't a usable product. */
function parseProduct(event: NostrEvent): Product | null {
  try {
    const data: ProductData = JSON.parse(event.content);

    // Validate required fields
    if (!data.id || !data.stall_id || !data.name || !data.currency || data.price === undefined) {
      console.error('Invalid product data:', data);
      return null;
    }

    return { event, data };
  } catch (error) {
    console.error('Failed to parse product data:', error);
    return null;
  }
}

/**
 * Hook to fetch products from a specific stall
 * @param merchantPubkey - The merchant's public key
 * @param stallId - Optional stall ID to filter products
 */
export function useProducts(merchantPubkey: string, stallId?: string) {
  return useShopQuery({
    queryKey: ['products', merchantPubkey, stallId],
    filters: [{ kinds: [30018], authors: [merchantPubkey] }],
    derive: (events) =>
      events
        .map(parseProduct)
        .filter((product): product is Product => product !== null)
        // Filter by stall_id if provided
        .filter((product) => !stallId || product.data.stall_id === stallId),
    enabled: !!merchantPubkey,
  });
}

/**
 * Hook to fetch a single product by ID
 * @param merchantPubkey - The merchant's public key
 * @param productId - The product ID (d tag value)
 */
export function useProduct(merchantPubkey: string, productId: string) {
  return useShopQuery({
    queryKey: ['product', merchantPubkey, productId],
    filters: [{ kinds: [30018], authors: [merchantPubkey], '#d': [productId], limit: 1 }],
    derive: (events) => {
      const newest = [...events].sort((a, b) => b.created_at - a.created_at)[0];
      return newest ? parseProduct(newest) : null;
    },
    enabled: !!merchantPubkey && !!productId,
  });
}
