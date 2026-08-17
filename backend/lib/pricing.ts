/**
 * Storewide free shipping (see Navbar/Footer copy: "Complimentary
 * insured shipping across India"). Kept as a function — not a bare
 * constant — so a future paid-shipping tier is a one-line change here
 * instead of a schema/API change; Order.shipping stays a real column
 * for the same reason.
 */
export function computeShipping(_subtotal: number): number {
  return 0;
}
