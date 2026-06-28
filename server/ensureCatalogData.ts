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
    priceCents: 7500,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14a", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_grey.jpg" },
  },
  {
    productId: "prod_kksneakersand",
    priceId: "price_kksneakersand",
    name: "Khomplete Khemistri Sneakers \u2014 Sand/Gold",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a warm sand/tan colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in gold. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7500,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14b", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_sand.jpg" },
  },
  {
    productId: "prod_kksneakerblack",
    priceId: "price_kksneakerblack",
    name: "Khomplete Khemistri Sneakers \u2014 Black/Red",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a black colorway with red accents and a lace-anchored Khomplete Khemistri Apparel crest badge in red. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7500,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14c", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_black.jpg" },
  },
  {
    productId: "prod_kksneakerwhite",
    priceId: "price_kksneakerwhite",
    name: "Khomplete Khemistri Sneakers \u2014 White/Silver",
    description:
      "Premium Khomplete Khemistri athletic sneakers in a clean white colorway with a lace-anchored Khomplete Khemistri Apparel crest badge in polished silver. Breathable mesh upper, cushioned air sole, and a clean unisex fit. Unisex US sizing \u2014 select your size at checkout (women: size up about 1.5 from your US women's size).",
    priceCents: 7500,
    meta: { category: "Footwear", productType: "apparel", sortOrder: "14d", gender: "Unisex", sizes: "US 5, US 6, US 7, US 8, US 9, US 10, US 11, US 12, US 13", imageUrl: "/assets/kk_sneaker_white.jpg" },
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
const HAT_NAME = "Branded Logo Fitted Hat";
const HAT_PRICE_CENTS = 4000;
const HAT_IMAGE = "/assets/generated_images/fitted_hat_branded.png";
const HAT_DESCRIPTION =
  "Premium structured fitted baseball cap with embroidered Khomplete Khemistri branding on the front. 100% acrylic, hand-wash only. SELECT YOUR COLOR AND LOGO at checkout — choose the Apparel Logo, Accessories Eagle Badge, or 5 Swords Crest.";
const HAT_META = {
  category: "Headwear",
  productType: "apparel",
  sortOrder: "13",
  imageUrl: HAT_IMAGE,
  gender: "Unisex",
  fulfillment: "Amazon",
  amazonLink: "https://a.co/d/0iMR1uMI",
  cost: "24.99",
  colors: "Black, Navy, Gray, Khaki, Red",
  logoOptions: STANDARD_LOGO_OPTIONS,
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
