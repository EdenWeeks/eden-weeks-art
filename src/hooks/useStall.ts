import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

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

/**
 * Hook to fetch a stall by ID from a specific merchant
 * @param merchantPubkey - The merchant's public key
 * @param stallId - The stall ID (d tag value)
 */
export function useStall(merchantPubkey: string, stallId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['stall', merchantPubkey, stallId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{
          kinds: [30017],
          authors: [merchantPubkey],
          '#d': [stallId],
          limit: 1,
        }],
        { signal }
      );

      if (events.length === 0) {
        return null;
      }

      const event = events[0];
      
      try {
        const data: StallData = JSON.parse(event.content);

        // Validate required fields
        if (!data.id || !data.name || !data.currency) {
          console.error('Invalid stall data:', data);
          return null;
        }

        return {
          event,
          data,
        } as Stall;
      } catch (error) {
        console.error('Failed to parse stall data:', error);
        return null;
      }
    },
    enabled: !!merchantPubkey && !!stallId,
  });
}

/**
 * Hook to fetch all stalls from a merchant
 * @param merchantPubkey - The merchant's public key
 */
export function useStalls(merchantPubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['stalls', merchantPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{
          kinds: [30017],
          authors: [merchantPubkey],
        }],
        { signal }
      );

      const stalls: Stall[] = [];

      for (const event of events) {
        try {
          const data: StallData = JSON.parse(event.content);
          
          // Validate required fields
          if (data.id && data.name && data.currency) {
            stalls.push({ event, data });
          }
        } catch (error) {
          console.error('Failed to parse stall data:', error);
        }
      }

      return stalls;
    },
    enabled: !!merchantPubkey,
  });
}
