import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { giftWrap } from '@/lib/giftWrap';
import {
  createOrderRumor,
  createOrderSummaryRumor,
  generateOrderId,
  shippingOptionRef,
  type GammaOrderItem,
  type GammaOrderShipping,
} from '@/lib/gammaOrderUtils';
import { MERCHANT_PUBKEY } from '@/lib/merchant';
import type { ShippingOptionData } from '@/lib/productUtils';

interface GammaCheckoutParams {
  item: GammaOrderItem;
  shipping: Omit<GammaOrderShipping, 'shippingRef'>;
  shippingOption?: ShippingOptionData;
}

/**
 * Submit a Gamma Markets order: a structured kind-16 (type 1) order rumor plus
 * a human-readable kind-14 summary, both NIP-17 gift-wrapped to Eden (and to
 * the buyer, so the thread shows in their own Messages drawer). Eden replies
 * with a Lightning invoice over the same DM channel.
 */
export function useGammaCheckout() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ item, shipping, shippingOption }: GammaCheckoutParams) => {
      if (!user) throw new Error('You must be logged in to place an order');

      const orderId = generateOrderId();
      const fullShipping: GammaOrderShipping = {
        ...shipping,
        shippingRef: shippingOption ? shippingOptionRef(shippingOption) : undefined,
      };

      const orderRumor = createOrderRumor(orderId, [item], fullShipping, MERCHANT_PUBKEY);
      const summaryRumor = createOrderSummaryRumor(
        orderId,
        [item],
        fullShipping,
        shippingOption,
        MERCHANT_PUBKEY
      );

      const orderWraps = await giftWrap(user, MERCHANT_PUBKEY, orderRumor);
      const summaryWraps = await giftWrap(user, MERCHANT_PUBKEY, summaryRumor);

      const publishes = await Promise.allSettled(
        [
          orderWraps.recipientWrap,
          orderWraps.senderWrap,
          summaryWraps.recipientWrap,
          summaryWraps.senderWrap,
        ].map((event) => nostr.event(event, { signal: AbortSignal.timeout(5000) }))
      );

      // The order stands as long as Eden's copy of the structured order made it
      // out; the other three wraps are conveniences.
      if (publishes[0].status === 'rejected') {
        throw new Error('Could not send the order. Please try again.');
      }

      return { orderId };
    },
  });
}
