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
 * Hook for submitting NIP-15 marketplace orders
 * Sends encrypted order to merchant via NIP-04 DM (kind 4)
 * The merchant receives the order in their Nostr client and responds there
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

      const orderId = generateOrderId();
      const total = params.price * params.quantity + params.shippingCost;
      const isDigital = params.shippingCost === 0;

      // Build human-readable order message
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

      const plaintext = lines.join('\n');

      // Encrypt content using NIP-04
      if (!user.signer.nip04) {
        throw new Error('Your login method does not support encrypted messages');
      }
      const encrypted = await user.signer.nip04.encrypt(params.merchantPubkey, plaintext);

      // Create and sign kind 4 DM event
      const event = await user.signer.signEvent({
        kind: 4,
        content: encrypted,
        tags: [['p', params.merchantPubkey]],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish to relays
      await nostr.event(event, { signal: AbortSignal.timeout(5000) });

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
