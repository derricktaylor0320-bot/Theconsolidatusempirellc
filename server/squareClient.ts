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

export function isSquareConfigured(): boolean {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
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
  /**
   * Optional order-level percentage discount (e.g. Discount10% / Discount15%).
   * Applied before tax. Name is shown on the Square checkout receipt.
   */
  discount?: { name: string; percentage: string };
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

  if (input.discount && Number(input.discount.percentage) > 0) {
    body.order.discounts = [
      {
        uid: 'store-discount',
        name: input.discount.name.slice(0, 255),
        percentage: input.discount.percentage,
        scope: 'ORDER',
        type: 'FIXED_PERCENTAGE',
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

// ---------------------------------------------------------------------------
// Pocket Booster — scheduled repayment invoices (Orders + Invoices API)
// ---------------------------------------------------------------------------

export interface SquareCustomerRef {
  customerId: string;
  email: string;
}

export interface ScheduledRepaymentInvoiceInput {
  amountCents: number;
  /** Calendar payday used as invoice due_date (YYYY-MM-DD derived in UTC). */
  dueDate: Date;
  customerId: string;
  title: string;
  description?: string;
  /** When true, charge a card on file if Square has one for this customer. */
  preferCardOnFile?: boolean;
}

export interface ScheduledRepaymentInvoiceResult {
  orderId: string;
  invoiceId: string;
  invoiceNumber: string | null;
  publicUrl: string | null;
  status: string;
  automaticPayment: boolean;
}

export interface RetrievedRepaymentInvoice {
  invoiceId: string;
  status: string;
  updatedAt: Date | null;
}

/** Read Square's current invoice status before updating repayment history. */
export async function retrieveRepaymentInvoice(
  invoiceId: string,
): Promise<RetrievedRepaymentInvoice | null> {
  if (!invoiceId) return null;

  let data: any;
  try {
    data = await squareFetch(`/v2/invoices/${encodeURIComponent(invoiceId)}`);
  } catch {
    return null;
  }

  const invoice = data?.invoice;
  if (!invoice?.id) return null;

  const updatedAt =
    typeof invoice.updated_at === 'string'
      ? new Date(invoice.updated_at)
      : null;

  return {
    invoiceId: invoice.id,
    status: String(invoice.status || 'UNKNOWN').toUpperCase(),
    updatedAt:
      updatedAt && !Number.isNaN(updatedAt.getTime()) ? updatedAt : null,
  };
}

function toSquareDate(date: Date): string {
  // Invoice due_date is a calendar date (YYYY-MM-DD) in the location timezone.
  return date.toISOString().slice(0, 10);
}

function toSquareScheduledAt(date: Date): string {
  // Process the invoice on the payday morning so Square queues email / charge
  // for that calendar day rather than immediately after publish.
  const scheduled = new Date(date);
  if (Number.isNaN(scheduled.getTime())) {
    throw new Error('Invalid repayment schedule date');
  }
  // Keep a stable 9:00 UTC send window on the due date.
  const yyyy = scheduled.getUTCFullYear();
  const mm = String(scheduled.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(scheduled.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T09:00:00Z`;
}

/** Find an existing Square customer by email, or create one. */
export async function findOrCreateSquareCustomer(input: {
  email: string;
  givenName?: string | null;
  familyName?: string | null;
}): Promise<SquareCustomerRef> {
  const email = input.email.trim().toLowerCase();
  if (!looksLikeEmail(email)) {
    throw new Error('A valid email is required to schedule Square repayments');
  }

  const search = await squareFetch('/v2/customers/search', {
    method: 'POST',
    body: {
      query: {
        filter: {
          email_address: { exact: email },
        },
      },
      limit: 1,
    },
  });

  const existing = Array.isArray(search?.customers) ? search.customers[0] : null;
  if (existing?.id) {
    return { customerId: existing.id, email };
  }

  const created = await squareFetch('/v2/customers', {
    method: 'POST',
    body: {
      idempotency_key: randomUUID(),
      given_name: input.givenName?.trim() || undefined,
      family_name: input.familyName?.trim() || undefined,
      email_address: email,
      reference_id: 'pocket-booster',
    },
  });

  const customerId = created?.customer?.id;
  if (!customerId) {
    throw new Error('Square did not return a customer id');
  }
  return { customerId, email };
}

async function findCardOnFile(customerId: string): Promise<string | null> {
  try {
    const data = await squareFetch(
      `/v2/cards?customer_id=${encodeURIComponent(customerId)}`,
    );
    const cards: any[] = Array.isArray(data?.cards) ? data.cards : [];
    const active = cards.find(
      (c) => c?.id && String(c?.card?.enabled ?? true) !== 'false',
    );
    return active?.id || null;
  } catch {
    return null;
  }
}

/**
 * Creates a Square order + published invoice for one Pocket Booster deduction.
 * When the customer has a card on file, Square charges it on due_date; otherwise
 * Square emails a payable invoice scheduled for that payday.
 */
export async function createScheduledRepaymentInvoice(
  input: ScheduledRepaymentInvoiceInput,
): Promise<ScheduledRepaymentInvoiceResult> {
  const amount = Math.round(input.amountCents);
  if (!amount || amount <= 0) {
    throw new Error('Repayment amount must be greater than zero');
  }

  const locationId = getSquareLocationId();
  const dueDate = toSquareDate(input.dueDate);
  const scheduledAt = toSquareScheduledAt(input.dueDate);

  const orderData = await squareFetch('/v2/orders', {
    method: 'POST',
    body: {
      idempotency_key: randomUUID(),
      order: {
        location_id: locationId,
        reference_id: `pb-repay-${randomUUID().slice(0, 8)}`,
        line_items: [
          {
            name: input.title.slice(0, 500),
            quantity: '1',
            base_price_money: { amount, currency: 'USD' },
            note: input.description?.slice(0, 500),
          },
        ],
      },
    },
  });

  const orderId = orderData?.order?.id;
  if (!orderId) {
    throw new Error('Square did not return an order id for the repayment');
  }

  let cardId: string | null = null;
  if (input.preferCardOnFile !== false) {
    cardId = await findCardOnFile(input.customerId);
  }

  const paymentRequest: Record<string, unknown> = {
    request_type: 'BALANCE',
    due_date: dueDate,
    tipping_enabled: false,
    automatic_payment_source: cardId ? 'CARD_ON_FILE' : 'NONE',
    reminders: [
      {
        relative_scheduled_days: -1,
        message: 'Your Pocket Booster cushion repayment is due tomorrow.',
      },
    ],
  };
  if (cardId) {
    paymentRequest.card_id = cardId;
  }

  const invoiceData = await squareFetch('/v2/invoices', {
    method: 'POST',
    body: {
      idempotency_key: randomUUID(),
      invoice: {
        location_id: locationId,
        order_id: orderId,
        primary_recipient: { customer_id: input.customerId },
        payment_requests: [paymentRequest],
        delivery_method: 'EMAIL',
        title: input.title.slice(0, 150),
        description: input.description?.slice(0, 2000),
        scheduled_at: scheduledAt,
        accepted_payment_methods: {
          card: true,
          square_gift_card: false,
          bank_account: true,
          buy_now_pay_later: false,
          cash_app_pay: true,
        },
        store_payment_method_enabled: true,
      },
    },
  });

  const draft = invoiceData?.invoice;
  if (!draft?.id || draft.version == null) {
    throw new Error('Square did not return a draft invoice');
  }

  const published = await squareFetch(
    `/v2/invoices/${encodeURIComponent(draft.id)}/publish`,
    {
      method: 'POST',
      body: {
        version: draft.version,
        idempotency_key: randomUUID(),
      },
    },
  );

  const invoice = published?.invoice || draft;
  return {
    orderId,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number ?? null,
    publicUrl: invoice.public_url ?? null,
    status: String(invoice.status || 'SCHEDULED'),
    automaticPayment: Boolean(cardId),
  };
}
