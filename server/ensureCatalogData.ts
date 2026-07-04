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

// Whipped Body Butters. New consumable product ($12, 4 oz jar). Same
// self-applying pattern as the mug/cases: in dev seedProducts creates it in
// Stripe (synced to the DB) so the guarded insert is a no-op; on the Railway
// prod frozen snapshot (no Stripe) the insert is what actually creates it.
// Not logo-customizable (carries its own branding) — enforced by the
// `customize: 'none'` metadata flag in shared/customization.ts.
const BODY_BUTTER_PRODUCT_ID = "prod_kkbodybutter";
const BODY_BUTTER_PRICE_ID = "price_kkbodybutter";
const BODY_BUTTER_NAME = "Whipped Body Butters";
const BODY_BUTTER_PRICE_CENTS = 1200;
const BODY_BUTTER_IMAGE = "/assets/whipped_body_butters_branded.png";
const BODY_BUTTER_DESCRIPTION =
  "Luxurious Khomplete Khemistri whipped body butter in a 4 oz jar. Rich, fast-absorbing moisture that leaves skin soft and smooth. $12 per jar.";
const BODY_BUTTER_META = {
  category: "Body Care",
  productType: "accessory",
  customize: "none",
  scented: "true",
  imageUrl: BODY_BUTTER_IMAGE,
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
  // Old placeholder Vintage Baltimore tees, replaced by 10 real Baltimore
  // designs (see VINTAGE_PRODUCTS below). These names have no replacement, so
  // they are retired entirely from the storefront.
  "Memorial Stadium Tribute Tee",
  "Yellow Bowl Restaurant Tee",
  "Baltimore Trailways / Greyhound Station Tee",
  "Shane's Sandwich Shop Tee",
  "Memorial Stadium Navy Tee",
  "Shot Tower Marketplace Tee",
  "Washington Monument Baltimore Tee",
  "Chicken George Gold Tee",
  "Stop, Shop & Save Tee",
  "McCrory's Tee",
  "J.J. Newberry's Tee",
];

// Vintage Baltimore collection ($30 graphic tees). The 10 real designs that
// replace the old placeholder vintage tees. Same self-applying pattern as the
// mug/cases/hat: in dev seedProducts creates/updates them in Stripe (synced to
// the DB) so the guarded inserts are no-ops and the metadata UPDATE is
// idempotent; on the Railway prod frozen snapshot (no Stripe) the inserts create
// the 5 brand-new products and the UPDATE refreshes image/description on the 5
// that carried over (Cherry Hill, Fort McHenry, B&O, Great Blacks in Wax, Super
// Pride). Vintage tees are NOT logo-customizable (the graphic IS the design) —
// enforced by NON_LOGO_PRODUCT_TYPES in shared/customization.ts.
const VINTAGE_PRICE_CENTS = 3000;
const VINTAGE_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkvintagecherryhill",
    priceId: "price_kkvintagecherryhill",
    name: "Cherry Hill Tribute Tee",
    description:
      "Cherry Hill, Baltimore, MD. A tribute to one of Baltimore's first planned African American communities. From its mid-20th-century post-war housing boom to its proud, resilient present, Cherry Hill's story runs deep in South Baltimore. Wear your community pride. Black tee.",
    meta: { category: "Baltimore Pride", productType: "vintage", sortOrder: "60", imageUrl: "/attached_assets/1781657754385_1781663129062.png" },
  },
  {
    productId: "prod_kkvintageftmchenry",
    priceId: "price_kkvintageftmchenry",
    name: "Fort McHenry Tee",
    description:
      "Fort McHenry — Baltimore, Maryland. War of 1812.\n\nFort McHenry was built between 1798 and 1803 to defend Baltimore from naval invasion. During the War of 1812, on September 13-14, 1814, the British navy bombarded the fort for 25 hours. Despite the intense attack, the fort's garrison held their ground and the American flag continued to fly, inspiring Francis Scott Key to write \"The Star-Spangled Banner.\" Now a national monument and historic shrine. Royal blue tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "61", imageUrl: "/attached_assets/Screenshot_20260616_215848_Gallery_1781663170048.jpg" },
  },
  {
    productId: "prod_kkvintagemuseums",
    priceId: "price_kkvintagemuseums",
    name: "Celebrate Baltimore's Museums Tee",
    description:
      "Celebrate Baltimore's Museums. A tribute to the city's cultural treasures — The Walters Art Museum, the B&O Railroad Museum, the Reginald F. Lewis Museum and more. The back honors prominent Baltimore museums: the National Great Blacks In Wax Museum, American Visionary Art Museum, Maryland Center for History and Culture, National Aquarium, Maryland Science Center, Fort McHenry National Monument, Port Discovery Children's Museum, and the James E. Lewis Museum of Art. Heather gray tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "62", imageUrl: "/attached_assets/1781660600583_1781663395049.jpg" },
  },
  {
    productId: "prod_kkvintageconstellation",
    priceId: "price_kkvintageconstellation",
    name: "USS Constellation Tee",
    description:
      "USS Constellation — The Historic Warship. Baltimore, Maryland. Since 1854.\n\nDesigned and built in 1854, USS Constellation is a legend of the U.S. Navy — the last all-sail sloop-of-war ever constructed by the Navy. Commissioned in August 1854, she embodies American maritime heritage, serving for over a century. Now docked at Baltimore's Inner Harbor, she is a National Historic Landmark. Navy tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "63", imageUrl: "/attached_assets/1781660105777_1781663431031.jpg" },
  },
  {
    productId: "prod_kkvintagegreatblacks",
    priceId: "price_kkvintagegreatblacks",
    name: "National Great Blacks in Wax Museum Tee",
    description:
      "The National Great Blacks In Wax Museum — North Avenue, Baltimore. Founded as America's first wax museum dedicated solely to the study and celebration of African American history. Opened on East North Avenue in Baltimore, Maryland, the museum stands as a testament to the rich legal, cultural, and historical contributions of Black people across America. Purple tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "64", imageUrl: "/attached_assets/1781660024391_1781663431048.jpg" },
  },
  {
    productId: "prod_kkvintagemurrys",
    priceId: "price_kkvintagemurrys",
    name: "Murry's Tee",
    description:
      "Murry's — Your Neighborhood Food Store! A nostalgic tribute to the beloved Baltimore grocery institution, complete with the classic retro chef logo. Soft black tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "65", imageUrl: "/attached_assets/1781659209780_1781663431055.jpg" },
  },
  {
    productId: "prod_kkvintagestopnsave",
    priceId: "price_kkvintagestopnsave",
    name: "Stop-N-Save Tee",
    description:
      "A History of Stop-N-Save. Established in 1952 by entrepreneur Henry Barksdale, Stop-N-Save was a pioneering Black-owned supermarket chain and cornerstone of the Baltimore community. More than a store, it provided employment, accessible groceries, and vital support for generations of residents in historic neighborhoods. Key locations included Harford Road (the original store), Mondawmin, and Greenmount Avenue. A Baltimore legacy of resilience and service. Est. 1952. Black tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "66", imageUrl: "/attached_assets/1781658935332_1781663431066.jpg" },
  },
  {
    productId: "prod_kkvintagesuperpride",
    priceId: "price_kkvintagesuperpride",
    name: "Super Pride Markets Tee",
    description:
      "Super Pride Markets: A Baltimore Landmark. Established in 1948 by civil rights leader and visionary businessman Henry G. Parks Jr., Super Pride Markets became a pillar of the Baltimore community. This prominent Black-owned supermarket chain provided essential services, fresh groceries, and hundreds of jobs to generations in the 20th century. Super Pride stood as a symbol of economic empowerment, community resilience, and opportunity in the heart of Baltimore. Gold tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "67", imageUrl: "/attached_assets/1781658663211_1781663431071.jpg" },
  },
  {
    productId: "prod_kkvintageunionbus",
    priceId: "price_kkvintageunionbus",
    name: "Union Bus Terminal Tee",
    description:
      "Baltimore Greyhound-Trailways Union Bus Terminal. Howard & Fayette St. Est. 1941, Baltimore, MD. A tribute to the Art Deco landmark that served as a bustling hub for regional travel. The back traces its history — 1941 construction, the 1940s-1980s operational heyday, the 1987 closure of the original Art Deco terminal, and the move to the current facility on Haines Street. Black tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "68", imageUrl: "/attached_assets/1781658177886_1781663431075.jpg" },
  },
  {
    productId: "prod_kkvintagebandorr",
    priceId: "price_kkvintagebandorr",
    name: "B&O Railroad Tribute Tee",
    description:
      "Baltimore & Ohio Railroad — The Birthplace of American Railroading. Baltimore, Maryland. Founded 1827.\n\nThe B&O was the first common carrier railroad in the U.S., founded in Baltimore to compete with New York's Erie Canal. The first stone for the line was laid on July 4, 1828, connecting Baltimore to the Ohio River. Mount Clare Station, built in 1830, is the oldest passenger rail terminal in the United States. It fueled Baltimore's growth, linking the East Coast with the expanding American West — linking 13 great states with the nation. Denim blue tee.",
    meta: { category: "Legacy Spots", productType: "vintage", sortOrder: "69", imageUrl: "/attached_assets/1781657385584_1781663431078.png" },
  },
];

// Consolidated bedding (Comforter Set $99, Sheet Set $80), each with a size
// selector (Twin/Full/Queen/King). Same self-applying pattern as the mug/cases:
// in dev seedProducts creates them in Stripe (synced to the DB) so the guarded
// inserts are no-ops; on the Railway prod frozen snapshot (no Stripe) the inserts
// are what actually create them. Size-only (no logo) — the eagle/"Sleep and Dream
// in Luxury" emblem IS the design, enforced by the `sizes` metadata path in
// shared/customization.ts.
// Women's graphic tees ($30, fixed design, size-only). Same self-applying pattern
// as the Vintage collection: in dev seedProducts creates them in Stripe (synced to
// the DB) so the guarded inserts are no-ops; on the Railway prod frozen snapshot
// (no Stripe) the inserts are what actually create them, and the UPDATE keeps the
// description/metadata current. The graphic IS the design — NOT logo-customizable
// (customize: 'none'); they still offer a size selector (apparel + T-Shirts -> the
// XS–6XL apparelSizesFor path in shared/customization.ts).
const WOMENS_TEE_PRICE_CENTS = 3000;
const WOMENS_TEE_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkwteewatercolorphoenix",
    priceId: "price_kkwteewatercolorphoenix",
    name: "Watercolor Phoenix Tee",
    description:
      "Soft heather gray women's tee featuring a pastel watercolor phoenix rising from an alchemy flask inside a crest, with KHOMPLETE KHEMISTRI APPAREL lettering in dreamy purple, teal, and pink tones. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "40", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_watercolor_phoenix.jpg" },
  },
  {
    productId: "prod_kkwteerosegoldphoenix",
    priceId: "price_kkwteerosegoldphoenix",
    name: "Rose Gold Phoenix Tee",
    description:
      "Heather gray women's tee with an elegant rose-gold line-art phoenix rising from a flask inside a shield crest, finished with KHOMPLETE KHEMISTRI APPAREL script. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "41", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_rose_gold_phoenix.jpg" },
  },
  {
    productId: "prod_kkwteemolecularheart",
    priceId: "price_kkwteemolecularheart",
    name: "Molecular Heart Tee",
    description:
      "Heather gray women's tee featuring a rose-gold honeycomb molecular heart formed from chemistry bonds, with KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "42", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_molecular_heart.jpg" },
  },
  {
    productId: "prod_kkwteealchemisttriangle",
    priceId: "price_kkwteealchemisttriangle",
    name: "Alchemist's Triangle Tee",
    description:
      "Heather gray women's tee with a silver and rose-gold inverted-triangle alchemy emblem and floating molecules, finished with KHOMPLETE KHEMISTRI APPAREL. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "43", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_alchemists_triangle.jpg" },
  },
  {
    productId: "prod_kkwteeladykhemistri",
    priceId: "price_kkwteeladykhemistri",
    name: "Lady of Khemistri Tee",
    description:
      "Heather gray women's tee featuring a rose-gold profile of a woman within a molecular shield crest, with KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "44", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_lady_of_khemistri.jpg" },
  },
  {
    productId: "prod_kkwteecelestial",
    priceId: "price_kkwteecelestial",
    name: "Celestial Constellations Tee",
    description:
      "Heather gray women's tee with a gold crescent moon, constellations, and a molecule motif, finished with KHOMPLETE KHEMISTRI APPAREL. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "45", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_celestial_constellations.jpg" },
  },
  {
    productId: "prod_kkwteehelixshield",
    priceId: "price_kkwteehelixshield",
    name: "Geometric Helix Shield Tee",
    description:
      "Heather gray women's tee featuring a silver DNA-helix diamond crest framing KHOMPLETE KHEMISTRI APPAREL, with bold geometric lettering below. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "46", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_geometric_helix_shield.jpg" },
  },
  {
    productId: "prod_kkwteefloralalchemy",
    priceId: "price_kkwteefloralalchemy",
    name: "Floral Alchemy Tee",
    description:
      "Soft cream women's tee featuring a rose-gold floral alchemy flask within a teardrop frame surrounded by blossoms, with FLORAL ALCHEMY \u00b7 KHOMPLETE KHEMISTRI APPAREL lettering. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "47", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_floral_alchemy.jpg" },
  },
  {
    productId: "prod_kkwteerainbowphoenix",
    priceId: "price_kkwteerainbowphoenix",
    name: "Rainbow Phoenix Tee",
    description:
      "Heather gray women's tee featuring a vibrant rainbow phoenix rising from a flask inside a crest, encircled by KHOMPLETE KHEMISTRI APPAREL and chemistry molecules. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "48", gender: "Women", customize: "none", imageUrl: "/assets/kk_womens_tee_rainbow_phoenix.jpg" },
  },
  // FOUNDERS "3" TRIDENT CREST TEES (unisex) — the signature emblem honoring the
  // three founding partners (D. Taylor, C. Oliver, J. Young Jr.). Same $30 fixed-
  // design, size-only treatment as the graphic tees above. Shares this array's loop.
  {
    productId: "prod_kkfteenavy",
    priceId: "price_kkfteenavy",
    name: 'Founders "3" Crest Tee \u2014 Navy',
    description:
      "Navy unisex tee featuring the Khomplete Khemistri founders' crest: a chrome-blue and gold trident forming a \u201c3,\u201d engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "49", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_navy.jpg" },
  },
  {
    productId: "prod_kkfteeblackgold",
    priceId: "price_kkfteeblackgold",
    name: 'Founders "3" Crest Tee \u2014 Black & Gold',
    description:
      "Black unisex tee featuring the Khomplete Khemistri founders' crest: a gold and silver trident forming a \u201c3,\u201d engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "50", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_black_gold.jpg" },
  },
  {
    productId: "prod_kkfteeblacksilver",
    priceId: "price_kkfteeblacksilver",
    name: 'Founders "3" Crest Tee \u2014 Black & Silver',
    description:
      "Black unisex tee featuring the Khomplete Khemistri founders' crest: a polished silver trident forming a \u201c3,\u201d engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "51", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_black_silver.jpg" },
  },
  {
    productId: "prod_kkfteeburgundy",
    priceId: "price_kkfteeburgundy",
    name: 'Founders "3" Crest Tee \u2014 Burgundy',
    description:
      "Burgundy unisex tee featuring the Khomplete Khemistri founders' crest: a gold trident forming a \u201c3,\u201d engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "52", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_burgundy.jpg" },
  },
  {
    productId: "prod_kkfteebrown",
    priceId: "price_kkfteebrown",
    name: 'Founders "3" Crest Tee \u2014 Espresso Brown',
    description:
      "Espresso brown unisex tee featuring the Khomplete Khemistri founders' crest: a gold trident forming a \u201c3,\u201d engraved with the three founding partners D. Taylor, C. Oliver, and J. Young Jr., encircled by KHOMPLETE KHEMISTRI APPAREL EST. 2020. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "53", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_brown.jpg" },
  },
  {
    productId: "prod_kkftee3meaningblack",
    priceId: "price_kkftee3meaningblack",
    name: 'The Number Three Tee \u2014 Black',
    description:
      "Black unisex tee with a striking gold \u201c3\u201d above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment \u2014 bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "54", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_three_meaning_black.jpg" },
  },
  {
    productId: "prod_kkftee3meaningwhite",
    priceId: "price_kkftee3meaningwhite",
    name: 'The Number Three Tee \u2014 White',
    description:
      "White unisex tee with a gold-and-silver \u201c3\u201d above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment \u2014 bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "55", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_three_meaning_white.jpg" },
  },
  {
    productId: "prod_kkftee3meaningsilver",
    priceId: "price_kkftee3meaningsilver",
    name: 'The Number Three Tee \u2014 Silver',
    description:
      "White unisex tee with a polished silver \u201c3\u201d above KHOMPLETE KHEMISTRI APPAREL. The number three represents harmony, balance, and complete alignment \u2014 bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "56", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_three_meaning_silver.jpg" },
  },
  {
    productId: "prod_kkftee3infinity",
    priceId: "price_kkftee3infinity",
    name: "The Number Three Infinity Tee \u2014 Cream",
    description:
      "Cream unisex tee showcasing the Khomplete Khemistri infinity \u201c3\u201d crest in three metallic finishes \u2014 gold-and-black, silver-and-gold, and silver-and-black \u2014 beneath KHOMPLETE KHEMISTRI and above APPAREL & ACCESSORIES. The number three represents harmony, balance, and complete alignment \u2014 bringing together your mind, body, and spirit to create something powerful. It symbolizes growth and expansion, reminding you that your creativity, expression, and inner strength are naturally manifesting into reality. You are fully supported in building exactly what you envision. Select your size at checkout.",
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "68", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_founders_tee_three_infinity.jpg" },
  },
];

// Branded all-over-print apparel ("Forging the Future of Fabric"). Same
// self-applying create/keep-current pattern as the women's tees, but each item
// carries its own priceCents (tee $30, hoodie $60). Sizes are derived adult
// XS–6XL via apparelSizesFor (no `sizes` metadata).
const BRANDED_APPAREL_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  priceCents: number;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkforgingtee",
    priceId: "price_kkforgingtee",
    name: "Forging the Future Tee \u2014 Charcoal",
    description:
      "Charcoal heather unisex tee with an all-over front print of the Khomplete Khemistri alchemy lab \u2014 glowing flasks, gears, and the master chemist forging garments \u2014 beneath KHOMPLETE KHEMISTRI APPAREL AND ACCESSORIES. EST 2020, LAUNCHED IN 2023, FORGING THE FUTURE OF FABRIC. Select your size at checkout.",
    priceCents: 3000,
    meta: { category: "T-Shirts", productType: "apparel", sortOrder: "69", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_forging_future_tee_charcoal.jpg" },
  },
  {
    productId: "prod_kkforginghoodie",
    priceId: "price_kkforginghoodie",
    name: "Forging the Future Hoodie \u2014 Green",
    description:
      "Forest-green unisex pullover hoodie with an all-over print of the Khomplete Khemistri steampunk alchemy lab wrapping the hood, body, and sleeves \u2014 glowing copper pipes, flasks, and the master chemist forging garments \u2014 with KHOMPLETE KHEMISTRI APPAREL & ACCESSORIES. EST 2020, LAUNCHED IN 2023, FORGING THE FUTURE OF FABRIC. Select your size at checkout.",
    priceCents: 6000,
    meta: { category: "Hoodies", productType: "apparel", sortOrder: "70", gender: "Unisex", customize: "none", imageUrl: "/assets/kk_forging_future_hoodie_green.jpg" },
  },
  {
    productId: "prod_kkpolotrident",
    priceId: "price_kkpolotrident",
    name: "Personalized Polo Shirt",
    description:
      "Personalized embroidered polo shirt on soft, breathable pique knit with a classic three-button collar. CHOOSE YOUR LOGO, COLOR, AND SIZE at checkout \u2014 pick any logo from our full Branded Logo Collection. Available in 15 colors and sizes XS through 6XL.",
    priceCents: 4500,
    meta: { category: "Polos", productType: "apparel", sortOrder: "71", gender: "Unisex", imageUrl: "/assets/kk_polo_trident_three.jpg", colors: "Black, Green, Bright Green, Grey, Lake Blue, Light Blue, Navy Blue, Orange, Pink, Purple, Red, Rose Red, Royal Blue, Wine Red, Yellow" },
  },
];

// Kids graphic tees ($20, fixed design, kids size selector). Same self-applying
// pattern as the women's/founders tees: created only when absent (no-op in dev
// where Stripe sync makes them; the real creator on the Railway prod frozen
// snapshot), then description/metadata kept current and price forced to $20.
// Size-only via the `sizes` metadata (kids sizes); category "Kids" keeps them
// out of the adult XS–6XL apparel sizing and lands them in the Kids Collection.
const KIDS_TEE_PRICE_CENTS = 2000;
const KIDS_TEE_SIZES = "2T, 3T, 4T, Youth XS, Youth S, Youth M, Youth L, Youth XL";
const KIDS_TEE_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkkidsastronomer",
    priceId: "price_kkkidsastronomer",
    name: "Little Astronomer Kids Tee \u2014 Charcoal",
    description:
      "Charcoal kids' tee featuring a little astronomer gazing through a telescope at a glowing solar system, with colorful A-B-C-D-E learning blocks and the Khomplete Khemistri Apparel crest. Inspires curiosity and a love of learning. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "57", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_astronomer_charcoal.jpg" },
  },
  {
    productId: "prod_kkkidsstargazer",
    priceId: "price_kkkidsstargazer",
    name: "Young Stargazer Kids Tee \u2014 Brown",
    description:
      "Rich brown kids' tee with a young stargazer and telescope beneath golden constellations, plus playful alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "58", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_stargazer_brown.jpg" },
  },
  {
    productId: "prod_kkkidsexplorer",
    priceId: "price_kkkidsexplorer",
    name: "Little Explorer Kids Tee \u2014 Orange",
    description:
      "Bright orange kids' tee featuring a little explorer with a globe, map, and compass at sunrise, plus colorful learning blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "59", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_explorer_orange.jpg" },
  },
  {
    productId: "prod_kkkidsnature",
    priceId: "price_kkkidsnature",
    name: "Nature Explorers Kids Tee \u2014 Green",
    description:
      "Green kids' tee showing three young explorers planting, reading, and holding a globe in a sunny forest, with alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "60", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_nature_green.jpg" },
  },
  {
    productId: "prod_kkkidsapplered",
    priceId: "price_kkkidsapplered",
    name: "ABC Apple & Books Kids Tee \u2014 Red",
    description:
      "Red kids' tee with a classic apple-on-books design, sparkles, and colorful A-B-C learning blocks, finished with the Khomplete Khemistri Apparel crest. A perfect back-to-school look. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "61", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_apple_books_red.jpg" },
  },
  {
    productId: "prod_kkkidsdreamers",
    priceId: "price_kkkidsdreamers",
    name: "Future Dreamers Kids Tee \u2014 Yellow",
    description:
      "Sunny yellow kids' tee celebrating big dreams \u2014 a future teacher, doctor, and businessman \u2014 with colorful learning blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "62", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_dreamers_yellow.jpg" },
  },
  {
    productId: "prod_kkkidsheroes",
    priceId: "price_kkkidsheroes",
    name: "Community Heroes Kids Tee \u2014 Royal Blue",
    description:
      "Royal blue kids' tee featuring a friendly community police officer with a family in a safe neighborhood, plus alphabet blocks and the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "63", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_heroes_blue.jpg" },
  },
  {
    productId: "prod_kkkidsapplepink",
    priceId: "price_kkkidsapplepink",
    name: "ABC Apple & Books Kids Tee \u2014 Pink",
    description:
      "Pink kids' tee with a dreamy apples-and-books design, sparkling stars, and colorful learning blocks, finished with the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "64", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_apple_books_pink.jpg" },
  },
  {
    productId: "prod_kkkidsapplewhite",
    priceId: "price_kkkidsapplewhite",
    name: "ABC Apple & Books Kids Tee \u2014 White",
    description:
      "Clean white kids' tee with a bright apples-on-books design, sparkles, and colorful A-B-C blocks, plus the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "65", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_apple_books_white.jpg" },
  },
  {
    productId: "prod_kkkidsappleblack",
    priceId: "price_kkkidsappleblack",
    name: "ABC Apple & Books Kids Tee \u2014 Black & Gold",
    description:
      "Black kids' tee with a striking golden apple-on-books design, gold sparkles, and matching learning blocks, finished with the Khomplete Khemistri Apparel crest. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "66", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_apple_books_black.jpg" },
  },
  {
    productId: "prod_kkkidsrocket",
    priceId: "price_kkkidsrocket",
    name: "Rocket & Jet Kids Tee \u2014 Red",
    description:
      "Red kids' tee blasting off with a cartoon rocket and fighter jet among the stars, topped with the Khomplete Khemistri Apparel crest. Built for little dreamers who reach for the sky. Select your size at checkout.",
    meta: { category: "Kids", productType: "apparel", sortOrder: "67", gender: "Kids", customize: "none", sizes: KIDS_TEE_SIZES, imageUrl: "/assets/kk_kids_tee_rocket_jet_red.jpg" },
  },
];

const BEDDING_PRICE_COMFORTER_CENTS = 9900;
const BEDDING_PRICE_SHEET_CENTS = 8000;
const BEDDING_PRICE_PILLOWCASE_CENTS = 2500;
const BEDDING_PRICE_BODYPILLOW_CENTS = 3600;
const BEDDING_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  priceCents: number;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkcomforterset",
    priceId: "price_kkcomforterset",
    name: "Khomplete Khemistri Accessories Comforter Set",
    description:
      'Luxury velvet comforter set featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold. Rich chocolate brown. Includes comforter and matching pillow shams. Select your size at checkout: Twin, Full, Queen, or King.',
    priceCents: BEDDING_PRICE_COMFORTER_CENTS,
    meta: { category: "Bedding", productType: "accessory", sortOrder: "50", imageUrl: "/assets/kk_comforter_set.png", fulfillment: "Amazon", sizes: "Twin, Full, Queen, King" },
  },
  {
    productId: "prod_kksheetset",
    priceId: "price_kksheetset",
    name: "Khomplete Khemistri Accessories Sheet Set",
    description:
      'Premium satin sheet set featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold. Elegant chocolate brown. Includes fitted sheet, flat sheet, and matching pillowcases. Select your size at checkout: Twin, Full, Queen, or King.',
    priceCents: BEDDING_PRICE_SHEET_CENTS,
    meta: { category: "Bedding", productType: "accessory", sortOrder: "51", imageUrl: "/assets/kk_sheet_set.png", fulfillment: "Amazon", sizes: "Twin, Full, Queen, King" },
  },
  {
    productId: "prod_kkpillowcaseset",
    priceId: "price_kkpillowcaseset",
    name: "Khomplete Khemistri Accessories Pillowcase Set",
    description:
      'Luxury branded pillowcase set — pack of 2. Featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold on rich chocolate brown. Select your size at checkout: Twin, Full, Queen, or King.',
    priceCents: BEDDING_PRICE_PILLOWCASE_CENTS,
    meta: { category: "Bedding", productType: "accessory", sortOrder: "52", imageUrl: "/assets/kk_pillowcase_set.png", fulfillment: "Amazon", sizes: "Twin, Full, Queen, King" },
  },
  {
    productId: "prod_kkbodypillow",
    priceId: "price_kkbodypillow",
    name: "Khomplete Khemistri Accessories Body Pillow",
    description:
      'Luxury branded body pillow featuring the Khomplete Khemistri Accessories eagle badge and "Sleep and Dream in Luxury" embroidered in gold on rich chocolate brown. Generous 60" x 20" size for full-body comfort.',
    priceCents: BEDDING_PRICE_BODYPILLOW_CENTS,
    meta: { category: "Bedding", productType: "accessory", sortOrder: "53", imageUrl: "/assets/kk_body_pillow.png", fulfillment: "Amazon", customize: "none" },
  },
];

// Khomplete Khemistri Elements — Vitamin Supplements. Self-created in prod the
// same way as bedding (synthetic prod_kk*/price_kk* ids). No logo customization
// (customize: "none"); flat price; each bottle is 60 count.
const ELEMENTS_PRICE_CENTS = 2500;
const ELEMENTS_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  priceCents: number;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkelemsbcaa",
    priceId: "price_kkelemsbcaa",
    name: "BCAA Complex",
    description:
      "Khomplete Khemistri Elements BCAA Complex — branched-chain amino acids to support muscle recovery, endurance, and lean-muscle maintenance. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "100", imageUrl: "/assets/kk_elements_bcaa.png", customize: "none" },
  },
  {
    productId: "prod_kkelemscreatine",
    priceId: "price_kkelemscreatine",
    name: "Creatine Monohydrate",
    description:
      "Khomplete Khemistri Elements Creatine Monohydrate — pure creatine to support strength, power output, and workout performance. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "101", imageUrl: "/assets/kk_elements_creatine.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsbeetroot",
    priceId: "price_kkelemsbeetroot",
    name: "Organic Beetroot",
    description:
      "Khomplete Khemistri Elements Organic Beetroot — supports healthy circulation, stamina, and natural energy. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "102", imageUrl: "/assets/kk_elements_beetroot.png", customize: "none" },
  },
  {
    productId: "prod_kkelemslarginine",
    priceId: "price_kkelemslarginine",
    name: "L-Arginine",
    description:
      "Khomplete Khemistri Elements L-Arginine — supports healthy blood flow, circulation, and workout pump. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "103", imageUrl: "/assets/kk_elements_larginine.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsseamoss",
    priceId: "price_kkelemsseamoss",
    name: "Sea Moss",
    description:
      "Khomplete Khemistri Elements Sea Moss — nutrient-rich sea moss to support immunity, thyroid health, and overall wellness. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "104", imageUrl: "/assets/kk_elements_seamoss.png", customize: "none" },
  },
  {
    productId: "prod_kkelemscoq10",
    priceId: "price_kkelemscoq10",
    name: "COQ10",
    description:
      "Khomplete Khemistri Elements COQ10 — Coenzyme Q10 to support heart health, cellular energy, and antioxidant protection. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "105", imageUrl: "/assets/kk_elements_coq10.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsturmeric",
    priceId: "price_kkelemsturmeric",
    name: "Turmeric w/ BioPerine",
    description:
      "Khomplete Khemistri Elements Turmeric with BioPerine — black pepper extract for enhanced absorption; supports joint comfort and a healthy inflammatory response. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "106", imageUrl: "/assets/kk_elements_turmeric.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsk2d3",
    priceId: "price_kkelemsk2d3",
    name: "Vitamin K2 + D3",
    description:
      "Khomplete Khemistri Elements Vitamin K2 + D3 — supports bone strength, immune health, and healthy calcium absorption. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "107", imageUrl: "/assets/kk_elements_k2d3.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsmagnesium",
    priceId: "price_kkelemsmagnesium",
    name: "Magnesium Glycinate",
    description:
      "Khomplete Khemistri Elements Magnesium Glycinate — highly absorbable magnesium to support relaxation, restful sleep, and muscle function. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "108", imageUrl: "/assets/kk_elements_magnesium.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsashwagandha",
    priceId: "price_kkelemsashwagandha",
    name: "Ashwagandha & Black Pepper",
    description:
      "Khomplete Khemistri Elements Ashwagandha & Black Pepper — black pepper for enhanced absorption; supports stress relief, balance, and vitality. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "109", imageUrl: "/assets/kk_elements_ashwagandha.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsacai",
    priceId: "price_kkelemsacai",
    name: "Acai Berry Complex",
    description:
      "Khomplete Khemistri Elements Acai Berry Complex — antioxidant-rich acai berry to support natural energy, immunity, and overall wellness. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "110", imageUrl: "/assets/kk_elements_acai.png", customize: "none" },
  },
  {
    productId: "prod_kkelemsbrain",
    priceId: "price_kkelemsbrain",
    name: "Brain Support Complex",
    description:
      "Khomplete Khemistri Elements Brain Support Complex — a nootropic blend crafted to support focus, memory, and mental clarity. 60 count.",
    priceCents: ELEMENTS_PRICE_CENTS,
    meta: { category: "Elements", productType: "elements", sortOrder: "111", imageUrl: "/assets/kk_elements_brain.png", customize: "none" },
  },
];

// Extra accessories that are self-created in prod the same way as bedding
// (synthetic prod_kk*/price_kk* ids, no Stripe on the Railway frozen snapshot).
// These carry a `colors` list (multi-color picker) and offer the full logo
// catalog by default (no logoOptions metadata).
const EXTRA_ACCESSORY_PRODUCTS: {
  productId: string;
  priceId: string;
  name: string;
  description: string;
  priceCents: number;
  meta: Record<string, string>;
}[] = [
  {
    productId: "prod_kkdrawstringbackpack",
    priceId: "price_kkdrawstringbackpack",
    name: "Personalized Drawstring Backpack",
    description:
      "Personalized drawstring backpack with your choice of any Khomplete Khemistri logo from our full catalog. Lightweight cinch-top bag, perfect for the gym, school, or everyday carry. SELECT YOUR COLOR AND LOGO at checkout! Available in 5 colors: Black, Orange, Royal Blue, Pink, and White.",
    priceCents: 1200,
    meta: { category: "Bags", productType: "accessory", imageUrl: "/assets/kk_drawstring_backpack.png", gender: "Unisex", colors: "Black, Orange, Royal Blue, Pink, White" },
  },
  {
    productId: "prod_kkcoffeesleeve",
    priceId: "price_kkcoffeesleeve",
    name: "Personalized Coffee Cup Sleeve",
    description:
      "Personalized reusable neoprene coffee cup sleeve with your choice of any Khomplete Khemistri logo from our full catalog. Insulated to keep hot drinks hot and cold drinks cold while keeping your hands comfortable. Universal fit for 22-24 oz cups. SELECT YOUR COLOR AND LOGO at checkout! Available in 34 colors: White, Black, Navy Blue, Royal Blue, Pink, Deep Sky Blue, Red, Blush Pink, Maroon, Sage, Candy, Pastel, Lavender, Baby Blue, Light Grey, Charcoal, Teal, Blackish Green, Peach Yellow, Coral, Violet, Rose Red, Orange, Magenta, Bright Gold, Kelly Green, Grass Green, Turquoise, Robin Egg Blue, Aquamarine, Light Teal, Mint Green, Mint, and Hot Pink.",
    priceCents: 1500,
    meta: { category: "Drinkware", productType: "accessory", imageUrl: "/assets/kk_coffee_sleeve.png", gender: "Unisex", colors: "White, Black, Navy Blue, Royal Blue, Pink, Deep Sky Blue, Red, Blush Pink, Maroon, Sage, Candy, Pastel, Lavender, Baby Blue, Light Grey, Charcoal, Teal, Blackish Green, Peach Yellow, Coral, Violet, Rose Red, Orange, Magenta, Bright Gold, Kelly Green, Grass Green, Turquoise, Robin Egg Blue, Aquamarine, Light Teal, Mint Green, Mint, Hot Pink" },
  },
  {
    productId: "prod_kksatinrobe",
    priceId: "price_kksatinrobe",
    name: "Khomplete Khemistri Elements Satin Robe",
    description:
      "Luxurious satin robe featuring the Khomplete Khemistri Elements emblem embroidered in gold, finished with elegant gold piping, a self-tie belt, and side pockets. Smooth, lightweight satin in a relaxed unisex fit. One flat price for every size, XS to 6XL. SELECT YOUR COLOR AND SIZE at checkout! Available in 41 colors.",
    priceCents: 4000,
    meta: { category: "Sleepwear", productType: "accessory", sortOrder: "24", imageUrl: "/assets/satin_robe_kk_elements.png", gender: "Unisex", sizes: "XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL", colors: "Black, White, Ivory, Champagne, Gold, Silver, Grey Silver, Navy, Royal, Sky Blue, Turquoise, Teal, Aqua, Mint, Eucalyptus, Sage Green, Olive, Emerald Green, Green, Lime, Yellow, Lemon Yellow, Antique Gold, Copper, Burnt Orange, Orange, Coral, Red, Wine, Hot Pink, Blush, Light Pink, Dusty Rose, Mauve, Lavender, Dusty Plum, Plum, Purple, Dark Purple, Brown, Dark Brown" },
  },
  {
    productId: "prod_kksneakergrey",
    priceId: "price_kksneakergrey",
    name: "Khomplete Khemistri Sneakers \u2014 Grey/Silver",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a cool grey colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in polished silver. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7000,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_grey.jpg" },
  },
  {
    productId: "prod_kksneakersand",
    priceId: "price_kksneakersand",
    name: "Khomplete Khemistri Sneakers \u2014 Sand/Gold",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a warm sand/tan colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in gold. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7000,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_sand.jpg" },
  },
  {
    productId: "prod_kksneakerblack",
    priceId: "price_kksneakerblack",
    name: "Khomplete Khemistri Sneakers \u2014 Black/Red",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a black colorway with red accents and a lace-anchored Khomplete Khemistri Apparel crest badge in red. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7000,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_black.jpg" },
  },
  {
    productId: "prod_kksneakerwhite",
    priceId: "price_kksneakerwhite",
    name: "Khomplete Khemistri Sneakers \u2014 White/Silver",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a clean white colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in polished silver. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7000,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_white.jpg" },
  },
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

// Branded Logo Fitted Hat ($40, apparel). A new product that must exist in
// whatever DB this server is connected to. In dev seedProducts creates it in
// Stripe (synced to the DB) so the guarded insert below is a no-op; on the
// Railway prod frozen snapshot (no Stripe) the insert is what actually creates
// it. Color + logo are selected at checkout (see colors/logoOptions metadata).
const HAT_PRODUCT_ID = "prod_kkfittedhat";
const HAT_PRICE_ID = "price_kkfittedhat";
const HAT_OLD_NAME = "Branded Logo Fitted Hat";
const HAT_NAME = "Branded Logo Adjustable Hat";
const HAT_PRICE_CENTS = 4000;
const HAT_IMAGE = "/assets/kk_hat_trident_three.png";
const HAT_DESCRIPTION =
  "Structured six-panel baseball cap with an adjustable back strap for a comfortable, one-size-fits-most fit, finished with embroidered Khomplete Khemistri branding on the front. SELECT YOUR COLOR AND LOGO at checkout — pick any logo from our full Branded Logo Collection.";
const HAT_META = {
  category: "Headwear",
  productType: "apparel",
  sortOrder: "13",
  imageUrl: HAT_IMAGE,
  gender: "Unisex",
  fulfillment: "Amazon",
  amazonLink: "https://www.amazon.com/dp/B0GSJHB163",
  colors: "Black, Navy, Gray, Khaki, Red",
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

// Products that can't currently be produced/fulfilled and so are pulled from the
// storefront entirely (metadata.hidden='true'). Removed because no supplier will
// make them. Reversible: delete a name here and redeploy to bring it back.
const DISCONTINUED_NAMES = [
  "Personalized Custom Logo Clogs",
  "Logo Keychain",
];

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

    // 1c) Discontinued products -> hidden. These items can't currently be
    //     produced/fulfilled, so they're removed from the storefront by setting
    //     metadata.hidden='true' (the same flag the listing endpoints skip on).
    //     Done here via _raw_data so it holds in dev AND on the prod frozen
    //     snapshot. Non-destructive and reversible — just drop a name from
    //     DISCONTINUED_NAMES and redeploy to bring it back.
    const discontinuedNameList = sql.join(
      DISCONTINUED_NAMES.map((n) => sql`${n}`),
      sql`, `,
    );
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            _raw_data,
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify({ hidden: "true" })}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name IN (${discontinuedNameList})
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
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify({ imageUrl: CANDLE_IMAGE, scented: "true" })}::jsonb,
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

    // 5b) Whipped Body Butters ($12, 4 oz). Create only when absent (no-op in dev
    //     where Stripe sync made it; the real creator on the Railway prod
    //     snapshot), then ensure the metadata/description/price stay current.
    const bodyButterProductRaw = JSON.stringify({
      id: BODY_BUTTER_PRODUCT_ID,
      object: "product",
      active: true,
      name: BODY_BUTTER_NAME,
      description: BODY_BUTTER_DESCRIPTION,
      metadata: BODY_BUTTER_META,
      images: [],
      created,
      livemode: false,
    });

    const bodyButterPriceRaw = JSON.stringify({
      id: BODY_BUTTER_PRICE_ID,
      object: "price",
      active: true,
      currency: "usd",
      unit_amount: BODY_BUTTER_PRICE_CENTS,
      product: BODY_BUTTER_PRODUCT_ID,
      type: "one_time",
      billing_scheme: "per_unit",
      created,
      livemode: false,
    });

    await db.execute(sql`
      INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${bodyButterProductRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${BODY_BUTTER_NAME})
    `);

    await db.execute(sql`
      INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${bodyButterPriceRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${BODY_BUTTER_PRICE_ID})
        AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${BODY_BUTTER_PRODUCT_ID})
    `);

    // Keep the body butter's branding/description/image current in both envs.
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            jsonb_set(_raw_data, '{description}', ${JSON.stringify(BODY_BUTTER_DESCRIPTION)}::jsonb, true),
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(BODY_BUTTER_META)}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${BODY_BUTTER_NAME} AND active = true
    `);

    // Force the body butter's active price to $12 (self-heals any drift), the
    // same convergence the tumbler uses. Pricing stays server-authoritative.
    await db.execute(sql`
      UPDATE stripe.prices
      SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(BODY_BUTTER_PRICE_CENTS)}::jsonb, true),
          _updated_at = now()
      WHERE active = true
        AND product IN (SELECT id FROM stripe.products WHERE name = ${BODY_BUTTER_NAME} AND active = true)
        AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(BODY_BUTTER_PRICE_CENTS)}
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

    // 6b) Branded Logo Fitted Hat ($40, color + logo). Same self-applying
    //     pattern as the mug/cases: create only when absent (no-op in dev where
    //     Stripe sync made it; the real creator on the Railway prod snapshot),
    //     then keep the description/metadata current on the surviving product.
    const hatProductRaw = JSON.stringify({
      id: HAT_PRODUCT_ID,
      object: "product",
      active: true,
      name: HAT_NAME,
      description: HAT_DESCRIPTION,
      metadata: HAT_META,
      images: [],
      created,
      livemode: false,
    });

    const hatPriceRaw = JSON.stringify({
      id: HAT_PRICE_ID,
      object: "price",
      active: true,
      currency: "usd",
      unit_amount: HAT_PRICE_CENTS,
      product: HAT_PRODUCT_ID,
      type: "one_time",
      billing_scheme: "per_unit",
      created,
      livemode: false,
    });

    // One-time fixup: the hat used to be a "Fitted Hat" that was hidden and
    // restricted to 3 logos. Convert the existing row in place — rename it to the
    // adjustable name and drop the stale `hidden` + `logoOptions` keys (the
    // additive `||` merge below can't remove keys). Keyed by the OLD name so it
    // applies to the surviving prod-snapshot row and no-ops once renamed.
    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            jsonb_set(
              _raw_data,
              '{metadata}',
              (COALESCE(_raw_data->'metadata', '{}'::jsonb) - 'hidden' - 'logoOptions'),
              true
            ),
            '{name}', to_jsonb(${HAT_NAME}::text), true
          ),
          _updated_at = now()
      WHERE name = ${HAT_OLD_NAME}
    `);

    await db.execute(sql`
      INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${hatProductRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${HAT_NAME})
    `);

    await db.execute(sql`
      INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
      SELECT ${hatPriceRaw}::jsonb, ${accountId}, now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${HAT_PRICE_ID})
        AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${HAT_PRODUCT_ID})
    `);

    await db.execute(sql`
      UPDATE stripe.products
      SET _raw_data = jsonb_set(
            jsonb_set(_raw_data, '{description}', ${JSON.stringify(HAT_DESCRIPTION)}::jsonb, true),
            '{metadata}',
            COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(HAT_META)}::jsonb,
            true
          ),
          _updated_at = now()
      WHERE name = ${HAT_NAME} AND active = true
    `);

    // 6c) Vintage Baltimore collection ($30 graphic tees). Same self-applying
    //     pattern as the mug/cases/hat. For each of the 10 designs: create only
    //     when absent (no-op in dev where Stripe sync made them; the real creator
    //     on the Railway prod snapshot for the 5 brand-new designs), then refresh
    //     description + metadata (new image, sortOrder, productType) on the
    //     surviving active product by name. This is what swaps the 5 carried-over
    //     designs (Cherry Hill, Fort McHenry, B&O, Great Blacks in Wax, Super
    //     Pride) to their new artwork on the prod frozen snapshot.
    for (const v of VINTAGE_PRODUCTS) {
      const vProductRaw = JSON.stringify({
        id: v.productId,
        object: "product",
        active: true,
        name: v.name,
        description: v.description,
        metadata: v.meta,
        images: [],
        created,
        livemode: false,
      });

      const vPriceRaw = JSON.stringify({
        id: v.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: VINTAGE_PRICE_CENTS,
        product: v.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${vProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${v.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${vPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${v.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${v.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(v.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(v.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${v.name} AND active = true
      `);
    }

    // 6c-ii) Women's graphic tees ($30, fixed design, size-only). Same
    //     self-applying pattern as the Vintage collection above: create only when
    //     absent (no-op in dev where Stripe sync made them; the real creator on the
    //     Railway prod frozen snapshot), then refresh description + metadata on the
    //     surviving active product and force the price server-side to $30.
    for (const w of WOMENS_TEE_PRODUCTS) {
      const wProductRaw = JSON.stringify({
        id: w.productId,
        object: "product",
        active: true,
        name: w.name,
        description: w.description,
        metadata: w.meta,
        images: [],
        created,
        livemode: false,
      });

      const wPriceRaw = JSON.stringify({
        id: w.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: WOMENS_TEE_PRICE_CENTS,
        product: w.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${wProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${w.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${wPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${w.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${w.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(w.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(w.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${w.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(WOMENS_TEE_PRICE_CENTS)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${w.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(WOMENS_TEE_PRICE_CENTS)}
      `);
    }

    // 6c-iii) Branded all-over-print apparel ("Forging the Future of Fabric").
    //     Same self-applying create/keep-current pattern, but each item carries
    //     its own price (tee $30, hoodie $60).
    for (const a of BRANDED_APPAREL_PRODUCTS) {
      const aProductRaw = JSON.stringify({
        id: a.productId,
        object: "product",
        active: true,
        name: a.name,
        description: a.description,
        metadata: a.meta,
        images: [],
        created,
        livemode: false,
      });

      const aPriceRaw = JSON.stringify({
        id: a.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: a.priceCents,
        product: a.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${aProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${a.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${aPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${a.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${a.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(a.description)}::jsonb, true),
              '{metadata}',
              (COALESCE(_raw_data->'metadata', '{}'::jsonb) - 'sizes') || ${JSON.stringify(a.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${a.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(a.priceCents)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${a.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(a.priceCents)}
      `);
    }

    // 6c2) Kids graphic tees ($20, fixed design, kids size selector). Same
    //      self-applying pattern as the women's tees above: create only when
    //      absent (no-op in dev where Stripe sync makes them; the real creator
    //      on the Railway prod frozen snapshot), then keep description/metadata
    //      current and the price server-authoritative at $20.
    for (const k of KIDS_TEE_PRODUCTS) {
      const kProductRaw = JSON.stringify({
        id: k.productId,
        object: "product",
        active: true,
        name: k.name,
        description: k.description,
        metadata: k.meta,
        images: [],
        created,
        livemode: false,
      });

      const kPriceRaw = JSON.stringify({
        id: k.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: KIDS_TEE_PRICE_CENTS,
        product: k.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${kProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${k.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${kPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${k.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${k.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(k.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(k.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${k.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(KIDS_TEE_PRICE_CENTS)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${k.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(KIDS_TEE_PRICE_CENTS)}
      `);
    }

    // 6d) Consolidated bedding (Comforter Set $99, Sheet Set $80), each with a
    //     size selector. Same self-applying pattern as the mug/cases/vintage:
    //     create only when absent (no-op in dev where Stripe sync made them; the
    //     real creator on the Railway prod frozen snapshot), then keep the
    //     description/metadata current and the price server-authoritative on the
    //     surviving active product.
    for (const b of BEDDING_PRODUCTS) {
      const bProductRaw = JSON.stringify({
        id: b.productId,
        object: "product",
        active: true,
        name: b.name,
        description: b.description,
        metadata: b.meta,
        images: [],
        created,
        livemode: false,
      });

      const bPriceRaw = JSON.stringify({
        id: b.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: b.priceCents,
        product: b.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${bProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${b.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${bPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${b.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${b.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(b.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(b.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${b.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(b.priceCents)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${b.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(b.priceCents)}
      `);
    }

    // 6a2) Elements — Vitamin Supplements. Same self-applying create/keep-current
    //      pattern as bedding above. Flat price, no logo customization.
    for (const s of ELEMENTS_PRODUCTS) {
      const sProductRaw = JSON.stringify({
        id: s.productId,
        object: "product",
        active: true,
        name: s.name,
        description: s.description,
        metadata: s.meta,
        images: [],
        created,
        livemode: false,
      });

      const sPriceRaw = JSON.stringify({
        id: s.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: s.priceCents,
        product: s.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${sProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${s.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${sPriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${s.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${s.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(s.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(s.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${s.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(s.priceCents)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${s.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(s.priceCents)}
      `);
    }

    // 6b) Extra accessories (e.g. Personalized Drawstring Backpack) — same
    //     self-applying create/keep-current pattern as bedding above. Multi-color
    //     picker via `colors`; full logo catalog by default (no logoOptions).
    for (const e of EXTRA_ACCESSORY_PRODUCTS) {
      const eProductRaw = JSON.stringify({
        id: e.productId,
        object: "product",
        active: true,
        name: e.name,
        description: e.description,
        metadata: e.meta,
        images: [],
        created,
        livemode: false,
      });

      const ePriceRaw = JSON.stringify({
        id: e.priceId,
        object: "price",
        active: true,
        currency: "usd",
        unit_amount: e.priceCents,
        product: e.productId,
        type: "one_time",
        billing_scheme: "per_unit",
        created,
        livemode: false,
      });

      await db.execute(sql`
        INSERT INTO stripe.products (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${eProductRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.products WHERE name = ${e.name})
      `);

      await db.execute(sql`
        INSERT INTO stripe.prices (_raw_data, _account_id, _updated_at, _last_synced_at)
        SELECT ${ePriceRaw}::jsonb, ${accountId}, now(), now()
        WHERE NOT EXISTS (SELECT 1 FROM stripe.prices WHERE id = ${e.priceId})
          AND EXISTS (SELECT 1 FROM stripe.products WHERE id = ${e.productId})
      `);

      await db.execute(sql`
        UPDATE stripe.products
        SET _raw_data = jsonb_set(
              jsonb_set(_raw_data, '{description}', ${JSON.stringify(e.description)}::jsonb, true),
              '{metadata}',
              COALESCE(_raw_data->'metadata', '{}'::jsonb) || ${JSON.stringify(e.meta)}::jsonb,
              true
            ),
            _updated_at = now()
        WHERE name = ${e.name} AND active = true
      `);

      await db.execute(sql`
        UPDATE stripe.prices
        SET _raw_data = jsonb_set(_raw_data, '{unit_amount}', ${String(e.priceCents)}::jsonb, true),
            _updated_at = now()
        WHERE active = true
          AND product IN (SELECT id FROM stripe.products WHERE name = ${e.name} AND active = true)
          AND (_raw_data->>'unit_amount') IS DISTINCT FROM ${String(e.priceCents)}
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

    console.log("ensureCatalogData: ensured tumbler ($30 + logo + image), Coffee Mug ($15, handle colors), phone cases ($30, model + logo), Branded Logo Fitted Hat ($40, color + logo), the 10-design Vintage Baltimore collection ($30 graphic tees), and consolidated bedding (Comforter Set $99 + Sheet Set $80, size selector); removed retired products (Kids Sippy Cup + baby line + old vintage placeholders); archived leftover prices on inactive products.");
  } catch (err) {
    console.error("ensureCatalogData failed:", err);
  }
}
