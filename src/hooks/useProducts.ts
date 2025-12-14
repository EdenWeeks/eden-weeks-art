import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

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

/**
 * Hook to fetch products from a specific stall
 * @param merchantPubkey - The merchant's public key
 * @param stallId - Optional stall ID to filter products
 */
export function useProducts(merchantPubkey: string, stallId?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['products', merchantPubkey, stallId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{
          kinds: [30018],
          authors: [merchantPubkey],
        }],
        { signal }
      );

      const products: Product[] = [];

      for (const event of events) {
        try {
          const data: ProductData = JSON.parse(event.content);
          
          // Validate required fields
          if (!data.id || !data.stall_id || !data.name || !data.currency || data.price === undefined) {
            console.error('Invalid product data:', data);
            continue;
          }

          // Filter by stall_id if provided
          if (stallId && data.stall_id !== stallId) {
            continue;
          }

          products.push({ event, data });
        } catch (error) {
          console.error('Failed to parse product data:', error);
        }
      }

      return products;
    },
    enabled: !!merchantPubkey,
  });
}

/**
 * Hook to fetch a single product by ID
 * @param merchantPubkey - The merchant's public key
 * @param productId - The product ID (d tag value)
 */
export function useProduct(merchantPubkey: string, productId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['product', merchantPubkey, productId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{
          kinds: [30018],
          authors: [merchantPubkey],
          '#d': [productId],
          limit: 1,
        }],
        { signal }
      );

      if (events.length === 0) {
        return null;
      }

      const event = events[0];
      
      try {
        const data: ProductData = JSON.parse(event.content);

        // Validate required fields
        if (!data.id || !data.stall_id || !data.name || !data.currency || data.price === undefined) {
          console.error('Invalid product data:', data);
          return null;
        }

        return {
          event,
          data,
        } as Product;
      } catch (error) {
        console.error('Failed to parse product data:', error);
        return null;
      }
    },
    enabled: !!merchantPubkey && !!productId,
  });
}
