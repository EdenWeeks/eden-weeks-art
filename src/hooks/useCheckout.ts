import { useMutation } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  type ShippingAddress,
  formatShippingAddress,
  generateOrderId,
} from '@/types/order';

interface CheckoutParams {
  merchantPubkey: string;
  productId: string;
  productName: string;
  quantity: number;
  shippingId: string;
  shippingZoneName: string;
  price: number;
  shippingCost: number;
  currency: string;
  address?: ShippingAddress;
  email?: string;
  phone?: string;
  message?: string;
}

interface CheckoutResult {
  orderId: string;
  success: boolean;
}

/**
 * NIP-15 Order structure (type 0 = new order)
 */
interface NIP15Order {
  id: string;
  type: 0;
  name?: string;
  address?: string;
  message?: string;
  contact: {
    nostr: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_id: string;
}

/**
 * Hook for submitting NIP-15 marketplace orders
 * Sends two encrypted messages to merchant via NIP-04 DM (kind 4):
 * 1. NIP-15 structured order JSON (for LNbits Nostr Market extension)
 * 2. Human-readable notification (for regular Nostr clients like Primal/Damus)
 */
export function useCheckout() {
  const { nostr } = useNostr();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  return useMutation<CheckoutResult, Error, CheckoutParams>({
    mutationFn: async (params) => {
      if (!user) {
        throw new Error('You must be logged in to place an order');
      }

      if (!user.signer.nip04) {
        throw new Error('Your login method does not support encrypted messages');
      }

      const orderId = generateOrderId();
      const total = params.price * params.quantity + params.shippingCost;
      const isDigital = params.shippingCost === 0;

      // Build NIP-15 structured order (for LNbits Nostr Market)
      const nip15Order: NIP15Order = {
        id: orderId,
        type: 0,
        contact: {
          nostr: user.pubkey,
          ...(params.email && { email: params.email }),
          ...(params.phone && { phone: params.phone }),
        },
        items: [
          {
            product_id: params.productId,
            quantity: params.quantity,
          },
        ],
        shipping_id: params.shippingId,
        ...(params.message && { message: params.message }),
        ...(!isDigital && params.address && {
          address: formatShippingAddress(params.address),
          name: params.address.fullName,
        }),
      };

      // Build human-readable order notification (for Nostr clients)
      const lines: string[] = [
        `🛒 NEW ORDER #${orderId.slice(0, 8).toUpperCase()}`,
        '',
        `📦 Product: ${params.productName}`,
        `   Quantity: ${params.quantity}`,
        `   Price: ${params.price} ${params.currency}`,
        '',
        `🚚 Shipping: ${params.shippingZoneName}`,
        `   Cost: ${params.shippingCost === 0 ? 'Free' : `${params.shippingCost} ${params.currency}`}`,
        '',
        `💰 TOTAL: ${total} ${params.currency}`,
        '',
      ];

      // Add address for physical products
      if (!isDigital && params.address) {
        lines.push(
          `📍 Shipping Address:`,
          ...formatShippingAddress(params.address).split('\n').map(line => `   ${line}`),
          ''
        );
      }

      // Contact info
      lines.push(`📧 Contact:`);
      if (params.email) lines.push(`   Email: ${params.email}`);
      if (params.phone) lines.push(`   Phone: ${params.phone}`);
      lines.push('');

      // Customer message
      if (params.message) {
        lines.push(`💬 Message from customer:`, `   ${params.message}`, '');
      }

      lines.push(`---`, `Order ID: ${orderId}`, `Product ID: ${params.productId}`);

      const humanReadableMessage = lines.join('\n');

      // Send NIP-15 structured order (for LNbits)
      const nip15Encrypted = await user.signer.nip04.encrypt(
        params.merchantPubkey,
        JSON.stringify(nip15Order)
      );

      const nip15Event = await user.signer.signEvent({
        kind: 4,
        content: nip15Encrypted,
        tags: [['p', params.merchantPubkey]],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(nip15Event, { signal: AbortSignal.timeout(5000) });

      // Send human-readable notification (for Nostr clients)
      const notificationEncrypted = await user.signer.nip04.encrypt(
        params.merchantPubkey,
        humanReadableMessage
      );

      const notificationEvent = await user.signer.signEvent({
        kind: 4,
        content: notificationEncrypted,
        tags: [['p', params.merchantPubkey]],
        created_at: Math.floor(Date.now() / 1000) + 1, // +1 second to ensure ordering
      });

      await nostr.event(notificationEvent, { signal: AbortSignal.timeout(5000) });

      return {
        orderId,
        success: true,
      };
    },
    onSuccess: (data) => {
      toast({
        title: 'Order sent!',
        description: `Order #${data.orderId.slice(0, 8)} sent to Eden. She'll respond with payment details in her Nostr app.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
