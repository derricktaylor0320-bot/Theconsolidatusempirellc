import type Stripe from "stripe";
import type { OrderItem } from "@shared/schema";
import { getUncachableStripeClient } from "./stripeClient";

export interface CheckoutLineItem {
  name: string;
  quantity: number;
  amountCents: number;
  note?: string;
}

export interface CheckoutDiscount {
  name: string;
  percentage: number;
}

export interface CheckoutTax {
  name: string;
  percentage: number;
}

export interface RetrievedStripeCheckout {
  sessionId: string;
  isPaid: boolean;
  totalCents: number;
  items: OrderItem[];
  buyerEmail: string | null;
  buyerName: string | null;
  shippingAddress: string | null;
}

function lineSubtotalCents(items: CheckoutLineItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.amountCents * Math.max(1, item.quantity),
    0,
  );
}

function applyPercentDiscount(
  items: CheckoutLineItem[],
  percent: number,
): CheckoutLineItem[] {
  if (percent <= 0) return items;
  const factor = (100 - percent) / 100;
  return items.map((item) => ({
    ...item,
    amountCents: Math.max(0, Math.round(item.amountCents * factor)),
  }));
}

function toStripeLineItems(
  items: CheckoutLineItem[],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => ({
    quantity: Math.max(1, item.quantity),
    price_data: {
      currency: "usd",
      unit_amount: item.amountCents,
      product_data: {
        name: item.name.slice(0, 500),
        description: item.note?.slice(0, 500) || undefined,
      },
    },
  }));
}

function formatStripeAddress(
  address: Stripe.Address | null | undefined,
): string | null {
  if (!address) return null;
  const cityLine = [address.city, address.state]
    .filter(Boolean)
    .join(", ");
  const parts = [
    address.line1,
    address.line2,
    [cityLine, address.postal_code].filter(Boolean).join(" ").trim(),
    address.country,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join("\n") : null;
}

function isTaxLineItem(name: string): boolean {
  return /sales tax$/i.test(name.trim());
}

export async function createStripeCheckoutSession(input: {
  lineItems: CheckoutLineItem[];
  tax?: CheckoutTax;
  discount?: CheckoutDiscount;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = await getUncachableStripeClient();

  const discountedItems = input.discount
    ? applyPercentDiscount(input.lineItems, input.discount.percentage)
    : input.lineItems;

  const stripeLineItems = toStripeLineItems(discountedItems);

  if (input.tax && input.tax.percentage > 0) {
    const taxableSubtotal = lineSubtotalCents(discountedItems);
    const taxCents = Math.round(
      (taxableSubtotal * input.tax.percentage) / 100,
    );
    if (taxCents > 0) {
      stripeLineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: taxCents,
          product_data: {
            name: input.tax.name.slice(0, 500),
          },
        },
      });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: stripeLineItems,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    shipping_address_collection: {
      allowed_countries: ["US"],
    },
    phone_number_collection: {
      enabled: false,
    },
    metadata: input.discount
      ? { discountCode: input.discount.name.slice(0, 500) }
      : undefined,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { url: session.url, sessionId: session.id };
}

export async function retrieveStripeCheckoutOrder(
  sessionId: string,
): Promise<RetrievedStripeCheckout | null> {
  const stripe = await getUncachableStripeClient();

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  } catch {
    return null;
  }

  const lineItems = session.line_items?.data ?? [];
  const items: OrderItem[] = lineItems
    .filter((line) => {
      const product =
        typeof line.price?.product === "object" ? line.price.product : null;
      const name =
        line.description ||
        (product && "name" in product ? product.name : "") ||
        "";
      return !isTaxLineItem(name);
    })
    .map((line) => {
      const product =
        typeof line.price?.product === "object" ? line.price.product : null;
      const name =
        line.description ||
        (product && "name" in product ? product.name : null) ||
        "Item";
      const description =
        product && "description" in product ? product.description : undefined;
      return {
        name,
        quantity: line.quantity ?? 1,
        amountCents: line.price?.unit_amount ?? 0,
        note:
          typeof description === "string" && description.length > 0
            ? description
            : undefined,
      };
    });

  return {
    sessionId: session.id,
    isPaid: session.payment_status === "paid",
    totalCents: session.amount_total ?? 0,
    items,
    buyerEmail: session.customer_details?.email ?? null,
    buyerName: session.customer_details?.name ?? null,
    shippingAddress: formatStripeAddress(
      session.collected_information?.shipping_details?.address ??
        session.customer_details?.address,
    ),
  };
}
