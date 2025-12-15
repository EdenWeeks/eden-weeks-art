import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface PaymentOption {
  type: string;
  link: string;
}

interface PaymentRequest {
  type: 1;
  id: string;
  message?: string;
  payment_options: PaymentOption[];
}

/**
 * Hook for waiting for NIP-15 payment request (type 1) from merchant
 * After sending an order (type 0), the merchant responds with an invoice
 */
export function usePaymentRequest() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  /**
   * Wait for a payment request from the merchant for a specific order
   * @param merchantPubkey - The merchant's public key
   * @param orderId - The order ID to match
   * @param timeoutMs - Maximum time to wait (default 30 seconds)
   * @returns The Lightning invoice from the payment request
   */
  const waitForPaymentRequest = async (
    merchantPubkey: string,
    orderId: string,
    timeoutMs: number = 30000
  ): Promise<{ invoice: string; message?: string }> => {
    if (!user) {
      throw new Error('User not logged in');
    }

    if (!user.signer.nip04) {
      throw new Error('NIP-04 decryption not supported');
    }

    console.log('[PaymentRequest] Waiting for payment request from', merchantPubkey, 'for order', orderId);
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      // Query for kind 4 DMs from the merchant to the user
      const filter = {
        kinds: [4],
        authors: [merchantPubkey],
        '#p': [user.pubkey],
        since: Math.floor((Date.now() - 300000) / 1000), // Last 5 minutes
        limit: 10,
      };
      console.log('[PaymentRequest] Querying for DMs:', filter);
      let events;
      try {
        // Add 10 second timeout using AbortSignal
        events = await nostr.query([filter], { signal: AbortSignal.timeout(10000) });
        console.log('[PaymentRequest] Found', events.length, 'DM events');
      } catch (queryErr) {
        console.error('[PaymentRequest] Query failed:', queryErr);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        continue;
      }

      // Check each event for a matching payment request
      for (const event of events) {
        try {
          // Decrypt the message
          const decrypted = await user.signer.nip04.decrypt(
            merchantPubkey,
            event.content
          );
          console.log('[PaymentRequest] Decrypted message:', decrypted.slice(0, 100));

          // Try to parse as JSON
          const parsed = JSON.parse(decrypted) as PaymentRequest;
          console.log('[PaymentRequest] Parsed JSON type:', parsed.type, 'id:', parsed.id);

          // Check if it's a type 1 payment request for our order
          if (parsed.type === 1 && parsed.id === orderId) {
            console.log('[PaymentRequest] Found matching payment request!');
            // Find the Lightning invoice
            const lnOption = parsed.payment_options?.find(
              (opt) => opt.type === 'ln'
            );

            if (lnOption?.link) {
              return {
                invoice: lnOption.link,
                message: parsed.message,
              };
            }
          }
        } catch (err) {
          // Not a valid JSON message or decryption failed, skip
          console.log('[PaymentRequest] Failed to process event:', err);
          continue;
        }
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout waiting for payment request from merchant');
  };

  /**
   * Poll for NIP-15 payment status update (type 2) from merchant
   * Called after invoice is displayed to detect when payment is received
   */
  const waitForPaymentConfirmation = async (
    merchantPubkey: string,
    orderId: string,
    timeoutMs: number = 120000 // 2 minute timeout
  ): Promise<{ paid: boolean; shipped?: boolean; message?: string }> => {
    if (!user) {
      throw new Error('User not logged in');
    }

    if (!user.signer.nip04) {
      throw new Error('NIP-04 decryption not supported');
    }

    console.log('[PaymentStatus] Waiting for payment confirmation for order', orderId);
    const startTime = Date.now();
    const pollInterval = 3000; // Check every 3 seconds

    while (Date.now() - startTime < timeoutMs) {
      const filter = {
        kinds: [4],
        authors: [merchantPubkey],
        '#p': [user.pubkey],
        since: Math.floor((Date.now() - 300000) / 1000), // Last 5 minutes
        limit: 20,
      };

      try {
        const events = await nostr.query([filter], { signal: AbortSignal.timeout(10000) });

        for (const event of events) {
          try {
            const decrypted = await user.signer.nip04.decrypt(
              merchantPubkey,
              event.content
            );

            const parsed = JSON.parse(decrypted);

            // Check for type 2 (order status update) for our order
            if (parsed.type === 2 && parsed.id === orderId) {
              console.log('[PaymentStatus] Found status update:', parsed);
              return {
                paid: parsed.paid === true,
                shipped: parsed.shipped === true,
                message: parsed.message,
              };
            }
          } catch {
            continue;
          }
        }
      } catch (err) {
        console.error('[PaymentStatus] Query failed:', err);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error('Timeout waiting for payment confirmation');
  };

  return { waitForPaymentRequest, waitForPaymentConfirmation };
}
