/**
 * Eden's merchant identity — the single source of truth for both catalog
 * authorship (all product/shipping/collection events are authored by this
 * pubkey) and store-owner gating of the admin UI.
 */
export const MERCHANT_PUBKEY: string = import.meta.env.VITE_EDEN_PUBKEY;

/** The NIP-15 (LNbits Nostr Market) stall holding Eden's legacy listings. */
export const STALL_ID: string = import.meta.env.VITE_STALL_ID;
