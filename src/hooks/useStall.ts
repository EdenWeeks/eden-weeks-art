import type { NostrEvent } from '@nostrify/nostrify';

import { useShopQuery } from '@/hooks/useShopQuery';

interface StallData {
  id: string;
  name: string;
  description?: string;
  currency: string;
  shipping: Array<{
    id: string;
    name?: string;
    cost: number;
    countries?: string[];
  }>;
}

interface Stall {
  event: NostrEvent;
  data: StallData;
}

/** Parse + validate a NIP-15 stall event; null if it isn't a usable stall. */
function parseStall(event: NostrEvent): Stall | null {
  try {
    const data: StallData = JSON.parse(event.content);

    // Validate required fields
    if (!data.id || !data.name || !data.currency) {
      console.error('Invalid stall data:', data);
      return null;
    }

    return { event, data };
  } catch (error) {
    console.error('Failed to parse stall data:', error);
    return null;
  }
}

/**
 * Hook to fetch a stall by ID from a specific merchant
 * @param merchantPubkey - The merchant's public key
 * @param stallId - The stall ID (d tag value)
 */
export function useStall(merchantPubkey: string, stallId: string) {
  return useShopQuery({
    queryKey: ['stall', merchantPubkey, stallId],
    filters: [{ kinds: [30017], authors: [merchantPubkey], '#d': [stallId], limit: 1 }],
    derive: (events) => {
      const newest = [...events].sort((a, b) => b.created_at - a.created_at)[0];
      return newest ? parseStall(newest) : null;
    },
    enabled: !!merchantPubkey && !!stallId,
  });
}

/**
 * Hook to fetch all stalls from a merchant
 * @param merchantPubkey - The merchant's public key
 */
export function useStalls(merchantPubkey: string) {
  return useShopQuery({
    queryKey: ['stalls', merchantPubkey],
    filters: [{ kinds: [30017], authors: [merchantPubkey] }],
    derive: (events) =>
      events.map(parseStall).filter((stall): stall is Stall => stall !== null),
    enabled: !!merchantPubkey,
  });
}
