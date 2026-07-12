import { randomUUID } from 'crypto';

// Square REST API base. Defaults to production; set SQUARE_ENVIRONMENT=sandbox to test.
const SQUARE_BASE =
  process.env.SQUARE_ENVIRONMENT === 'sandbox'
    ? 'https://connect.squareupsandbox.com'
    : 'https://connect.squareup.com';

const SQUARE_VERSION = '2024-12-18';

function getAccessToken(): string {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SQUARE_ACCESS_TOKEN is not set');
  }
  return token;
}

export function getSquareLocationId(): string {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    throw new Error('SQUARE_LOCATION_ID is not set');
  }
  return locationId;
}

interface SquareFetchOptions {
  method?: string;
  body?: any;
}

export async function squareFetch(path: string, options: SquareFetchOptions = {}) {
  const response = await fetch(`${SQUARE_BASE}${path}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.errors?.[0]?.detail || `Square API error (${response.status})`;
    throw new Error(detail);
  }

  return data;
}

// The result of creating a Square-hosted checkout: the URL to redirect the
// buyer to, plus the id of the Square order backing that checkout. We keep the
// order id so that, when the buyer returns, we can verify payment with Square
// before recording the order (never trusting the redirect alone).
export interface PaymentLinkResult {
  url: string;
  orderId: string | null;
}

export interface OrderLineItem {
  name: string;
  quantity: number;
  amountCents: number; // per-unit price in cents
  note?: string;
}

export interface OrderPaymentLinkInput {
  lineItems: OrderLineItem[];
  redirectUrl?: string;
  note?: string;
  /**
   * Optional order-level sales tax. Square applies the percentage to the whole
   * order and charges subtotal + tax. The percentage is server-authoritative —
   * derived from the buyer's ship-to state, never from a client-sent amount.
   */
  tax?: { name: string; percentage: string };
}

// Creates a Square-hosted checkout page for a multi-item order (one payment for
// the whole cart) and returns the URL + Square order id.
export async function createSquareOrderPaymentLink(
  input: OrderPaymentLinkInput,
): Promise<PaymentLinkResult> {
  if (!input.lineItems || input.lineItems.length === 0) {
    throw new Error('At least one line item is required');
  }

  const line_items = input.lineItems.map((li) => {
    const amount = Math.round(li.amountCents);
    const quantity = Math.round(li.quantity);
    if (!li.name || !amount || amount <= 0 || !quantity || quantity <= 0) {
      throw new Error('Each line item needs a name, a valid amount, and a quantity');
    }
    const item: any = {
      name: li.name.slice(0, 500),
      quantity: String(quantity),
      base_price_money: { amount, currency: 'USD' },
    };
    if (li.note) {
      item.note = li.note.slice(0, 500);
    }
    return item;
  });

  const body: any = {
    idempotency_key: randomUUID(),
    order: {
      location_id: getSquareLocationId(),
      line_items,
    },
    checkout_options: {
      ask_for_shipping_address: true,
    },
  };

  if (input.tax && Number(input.tax.percentage) > 0) {
    body.order.taxes = [
      {
        uid: 'state-sales-tax',
        name: input.tax.name.slice(0, 255),
        percentage: input.tax.percentage,
        scope: 'ORDER',
        type: 'ADDITIVE',
      },
    ];
  }

  if (input.redirectUrl) {
    body.checkout_options.redirect_url = input.redirectUrl;
  }
  if (input.note) {
    body.payment_note = input.note.slice(0, 500);
  }

  const data = await squareFetch('/v2/online-checkout/payment-links', {
    method: 'POST',
    body,
  });

  const url = data?.payment_link?.url || data?.payment_link?.long_url;
  if (!url) {
    throw new Error('Square did not return a checkout URL');
  }
  return { url, orderId: data?.payment_link?.order_id ?? null };
}

export interface RetrievedOrder {
  orderId: string;
  state: string;
  // True only when Square confirms the order is fully paid. We use this to gate
  // recording an order — a returned redirect alone is never enough.
  isPaid: boolean;
  totalCents: number;
  items: OrderLineItem[];
  // The buyer's email as captured by Square at checkout, when available. Used to
  // send the order receipt. May be null if Square didn't collect/expose one.
  buyerEmail: string | null;
  // The buyer's name and ship-to address as captured by Square, when available.
  // The owner uses these to place the order with the fulfilling company.
  buyerName: string | null;
  shippingAddress: string | null;
}

function looksLikeEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@') && value.length <= 320;
}

// Square exposes the buyer email in a few places depending on how checkout was
// configured. Prefer the fulfillment recipient (shipping address collection),
// falling back to the payment record's buyer_email_address.
function extractEmailFromOrder(order: any): string | null {
  const fulfillments: any[] = Array.isArray(order?.fulfillments)
    ? order.fulfillments
    : [];
  for (const f of fulfillments) {
    const recipient =
      f?.shipment_details?.recipient ||
      f?.pickup_details?.recipient ||
      f?.delivery_details?.recipient;
    if (looksLikeEmail(recipient?.email_address)) {
      return recipient.email_address;
    }
  }
  return null;
}

// Finds the first shipping recipient on the order so we can capture the buyer's
// name + ship-to address. Returns the recipient object (with display_name and
// an `address`), or null when Square didn't collect one.
function findRecipient(order: any): any | null {
  const fulfillments: any[] = Array.isArray(order?.fulfillments)
    ? order.fulfillments
    : [];
  for (const f of fulfillments) {
    const recipient =
      f?.shipment_details?.recipient ||
      f?.delivery_details?.recipient ||
      f?.pickup_details?.recipient;
    if (recipient) return recipient;
  }
  return null;
}

function formatAddress(address: any): string | null {
  if (!address || typeof address !== 'object') return null;
  const cityLine = [address.locality, address.administrative_district_level_1]
    .filter(Boolean)
    .join(', ');
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.address_line_3,
    [cityLine, address.postal_code].filter(Boolean).join(' ').trim(),
    address.country,
  ]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0);
  return parts.length > 0 ? parts.join('\n') : null;
}

async function fetchBuyerEmailFromPayments(order: any): Promise<string | null> {
  const tenders: any[] = Array.isArray(order?.tenders) ? order.tenders : [];
  for (const tender of tenders) {
    const paymentId = tender?.payment_id || tender?.id;
    if (!paymentId) continue;
    try {
      const data = await squareFetch(
        `/v2/payments/${encodeURIComponent(paymentId)}`,
      );
      if (looksLikeEmail(data?.payment?.buyer_email_address)) {
        return data.payment.buyer_email_address;
      }
    } catch {
      // Ignore — payment lookup is best effort for the receipt email.
    }
  }
  return null;
}

// Retrieves an order from Square (the source of truth) so we can verify payment
// and read the real purchased line items on the success page. Returns null if
// Square has no such order.
export async function retrieveSquareOrder(
  orderId: string,
): Promise<RetrievedOrder | null> {
  if (!orderId) return null;

  let data: any;
  try {
    data = await squareFetch(`/v2/orders/${encodeURIComponent(orderId)}`);
  } catch {
    return null;
  }

  const order = data?.order;
  if (!order || !order.id) return null;

  const rawLineItems: any[] = Array.isArray(order.line_items)
    ? order.line_items
    : [];
  const items: OrderLineItem[] = rawLineItems.map((li) => ({
    name: typeof li?.name === 'string' && li.name ? li.name : 'Item',
    quantity: Math.max(1, Math.round(Number(li?.quantity) || 1)),
    amountCents: Math.max(0, Math.round(Number(li?.base_price_money?.amount) || 0)),
    note: typeof li?.note === 'string' && li.note ? li.note : undefined,
  }));

  const totalCents = Math.max(
    0,
    Math.round(
      Number(order?.total_money?.amount) ||
        items.reduce((sum, it) => sum + it.amountCents * it.quantity, 0),
    ),
  );

  // An order is paid when Square marks it COMPLETED, or when it carries
  // payment tenders with nothing left due.
  const tenders: any[] = Array.isArray(order?.tenders) ? order.tenders : [];
  const amountDue = Number(order?.net_amount_due_money?.amount);
  const isPaid =
    order?.state === 'COMPLETED' ||
    (tenders.length > 0 && (Number.isNaN(amountDue) || amountDue === 0));

  let buyerEmail = extractEmailFromOrder(order);
  if (!buyerEmail) {
    buyerEmail = await fetchBuyerEmailFromPayments(order);
  }

  const recipient = findRecipient(order);
  const buyerName =
    typeof recipient?.display_name === 'string' && recipient.display_name.trim()
      ? recipient.display_name.trim()
      : null;
  const shippingAddress = formatAddress(recipient?.address);

  return {
    orderId: order.id,
    state: String(order?.state || 'UNKNOWN'),
    isPaid,
    totalCents,
    items,
    buyerEmail,
    buyerName,
    shippingAddress,
  };
}
