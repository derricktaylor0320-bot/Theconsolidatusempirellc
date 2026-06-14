import { sql } from "drizzle-orm";
import { db } from "./db";

// Catalog facts that must be true in whatever database this server is connected
// to. The synced `stripe.products` / `stripe.prices` tables are the durable
// catalog the storefront reads from. Every column is GENERATED from the
// `_raw_data` jsonb, so all writes go through `_raw_data`.
//
// Two environments:
//  - Replit dev: Stripe sync is live. seedProducts() created a real "Coffee Mug"
//    in Stripe (synced to the DB), and a $30 tumbler price. We still need to add
//    the tumbler logo metadata + force any leftover tumbler price to $30. Direct
//    `_raw_data` edits survive the incremental sync because they don't change
//    anything in Stripe (so Stripe never re-pushes those rows).
//  - Railway production: no Stripe keys, so neither seedProducts nor sync runs;
//    the DB is a frozen snapshot. Here we create the Coffee Mug directly and
//    force the tumbler price/metadata. This is why the routine is self-applying:
//    a deploy carries the change to prod without a remote DB connection.

const STANDARD_LOGO_OPTIONS = "Apparel Logo, Accessories Eagle Badge, 5 Swords Crest";

const TUMBLER_NAME = "40 Oz Branded Tumbler";
const TUMBLER_PRICE_CENTS = 3000;
const TUMBLER_DESCRIPTION =
  "Premium 40 oz insulated stainless steel tumbler with handle and your choice of Khomplete Khemistri logo. Keeps drinks cold or hot for hours. Available in a wide range of colors — tell us your preferred color at checkout.";
const TUMBLER_META = {
  logoOptions: STANDARD_LOGO_OPTIONS,
  amazonLink: "https://a.co/d/03kljFGN",
  cost: "20",
  fulfillment: "Amazon",
  colors: "Multiple colors available — specify your color choice at checkout",
};

const MUG_PRODUCT_ID = "prod_kkcoffeemug";
const MUG_PRICE_ID = "price_kkcoffeemug";
const MUG_NAME = "Coffee Mug";
const MUG_PRICE_CENTS = 1500;
const MUG_IMAGE = "/assets/generated_images/black_branded_mug.png";
const MUG_DESCRIPTION =
  "Personalized 11 oz ceramic coffee mug with your choice of Khomplete Khemistri logo. Microwave and dishwasher safe. Available in multiple colors — perfect for your morning brew.";
// The mug uses handle-color customization (color + matching logo from the
// shared logo collection) instead of the 3 standard logo options.
const MUG_HANDLE_COLORS = "Black, Blue, Red, Green, Yellow/Gold";
const MUG_META = {
  category: "Drinkware",
  productType: "accessory",
  imageUrl: MUG_IMAGE,
  handleColors: MUG_HANDLE_COLORS,
  amazonLink: "https://a.co/d/08wcx6Bh",
  fulfillment: "Amazon",
};

export async function ensureCatalogData() {
  try {
    // 1) Tumbler price -> $30 on every active price (covers duplicate products).
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(TUMBLER_PRICE_CENTS)}::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM stripe.products WHERE name = ${TUMBLER_NAME})
        AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(TUMBLER_PRICE_CENTS)}
    `);

    // 2) Tumbler -> custom-branded metadata (logoOptions) + new supplier + colors.
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            jsonb_set(_raw_data, '{description}', ${JSON.stringify(TUMBLER_DESCRIPTION)}::jsonb, true),
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(TUMBLER_META)}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${TUMBLER_NAME}
    `);

    // 3) Coffee Mug. In dev a real Stripe-synced "Coffee Mug" already exists, so
    //    we only create a synthetic one when none exists (the production path).
    const acct: any = await db.execute(
      sql`SELECT _account_id FROM stripe.products WHERE _account_id IS NOT NULL LIMIT 1`,
    );
    const accountId = acct?.rows?.[0]?._account_id as string | undefined;
    if (!accountId) {
      console.warn("ensureCatalogData: no _account_id found; skipped Coffee Mug.");
      return;
    }

    const created = Math.floor(Date.now() / 1000);

    const mugProductRaw = JSON.stringify({
      id: MUG_PRODUCT_ID,
      object: "product",
      active: true,
      name: MUG_NAME,
      description: MUG_DESCRIPTION,
      metadata: MUG_META,
      images: [],
      created,
      livemode: false,
    });

    const mugPriceRaw = JSON.stringify({
      id: MUG_PRICE_ID,
      object: "price",
      active: true,
      currency: "usd",
      unit_amount: MUG_PRICE_CENTS,
      product: MUG_PRODUCT_ID,
      type: "one_time",
      billing_scheme: "per_unit",
      created,
      livemode: false,
    });

    await db.execute(sql`
      INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${mugProductRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${MUG_NAME})
    `);

    await db.execute(sql`
      INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${mugPriceRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${MUG_PRICE_ID})
        AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${MUG_PRODUCT_ID})
    `);

    // 4) Coffee Mug metadata -> handle-color customization. The dev mug created
    //    by seedProducts carries the old `logoOptions`; switch every mug to the
    //    new `handleColors` model (drop logoOptions, merge in handleColors etc.).
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            _raw_data,
            '{metadata}',
            (COALESCE(_raw_data->'metadata', '{}'::jsonb) - 'logoOptions') || ${JSON.stringify(MUG_META)}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${MUG_NAME}
    `);

    console.log("ensureCatalogData: ensured tumbler ($30 + logo) and Coffee Mug ($15, handle colors).");
  } catch (err) {
    console.error("ensureCatalogData failed:", err);
  }
}
