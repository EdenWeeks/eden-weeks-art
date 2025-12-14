/**
 * Lightning payment utilities using LNURL-pay protocol
 * Works with any Lightning address (lud16) from Nostr profiles
 */

export interface LnurlPayParams {
  callback: string;
  minSendable: number; // millisats
  maxSendable: number; // millisats
  metadata: string;
  tag: string;
  commentAllowed?: number;
}

export interface LnurlPayInvoice {
  pr: string; // bolt11 invoice
  routes: unknown[];
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
}

/**
 * Convert a Lightning address (user@domain.com) to LNURL-pay endpoint
 */
export function lightningAddressToLnurl(address: string): string {
  const [user, domain] = address.split('@');
  if (!user || !domain) {
    throw new Error('Invalid Lightning address format');
  }
  return `https://${domain}/.well-known/lnurlp/${user}`;
}

/**
 * Fetch LNURL-pay params from a Lightning address
 */
export async function fetchLnurlPayParams(lightningAddress: string): Promise<LnurlPayParams> {
  const url = lightningAddressToLnurl(lightningAddress);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch Lightning address info');
  }

  const data = await response.json();

  if (data.status === 'ERROR') {
    throw new Error(data.reason || 'LNURL error');
  }

  return data as LnurlPayParams;
}

/**
 * Request an invoice from LNURL-pay callback
 * @param params - LNURL-pay params from fetchLnurlPayParams
 * @param amountSats - Amount in satoshis
 * @param comment - Optional comment for the payment
 */
export async function requestInvoice(
  params: LnurlPayParams,
  amountSats: number,
  comment?: string
): Promise<LnurlPayInvoice> {
  const amountMillisats = amountSats * 1000;

  // Validate amount
  if (amountMillisats < params.minSendable) {
    throw new Error(`Amount too low. Minimum: ${Math.ceil(params.minSendable / 1000)} sats`);
  }
  if (amountMillisats > params.maxSendable) {
    throw new Error(`Amount too high. Maximum: ${Math.floor(params.maxSendable / 1000)} sats`);
  }

  // Build callback URL
  const url = new URL(params.callback);
  url.searchParams.set('amount', amountMillisats.toString());

  if (comment && params.commentAllowed && comment.length <= params.commentAllowed) {
    url.searchParams.set('comment', comment);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error('Failed to get invoice');
  }

  const data = await response.json();

  if (data.status === 'ERROR') {
    throw new Error(data.reason || 'Failed to generate invoice');
  }

  return data as LnurlPayInvoice;
}

/**
 * Try to pay using WebLN (browser extension like Alby)
 * Returns true if payment was successful, false if WebLN unavailable
 */
export async function payWithWebLN(bolt11: string): Promise<{ success: boolean; preimage?: string }> {
  // Check if WebLN is available
  if (typeof window === 'undefined' || !('webln' in window)) {
    return { success: false };
  }

  try {
    const webln = (window as { webln?: { enable: () => Promise<void>; sendPayment: (pr: string) => Promise<{ preimage: string }> } }).webln;
    if (!webln) {
      return { success: false };
    }

    await webln.enable();
    const result = await webln.sendPayment(bolt11);
    return { success: true, preimage: result.preimage };
  } catch (error) {
    // User cancelled or payment failed
    console.error('WebLN payment failed:', error);
    return { success: false };
  }
}

/**
 * Convert amount from fiat (GBP, USD, EUR) to satoshis
 * Uses a simple exchange rate fetch
 */
export async function fiatToSats(amount: number, currency: string): Promise<number> {
  try {
    // Use CoinGecko API for exchange rate
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency.toLowerCase()}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();
    const btcPrice = data.bitcoin[currency.toLowerCase()];

    if (!btcPrice) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    // Convert: amount in fiat -> BTC -> sats
    const btcAmount = amount / btcPrice;
    const sats = Math.ceil(btcAmount * 100_000_000);

    return sats;
  } catch (error) {
    console.error('Failed to convert fiat to sats:', error);
    throw new Error('Could not fetch current Bitcoin exchange rate');
  }
}
