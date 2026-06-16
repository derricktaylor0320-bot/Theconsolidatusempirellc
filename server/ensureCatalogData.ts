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
const TUMBLER_IMAGE = "/assets/tumbler_40oz_personalized.jpg";
const TUMBLER_META = {
  logoOptions: STANDARD_LOGO_OPTIONS,
  amazonLink: "https://a.co/d/03kljFGN",
  cost: "20",
  fulfillment: "Amazon",
  colors: "Multiple colors available — specify your color choice at checkout",
  imageUrl: TUMBLER_IMAGE,
};

const MUG_PRODUCT_ID = "prod_kkcoffeemug";
const MUG_PRICE_ID = "price_kkcoffeemug";
const MUG_NAME = "Coffee Mug";
const MUG_PRICE_CENTS = 1500;
const MUG_IMAGE = "/assets/coffee_mug_personalized.jpg";
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

// Products retired from the storefront. Removing them from ALL_PRODUCTS lets
// seedProducts archive them in Stripe (dev); deactivating them here also clears
// them from the Railway prod frozen snapshot (no Stripe there). The baby line
// was pulled because custom/personalized baby items cost too much to produce.
const RETIRED_PRODUCT_NAMES = [
  "Kids Sippy Cup",
  "Baby Onesie",
  "Baby Bib",
  "Baby Romper",
  "Baby Beanie",
  "Branded Scrunchies",
  // Old per-size bedding products, consolidated into a single Comforter Set and
  // Sheet Set (each with a size selector). Fleece blankets retired entirely.
  "Khomplete Khemistri Accessories Bed Sheet Set - Twin",
  "Khomplete Khemistri Accessories Bed Sheet Set - Full",
  "Khomplete Khemistri Accessories Bed Sheet Set - Queen",
  "Khomplete Khemistri Accessories Bed Sheet Set - King",
  "Khomplete Khemistri Accessories Bed Sheet Set - California King",
  "Khomplete Khemistri Accessories Fleece Blanket - Twin",
  "Khomplete Khemistri Accessories Fleece Blanket - Full/Queen",
  "Khomplete Khemistri Accessories Fleece Blanket - King",
  "Khomplete Khemistri Accessories Duvet Set - Twin",
  "Khomplete Khemistri Accessories Duvet Set - Full",
  "Khomplete Khemistri Accessories Duvet Set - Queen",
  "Khomplete Khemistri Accessories Duvet Set - King",
  "Khomplete Khemistri Accessories Duvet Set - California King",
];

// Scented candle product image. Like the tumbler, the storefront image must be
// served from /assets; prod (frozen snapshot, no Stripe) gets it via the
// metadata merge below.
const CANDLE_NAME = "Signature Scent Candle";
const CANDLE_IMAGE = "/assets/scented_candles_branded.png";

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

// Winter clothing (beanies, scarves, gloves, earmuffs, winter bundles) belongs
// under Apparel, not Accessories. It is also seasonal: hidden from the storefront
// in spring/summer and brought back for fall/winter. Both facts are applied here
// (productType -> 'apparel', hidden flag) so they hold in dev AND on the Railway
// prod frozen snapshot. To bring the winter collection back for the cold season,
// flip WINTER_HIDDEN to false and redeploy — the listing endpoints skip any
// product whose metadata.hidden === 'true'.
const WINTER_SEASONAL_NAMES = [
  "Men's Logo Beanie",
  "Men's Logo Scarf",
  "Men's Logo Gloves",
  "Men's Winter Bundle",
  "Women's Logo Beanie",
  "Women's Logo Earmuffs",
  "Women's Logo Scarf",
  "Women's Logo Gloves",
  "Women's Winter Bundle",
];
const WINTER_HIDDEN = true;

export async function ensureCatalogData() {
  try {
    // 1) Deduplicate ALL products that exist twice. Past reseeds created ~45
    //    products a second time (same name, different ids, both active). Rather
    //    than leaning forever on the storefront's name-dedupe, make the catalog
    //    itself tidy: for every duplicated name keep ONE canonical copy active
    //    and deactivate the rest (and their active prices). Deactivation is
    //    non-destructive — order rows store product NAMES + amounts (see
    //    shared/schema.ts `orders.items`), never price/product ids, so no order
    //    history can break, and nothing is deleted (reversible by flipping
    //    `active` back). Writes go through `_raw_data` (every column is
    //    GENERATED). In dev this reinforces the Stripe archive seedProducts
    //    does; in prod (frozen snapshot, no Stripe keys) this is the ONLY thing
    //    that removes the duplicates.
    //
    //    Keeper selection is deterministic and documented. Most pairs are
    //    identical, so any stable rule works; a few pairs genuinely differ and
    //    must keep the CORRECT copy, captured in the `corrections` table below:
    //      - Men's / Women's Winter Bundle: copies disagree on price; the
    //        canonical price is $60 (ALL_PRODUCTS), so keep the $60 copy (the
    //        old name-dedupe kept the cheaper stale copy — a real bug this fixes).
    //      - Chemistry Socks: copies disagree on productType (accessory vs
    //        apparel); the canonical copy is apparel (sortOrder 11).
    //    Ranking, highest priority first: (a) has an active price; (b) matches
    //    the corrected productType; (c) matches the corrected price; (d) carries
    //    sortOrder metadata (keeps the windbreaker copy that sorts correctly);
    //    (e) lowest id (stable tie-break). This matches seedProducts' keeper.
    await db.execute(sql`
      WITH dup_names AS (
        SELECT name FROM stripe.products
        WHERE active = true
        GROUP BY name HAVING COUNT(*) > 1
      ),
      corrections(name, pref_price, pref_ptype) AS (
        VALUES
          ('Men''s Winter Bundle', 6000, NULL::text),
          ('Women''s Winter Bundle', 6000, NULL::text),
          ('Chemistry Socks', NULL::int, 'apparel')
      ),
      ranked AS (
        SELECT p.id,
          ROW_NUMBER() OVER (
            PARTITION BY p.name
            ORDER BY
              (EXISTS (SELECT 1 FROM stripe.prices pr WHERE pr.product = p.id AND pr.active = true)) DESC,
              (c.pref_ptype IS NOT NULL AND p.metadata->>'productType' = c.pref_ptype) DESC,
              (c.pref_price IS NOT NULL AND EXISTS (
                 SELECT 1 FROM stripe.prices pr
                 WHERE pr.product = p.id AND pr.active = true
                   AND (pr._raw_data->>'unit_amount')::int = c.pref_price
               )) DESC,
              ((p.metadata->>'sortOrder') IS NOT NULL) DESC,
              p.id
          ) AS rn
        FROM stripe.products p
        JOIN dup_names d ON d.name = p.name
        LEFT JOIN corrections c ON c.name = p.name
        WHERE p.active = true
      ),
      deactivated AS (
        UPDATE stripe.products
        SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
            _updated_at = now()
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
        RETURNING id
      )
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM deactivated)
    `);

    // 1b) Winter clothing -> Apparel + seasonal hide. Merge productType 'apparel'
    //     and the hidden flag into every winter product's metadata (active or not)
    //     via _raw_data so the storefront (which reads the GENERATED columns) sees
    //     it in dev and on the prod frozen snapshot. Idempotent both directions:
    //     setting WINTER_HIDDEN back to false writes hidden='false' and the items
    //     reappear under Apparel.
    const winterNameList = sql.join(
      WINTER_SEASONAL_NAMES.map((n) => sql`${n}`),
      sql`, `,
    );
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            _raw_data,
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify({ productType: "apparel", hidden: WINTER_HIDDEN ? "true" : "false" })}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name IN (${winterNameList})
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

    // 3b) Scented candle -> served product image (prod frozen snapshot path).
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            _raw_data,
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify({ imageUrl: CANDLE_IMAGE })}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${CANDLE_NAME} AND active = true
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

    // 7) Remove retired products (Kids Sippy Cup + the baby line) from the
    //    storefront. In dev removing them from ALL_PRODUCTS lets seedProducts
    //    archive them in Stripe; here we deactivate the products + their prices
    //    in the DB directly so they also disappear from the Railway prod frozen
    //    snapshot (no Stripe there) and the dev edit holds regardless of sync.
    const retiredNameList = sql.join(
      RETIRED_PRODUCT_NAMES.map((n) => sql`${n}`),
      sql`, `,
    );
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE name IN (${retiredNameList}) AND active = true
    `);
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (
          SELECT id FROM stripe.products
          WHERE name IN (${sql.join(RETIRED_PRODUCT_NAMES.map((n) => sql`${n}`), sql`, `)})
        )
    `);

    // 8) Clean up leftover active prices on INACTIVE products. Deactivating a
    //    product (dedup in step 1, retired in step 7, or historical removals
    //    like the Duvet sets / Matte Black Mug / older High-Top Sneakers carried
    //    in this frozen prod snapshot) does NOT archive its PRICE objects. An
    //    inactive product is never shown in the storefront, so these are
    //    harmless, but they leave stray active prices that make the catalog
    //    confusing to audit and could surface in price-level reports. This is the
    //    generic, idempotent catch-all (mirrors seedProducts' final pass): for
    //    every inactive product, deactivate any still-active price via _raw_data
    //    (stripe.* columns are GENERATED). Runs last so it reflects every
    //    (de)activation/insert above.
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{active}', 'false'::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM stripe.products WHERE active = false)
    `);

    console.log("ensureCatalogData: ensured tumbler ($30 + logo + image), Coffee Mug ($15, handle colors), and phone cases ($30, model + logo); removed retired products (Kids Sippy Cup + baby line); archived leftover prices on inactive products.");
  } catch (err) {
    console.error("ensureCatalogData failed:", err);
  }
}
