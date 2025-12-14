// NIP-15 Marketplace Order Types

/**
 * NIP-15 Order Message (type 0)
 * Sent by customer to merchant via encrypted DM (kind 4)
 */
export interface OrderMessage {
  id: string;
  type: 0;
  name?: string;
  address: string;
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
 * NIP-15 Payment Request (type 1)
 * Sent by merchant to customer via encrypted DM (kind 4)
 */
export interface PaymentRequest {
  id: string;
  type: 1;
  message?: string;
  payment_options: Array<{
    type: 'ln' | 'btc' | 'lnurl' | 'url';
    link: string;
  }>;
}

/**
 * NIP-15 Order Status Update (type 2)
 * Sent by merchant to customer via encrypted DM (kind 4)
 */
export interface OrderStatus {
  id: string;
  type: 2;
  message?: string;
  paid: boolean;
  shipped: boolean;
}

/**
 * Union type for all NIP-15 checkout messages
 */
export type CheckoutMessage = OrderMessage | PaymentRequest | OrderStatus;

/**
 * Shipping address structure for physical products
 */
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
}

/**
 * Format shipping address into a string for the order message
 */
export function formatShippingAddress(address: ShippingAddress): string {
  const lines = [
    address.fullName,
    address.addressLine1,
    address.addressLine2,
    `${address.city}, ${address.postcode}`,
    address.country,
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Check if a shipping zone is for digital delivery
 * Digital zones have cost=0 or name containing "digital", "online", etc.
 */
export function isDigitalShipping(zone: { name?: string; cost: number }): boolean {
  const isZeroCost = zone.cost === 0;
  const nameLower = zone.name?.toLowerCase() || '';
  const hasDigitalName = nameLower.includes('digital') ||
                         nameLower.includes('download') ||
                         nameLower.includes('email') ||
                         nameLower.includes('online') ||
                         nameLower.includes('free');
  return isZeroCost || hasDigitalName;
}

/**
 * Generate a unique order ID
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}
