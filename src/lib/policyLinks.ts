/** Single source of truth for the policy pages' paths and labels. */
export const POLICY_LINKS = [
  { path: '/shipping-policy', label: 'Shipping' },
  { path: '/refund-policy', label: 'Refunds' },
  { path: '/privacy-policy', label: 'Privacy' },
  { path: '/terms-of-service', label: 'Terms' },
] as const;
