import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { unwrapGiftWrap } from '@/lib/giftWrap';
import { ORDER_PROCESS_KIND, ORDER_MESSAGE_TYPE } from '@/lib/gammaOrderUtils';
import { MERCHANT_PUBKEY } from '@/lib/merchant';

export interface GammaPaymentRequest {
  orderId: string;
  invoice: string;
  amountSats?: number;
  message?: string;
}

/**
 * Watch for the merchant's gift-wrapped kind-16 (type 2) payment request for a
 * given order — the order service's automatic Lightning invoice. Polls the
 * user's incoming gift wraps until one matches, then stops.
 *
 * Gift-wrap timestamps are fuzzed up to two days into the past (NIP-59), so
 * the query looks back further than the order time.
 */
export function useGammaPaymentRequest(orderId: string | null) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery<GammaPaymentRequest | null>({
    queryKey: ['gamma-payment-request', orderId, user?.pubkey],
    enabled: Boolean(orderId && user?.signer.nip44),
    refetchInterval: (query) => (query.state.data ? false : 5000),
    queryFn: async (c) => {
      if (!user || !orderId) return null;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(8000)]);
      const twoDays = 2 * 24 * 60 * 60;
      const wraps = await nostr.query(
        [{ kinds: [1059], '#p': [user.pubkey], since: Math.floor(Date.now() / 1000) - twoDays - 3600 }],
        { signal }
      );

      for (const wrap of wraps) {
        const rumor = await unwrapGiftWrap(user, wrap);
        if (!rumor || rumor.kind !== ORDER_PROCESS_KIND) continue;
        if (rumor.pubkey !== MERCHANT_PUBKEY) continue;
        const get = (name: string) => rumor.tags.find(([n]) => n === name);
        if (get('type')?.[1] !== ORDER_MESSAGE_TYPE.PAYMENT_REQUEST) continue;
        if (get('order')?.[1] !== orderId) continue;
        const payment = get('payment');
        if (payment?.[1] !== 'lightning' || !payment?.[2]) continue;
        const amountTag = get('amount')?.[1];
        return {
          orderId,
          invoice: payment[2],
          amountSats: amountTag ? parseInt(amountTag, 10) : undefined,
          message: rumor.content || undefined,
        };
      }
      return null;
    },
  });
}
