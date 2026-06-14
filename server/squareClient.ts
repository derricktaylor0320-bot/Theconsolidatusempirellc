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

export interface PaymentLinkInput {
  name: string;
  amountCents: number;
  description?: string;
  redirectUrl?: string;
  note?: string;
}

// Creates a Square-hosted checkout page and returns the URL to redirect the buyer to.
export async function createSquarePaymentLink(input: PaymentLinkInput): Promise<string> {
  const amount = Math.round(input.amountCents);
  if (!input.name || !amount || amount <= 0) {
    throw new Error('A product name and a valid amount are required');
  }

  const body: any = {
    idempotency_key: randomUUID(),
    quick_pay: {
      name: input.name.slice(0, 255),
      price_money: { amount, currency: 'USD' },
      location_id: getSquareLocationId(),
    },
    checkout_options: {
      ask_for_shipping_address: true,
    },
  };

  if (input.description) {
    body.description = input.description.slice(0, 255);
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
  return url;
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
}

// Creates a Square-hosted checkout page for a multi-item order (one payment for
// the whole cart) and returns the URL to redirect the buyer to.
export async function createSquareOrderPaymentLink(
  input: OrderPaymentLinkInput,
): Promise<string> {
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
  return url;
}
