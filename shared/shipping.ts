// Shared shipping/carrier helpers used by both the server (to build the
// customer "your order shipped" email) and the client (the owner Orders page).
//
// Keeping the carrier list + tracking-URL logic in one shared place means the
// dropdown the owner sees and the link the customer receives always agree.

export const CARRIERS = [
  "USPS",
  "UPS",
  "FedEx",
  "DHL",
  "Amazon",
  "Etsy",
  "Other",
] as const;

export type Carrier = (typeof CARRIERS)[number];

// Build a public tracking URL for the given carrier + tracking number when one
// exists. Amazon/Etsy orders are tracked inside the buyer's account on those
// sites (no public per-number URL), so we return null and the UI/email just
// shows the carrier + number as text.
export function trackingUrlFor(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!carrier || !trackingNumber) return null;
  const num = trackingNumber.trim();
  if (!num) return null;
  const encoded = encodeURIComponent(num);

  switch (carrier.trim().toLowerCase()) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encoded}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${encoded}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encoded}`;
    default:
      return null;
  }
}
