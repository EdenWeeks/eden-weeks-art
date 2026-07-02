import { PRODUCT_KIND, SHIPPING_OPTION_KIND } from '@/lib/productAdmin';
import type { ShippingOptionData } from '@/lib/productUtils';

/** Gamma Markets order-processing kinds. */
export const ORDER_GENERAL_KIND = 14; // readable NIP-17 summary
export const ORDER_PROCESS_KIND = 16; // structured order messages

export const ORDER_MESSAGE_TYPE = {
  ORDER_CREATION: '1',
  PAYMENT_REQUEST: '2',
  STATUS_UPDATE: '3',
  SHIPPING_UPDATE: '4',
} as const;

export function generateOrderId(): string {
  return crypto.randomUUID();
}

export interface GammaOrderShipping {
  /** Coordinate of the chosen shipping option: "30406:<pubkey>:<d>". */
  shippingRef?: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone?: string;
  message?: string;
}

export interface GammaOrderItem {
  /** Product d-tag. */
  productId: string;
  productPubkey: string;
  title: string;
  quantity: number;
  priceAmount: string;
  priceCurrency: string;
}

function formatAddress(shipping: GammaOrderShipping): string {
  return [shipping.name, shipping.address, shipping.city, shipping.postcode, shipping.country]
    .filter(Boolean)
    .join(', ');
}

/**
 * Structured Gamma order-creation rumor (kind 16, type 1), per the Gamma
 * Markets spec. The chosen shipping option travels as its addressable
 * coordinate so the merchant knows exactly what was selected.
 */
export function createOrderRumor(
  orderId: string,
  items: GammaOrderItem[],
  shipping: GammaOrderShipping,
  merchantPubkey: string,
  totalSats?: number
): { kind: number; content: string; tags: string[][]; created_at: number } {
  const tags: string[][] = [
    ['p', merchantPubkey],
    ['subject', `Order ${orderId.slice(0, 8)}`],
    ['type', ORDER_MESSAGE_TYPE.ORDER_CREATION],
    ['order', orderId],
  ];
  // All-in total in sats — the order service requires this to invoice.
  if (totalSats && Number.isFinite(totalSats) && totalSats > 0) {
    tags.push(['amount', Math.round(totalSats).toString()]);
  }

  for (const item of items) {
    tags.push(['item', `${PRODUCT_KIND}:${item.productPubkey}:${item.productId}`, item.quantity.toString()]);
  }

  if (shipping.shippingRef) tags.push(['shipping', shipping.shippingRef]);
  tags.push(['address', formatAddress(shipping)]);
  if (shipping.email) tags.push(['email', shipping.email]);
  if (shipping.phone) tags.push(['phone', shipping.phone]);

  return {
    kind: ORDER_PROCESS_KIND,
    content: shipping.message ?? '',
    tags,
    created_at: Math.floor(Date.now() / 1000),
  };
}

/** Coordinate for a shipping option, as referenced from orders. */
export function shippingOptionRef(option: ShippingOptionData): string {
  return `${SHIPPING_OPTION_KIND}:${option.pubkey}:${option.id}`;
}

/**
 * Human-readable order summary (kind 14 rumor) so any NIP-17 client — and the
 * site's own Messages drawer — renders the order even without Gamma support.
 */
export function createOrderSummaryRumor(
  orderId: string,
  items: GammaOrderItem[],
  shipping: GammaOrderShipping,
  shippingOption: ShippingOptionData | undefined,
  merchantPubkey: string
): { kind: number; content: string; tags: string[][]; created_at: number } {
  const lines: string[] = [
    `🛒 NEW ORDER #${orderId.slice(0, 8).toUpperCase()}`,
    '',
  ];

  for (const item of items) {
    lines.push(`📦 ${item.title}`);
    lines.push(`   Quantity: ${item.quantity}`);
    lines.push(`   Price: ${item.priceAmount} ${item.priceCurrency}`);
    lines.push('');
  }

  if (shippingOption) {
    lines.push(
      `🚚 Shipping: ${shippingOption.title} — ${shippingOption.price.amount} ${shippingOption.price.currency}`,
      ''
    );
  }

  lines.push(`📍 Deliver to:`, `   ${formatAddress(shipping)}`, '');
  lines.push(`📧 ${shipping.email}${shipping.phone ? ` · ${shipping.phone}` : ''}`);
  if (shipping.message) lines.push('', `💬 ${shipping.message}`);
  lines.push('', '---', `Order ID: ${orderId}`, 'Please reply with a Lightning invoice to complete payment.');

  return {
    kind: ORDER_GENERAL_KIND,
    content: lines.join('\n'),
    tags: [
      ['p', merchantPubkey],
      ['subject', `Order ${orderId.slice(0, 8)}`],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
}
