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

// Custom phone cases. Like the mug, these are new products that must exist in
// whatever DB this server is connected to. In dev seedProducts creates them in
// Stripe (synced to the DB) so the guarded inserts below are no-ops; in Railway
// prod (frozen snapshot, no Stripe) the inserts are what actually create them.
// The selectable phone-model list lives in shared/phoneModels.ts (too long for
// Stripe's 500-char metadata limit); products only carry a short `caseType`.
const CASE_PRICE_CENTS = 3000;

// The Kids Sippy Cup is being retired from the storefront.
const SIPPY_CUP_NAME = "Kids Sippy Cup";

const IPHONE_CASE_PRODUCT_ID = "prod_kkiphonecase";
const IPHONE_CASE_PRICE_ID = "price_kkiphonecase";
const IPHONE_CASE_NAME = "Custom iPhone Case";
const IPHONE_CASE_IMAGE = "/assets/generated_images/iphone_branded_case.png";
const IPHONE_CASE_DESCRIPTION =
  "Personalized iPhone case featuring your choice of Khomplete Khemistri brand logo. Durable protective case with a sleek finish. Select your iPhone model (iPhone 7 through iPhone 17 Pro Max) and the branded logo you want printed on your case at checkout.";
const IPHONE_CASE_META = {
  category: "Phone Cases",
  productType: "accessory",
  imageUrl: IPHONE_CASE_IMAGE,
  caseType: "iphone",
  ebayLink: "https://ebay.io/m/5yRG9J",
  fulfillment: "eBay",
};

const SAMSUNG_CASE_PRODUCT_ID = "prod_kksamsungcase";
const SAMSUNG_CASE_PRICE_ID = "price_kksamsungcase";
const SAMSUNG_CASE_NAME = "Custom Samsung Case";
const SAMSUNG_CASE_IMAGE = "/assets/generated_images/samsung_branded_case.png";
const SAMSUNG_CASE_DESCRIPTION =
  "Personalized Samsung Galaxy case featuring your choice of Khomplete Khemistri brand logo. Durable protective case with a sleek finish. Select your Samsung model (all Galaxy S series and A series) and the branded logo you want printed on your case at checkout.";
const SAMSUNG_CASE_META = {
  category: "Phone Cases",
  productType: "accessory",
  imageUrl: SAMSUNG_CASE_IMAGE,
  caseType: "samsung",
  ebayLink: "https://ebay.io/m/gQPk0T",
  fulfillment: "eBay",
};

export async function ensureCatalogData() {
  try {
    // 1) Deduplicate the tumbler. It was created twice in Stripe (a reseed side
    //    effect), so two products share the name. Instead of leaning on the
    //    storefront's name-dedupe, make the catalog itself tidy: keep ONE
    //    canonical product active and deactivate the rest (and their prices).
    //    Keep the lowest-id tumbler, preferring one that has an active price;
    //    deterministic so dev and prod converge on the same keeper. Writes go
    //    through _raw_data (generated columns). In dev this reinforces the Stripe
    //    archive done by seedProducts; in prod (frozen snapshot, no Stripe keys)
    //    this is the only thing that removes the duplicate.
    await db.execute(sql`
      WITH keeper AS (
        SELECT p.id
        FROM stripe.products p
        WHERE p.name = ${TUMBLER_NAME} AND p.active = true
        ORDER BY
          (EXISTS (SELECT 1 FROM stripe.prices pr WHERE pr.product = p.id AND pr.active = true)) DESC,
          p.id
        LIMIT 1
      )
      UPDATE stripe.products
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE name = ${TUMBLER_NAME}
        AND active = true
        AND id NOT IN (SELECT id FROM keeper)
    `);

    // 1b) Deactivate any prices that belong to the now-deactivated tumbler copies
    //     so a stale price id can never be used for checkout.
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (
          SELECT id FROM stripe.products WHERE name = ${TUMBLER_NAME} AND active = false
        )
    `);

    // 2) Tumbler price -> $30 on the surviving active price.
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(TUMBLER_PRICE_CENTS)}::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM stripe.products WHERE name = ${TUMBLER_NAME} AND active = true)
        AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(TUMBLER_PRICE_CENTS)}
    `);

    // 3) Tumbler -> custom-branded metadata (logoOptions) + new supplier + colors.
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            jsonb_set(_raw_data, '{description}', ${JSON.stringify(TUMBLER_DESCRIPTION)}::jsonb, true),
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(TUMBLER_META)}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${TUMBLER_NAME} AND active = true
    `);

    // 4) Coffee Mug. In dev a real Stripe-synced "Coffee Mug" already exists, so
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

    // 5) Coffee Mug metadata -> handle-color customization. The dev mug created
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

    // 6) Custom phone cases ($30, model + logo). Same self-applying pattern as
    //    the mug: create only when absent (no-op in dev where Stripe sync made
    //    them; the real creator on the Railway prod snapshot), then ensure the
    //    metadata carries the latest caseType/image/description either way.
    const cases = [
      {
        productId: IPHONE_CASE_PRODUCT_ID,
        priceId: IPHONE_CASE_PRICE_ID,
        name: IPHONE_CASE_NAME,
        description: IPHONE_CASE_DESCRIPTION,
        meta: IPHONE_CASE_META,
      },
      {
        productId: SAMSUNG_CASE_PRODUCT_ID,
        priceId: SAMSUNG_CASE_PRICE_ID,
        name: SAMSUNG_CASE_NAME,
        description: SAMSUNG_CASE_DESCRIPTION,
        meta: SAMSUNG_CASE_META,
      },
    ];

    for (const c of cases) {
      const productRaw = JSON.stringify({
        id: c.productId,
        object: "product",
        active: true,
        name: c.name,
        description: c.description,
        metadata: c.meta,
        images: [],
        created,
        livemode: false,
      });

      const priceRaw = JSON.stringify({
        id: c.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: CASE_PRICE_CENTS,
        product: c.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${productRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${c.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${priceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${c.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${c.productId})
      `);

      // Ensure case metadata (caseType, image, description) is current on the
      // surviving product regardless of how it was created.
      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(c.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(c.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${c.name} AND active = true
      `);
    }

    // 7) Remove the Kids Sippy Cup from the storefront. The owner is no longer
    //    offering it. In dev removing it from ALL_PRODUCTS lets seedProducts
    //    archive it in Stripe; here we deactivate the product + its prices in the
    //    DB directly so it also disappears from the Railway prod frozen snapshot
    //    (no Stripe there) and so the dev edit holds regardless of sync timing.
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE name = ${SIPPY_CUP_NAME} AND active = true
    `);
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM stripe.products WHERE name = ${SIPPY_CUP_NAME})
    `);

    console.log("ensureCatalogData: ensured tumbler ($30 + logo), Coffee Mug ($15, handle colors), and phone cases ($30, model + logo); removed Kids Sippy Cup.");
  } catch (err) {
    console.error("ensureCatalogData failed:", err);
  }
}
