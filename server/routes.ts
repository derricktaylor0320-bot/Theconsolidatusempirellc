import type { Express } from "express";
import { createServer, type Server } from "http";
import { stripeStorage } from "./stripeStorage";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { createSquarePaymentLink } from "./squareClient";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";

// Stripe contains some products that were created more than once (same name,
// different ids). Collapse them so each product name appears only once on the
// site. Key matching is normalized (case/whitespace-insensitive). When a name
// collides, deterministically keep the best copy: one with a price first, then
// lowest sortOrder, then lowest price, then lowest id (stable tie-break).
function dedupeByName<T extends {
  title: string;
  priceId?: string | null;
  sortOrder?: number;
  price?: string | null;
  id?: string;
}>(items: T[]): T[] {
  const better = (a: T, b: T): boolean => {
    const ap = a.priceId ? 0 : 1, bp = b.priceId ? 0 : 1;
    if (ap !== bp) return ap < bp;
    const as = typeof a.sortOrder === 'number' ? a.sortOrder : 99;
    const bs = typeof b.sortOrder === 'number' ? b.sortOrder : 99;
    if (as !== bs) return as < bs;
    const apr = a.price != null ? parseFloat(a.price) : Infinity;
    const bpr = b.price != null ? parseFloat(b.price) : Infinity;
    if (apr !== bpr) return apr < bpr;
    return (a.id ?? '') < (b.id ?? '');
  };
  const byName = new Map<string, T>();
  for (const item of items) {
    const key = item.title.trim().toLowerCase();
    const existing = byName.get(key);
    if (!existing || better(item, existing)) {
      byName.set(key, item);
    }
  }
  return Array.from(byName.values());
}

// All products to seed in Stripe (for both test and live modes)
const ALL_PRODUCTS = [
  // APPAREL
  {
    name: 'Short Sleeve T-Shirt',
    description: 'Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 3000,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '1', imageUrl: '/assets/generated_images/t-shirt_khomplete_khemistri_text.png' }
  },
  {
    name: 'Long Sleeve T-Shirt',
    description: 'Standard weight cotton/blend tee. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 3500,
    metadata: { category: 'T-Shirts', productType: 'apparel', sortOrder: '2', imageUrl: '/assets/generated_images/long_sleeve_khomplete_khemistri.png' }
  },
  {
    name: 'Pullover Hoodie',
    description: 'Mid to Heavyweight cotton/fleece hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 5000,
    metadata: { category: 'Hoodies', productType: 'apparel', sortOrder: '3', fulfillment: 'Amazon', cost: '41.99', imageUrl: '/assets/generated_images/hoodie_khomplete_khemistri_text.png' }
  },
  {
    name: 'Full-Zip Hoodie',
    description: 'Mid to Heavyweight cotton/fleece full-zip hooded sweatshirt. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 6000,
    metadata: { category: 'Hoodies', productType: 'apparel', sortOrder: '4', fulfillment: 'Amazon', cost: '41.99', imageUrl: '/assets/generated_images/full-zip_hoodie_branded.png' }
  },
  {
    name: 'Jacket/Coat',
    description: 'Lightweight jacket (e.g., Windbreaker, Coach Jacket) or Fleece Jacket. All garments feature the Left Chest Logo and the large Khomplete Khemistri Back Logo.',
    price: 7500,
    metadata: { category: 'Outerwear', productType: 'apparel', sortOrder: '5', fulfillment: 'Amazon', imageUrl: '/assets/generated_images/jacket_khomplete_khemistri_back.png' }
  },
  {
    name: 'Khomplete Khemistri Windbreaker Jacket',
    description: 'Custom waterproof windbreaker jacket with Khomplete Khemistri branding. Available for Men & Women. Polyester fabric with good breathability, hood with drawstring, two zip up side pockets. Available in 5 colors: Navy, Khaki, Gray, Green, and Black. Perfect for any occasion.',
    price: 6000,
    metadata: { category: 'Apparel', productType: 'apparel', sortOrder: '6', sku: 'KK-JACKET-001', amazonLink: 'https://a.co/d/9Xuj17C', cost: '37.98', imageUrl: '/assets/jacket_front.jpg', fulfillment: 'Amazon', colors: 'Navy, Khaki, Gray, Green, Black', gender: 'Unisex' }
  },
  {
    name: 'Khemistri Branded Jeans',
    description: 'Premium ripped black jeans featuring the Khomplete Khemistri Apparel logo on back pocket. Customize with any logo from our collection. Distressed style with premium fit.',
    price: 6500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '7', imageUrl: '/assets/1764769995894_1764820127590.jpg' }
  },
  {
    name: 'Personalized Custom Logo Sweatpants',
    description: 'Custom sweatpants for Men and Women personalized with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Premium 100% polyester, soft and comfortable with drawstring waist. SELECT YOUR COLOR AND LOGO at checkout! Available in 23 colors: Black, White, Navy, Gray, Brown, Gold, Blue, Green, Pink, Purple, Red, Orange, Yellow, Olive, Coral, Cyan, Tan, and more. Sizes: S to 5XL.',
    price: 4500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '8', imageUrl: '/attached_assets/copilot_image_1765114167490_1765212687857.jpeg', gender: 'Unisex', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/byG0BnU', cost: '9.99', colors: 'Black, White, Navy, Gray, Brown, Gold, Blue, Green, Pink, Purple, Red, Orange, Yellow, Olive, Coral, Cyan, Tan', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest' }
  },
  {
    name: 'Embroidered Designer Jeans',
    description: 'Luxury embroidered jeans with gold Khomplete Khemistri crest design. Available in Navy Blue and Black. Premium quality with ornate embroidery detail.',
    price: 8500,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '9', imageUrl: '/assets/1764766300817_1764820163450.jpg' }
  },
  {
    name: 'Khemistri Sweatshirt Set',
    description: 'Premium matching sweatshirt and pants set featuring the Khomplete Khemistri 5 Swords logo. Front chest and large back logo. Available in Black with gold/blue accents.',
    price: 9500,
    metadata: { category: 'Sets', productType: 'apparel', sortOrder: '10', imageUrl: '/assets/1764769222300_1764820190430.jpg' }
  },
  {
    name: 'Chemistry Socks',
    description: 'Premium branded socks featuring chemistry beakers and the Khomplete Khemistri Apparel logo. Available in Black/Gold and White/Black.',
    price: 1800,
    metadata: { category: 'Socks', productType: 'apparel', sortOrder: '11', imageUrl: '/assets/1764583920002_1764810614373.jpg' }
  },
  {
    name: 'Personalized Custom Logo Clogs',
    description: 'Luxury personalized clogs with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Premium EVA material, lightweight and comfortable with honeycomb air holes for breathability. Ergonomic design with adjustable heel strap. SELECT YOUR COLOR AND LOGO at checkout! Available colors: Brown, Black, White, Navy, Gray, Pink, Red, and more. Sizes: 4W/2M to 14W/12M.',
    price: 5000,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '12', imageUrl: '/attached_assets/custom_clogs_accessories_logo.jpg', gender: 'Unisex', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/2Ih6Mhh', cost: '28.99', colors: 'Brown, Black, White, Navy, Gray, Pink, Red', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest' }
  },
  // FEMININE COLLECTION
  {
    name: 'Branded Crop Top',
    description: 'Trendy cropped t-shirt with Khomplete Khemistri Apparel logo on front chest. Short modern streetwear fit. Perfect for workouts or casual style.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '15', imageUrl: '/assets/generated_images/black_crop_top_with_logo.png', gender: 'Women' }
  },
  {
    name: 'Personalized Women\'s Crop Top',
    description: 'Custom crew neck short sleeve crop top personalized with Khomplete Khemistri Apparel logo. Soft ribbed fabric (95% Polyester, 5% Spandex), stretchy and breathable. Perfect for workouts, yoga, or casual wear. Available in 27 colors: Apricot, Beige, Black, Brown, Burgundy, Chocolate, Coffee, Coral Red, Dark Green, Gray, Green, Klein Blue, Light Blue, Magenta, Navy Blue, Olive Green, Orange, Pink, Purple, Red, Silver Grey, Turquoise, Violet, White, Wine Red, Yellow, and Iced Plum. Sizes: S, M, L, XL, 2XL, 3XL.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '15b', imageUrl: '/assets/generated_images/women\'s_branded_crop_top.png', gender: 'Women', fulfillment: 'Amazon', amazonLink: 'https://a.co/d/1TzA4VZ', cost: '9.99', colors: 'Apricot, Beige, Black, Brown, Burgundy, Chocolate, Coffee, Coral Red, Dark Green, Gray, Green, Klein Blue, Light Blue, Magenta, Navy Blue, Olive Green, Orange, Pink, Purple, Red, Silver Grey, Turquoise, Violet, White, Wine Red, Yellow, Iced Plum' }
  },
  {
    name: 'Fitted Tank Top',
    description: 'Slim fit racerback tank top with Khomplete Khemistri Apparel logo. Athletic style, perfect for fitness or layering. Available in White with black/gold logo.',
    price: 2500,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '16', imageUrl: '/assets/generated_images/white_fitted_tank_top.png', gender: 'Women' }
  },
  {
    name: "Women's Fitted V-Neck Tee",
    description: 'Soft fitted v-neck t-shirt with Khomplete Khemistri Apparel logo on front chest. Slim feminine cut. Available in Pink with gold logo.',
    price: 2800,
    metadata: { category: 'Tops', productType: 'apparel', sortOrder: '17', imageUrl: "/assets/generated_images/pink_women's_fitted_tee.png", gender: 'Women' }
  },
  {
    name: 'Khemistri Leggings',
    description: 'High-waisted yoga leggings with Khomplete Khemistri Apparel logo on hip. Sleek black fabric with gold logo accent. Perfect for workouts or athleisure style.',
    price: 4000,
    metadata: { category: 'Bottoms', productType: 'apparel', sortOrder: '18', imageUrl: '/assets/generated_images/black_branded_leggings.png', gender: 'Women' }
  },
  // SLEEPWEAR & LOUNGEWEAR
  {
    name: "Personalized Custom Logo Slippers",
    description: "Cozy plush bedroom slippers with your choice of Khomplete Khemistri logo (Apparel, Accessories Eagle Badge, or 5 Swords Crest). Soft fuzzy faux fur lining for warmth and comfort. SELECT YOUR COLOR AND LOGO at checkout! Available colors: Black, Gray, White, and more. Unisex sizes for Men and Women.",
    price: 2500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '25', imageUrl: '/attached_assets/custom_slippers_logo.jpg', gender: 'Unisex', fulfillment: 'Amazon', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest', colors: 'Black, Gray, White' }
  },
  {
    name: "Women's Satin Pajama Set",
    description: "Luxurious satin pajama set with Khomplete Khemistri Apparel logo on chest pocket. Button-up top with matching pants. Choose your favorite logo design. Available in Black with gold logo. Sizes: S, M, L, XL.",
    price: 4500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '26', imageUrl: "/assets/generated_images/women's_black_satin_pajamas.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Cotton Pajama Set",
    description: "Premium cotton pajama set with Khomplete Khemistri Apparel logo on chest. Button-up top with matching pants. Choose your favorite logo design. Available in Black with gold logo. Sizes: M, L, XL, 2XL.",
    price: 4500,
    metadata: { category: 'Sleepwear', productType: 'apparel', sortOrder: '28', imageUrl: "/assets/generated_images/men's_black_cotton_pajamas.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  // INTIMATES
  {
    name: "Men's Logo Boxer Briefs",
    description: "Premium personalized boxer briefs with Khomplete Khemistri Apparel logo on waistband. Black cotton blend with gold logo on elastic band. Comfortable everyday wear. Sizes: S, M, L, XL, 2XL.",
    price: 2200,
    metadata: { category: 'Intimates', productType: 'apparel', sortOrder: '38', imageUrl: "/assets/generated_images/men's_black_logo_boxers.png", gender: 'Men', fulfillment: 'Amazon/Etsy' }
  },
  {
    name: "Women's Logo Panties",
    description: "Personalized bikini panties with Khomplete Khemistri Apparel logo. Black with lace trim and gold shield crest design. Comfortable and stylish. Sizes: XS, S, M, L, XL.",
    price: 1800,
    metadata: { category: 'Intimates', productType: 'apparel', sortOrder: '39', imageUrl: "/assets/generated_images/women's_black_logo_panties.png", gender: 'Women', fulfillment: 'Amazon/Etsy' }
  },
  // WINTER ACCESSORIES - MEN'S
  {
    name: "Men's Logo Beanie",
    description: "Black ribbed knit beanie with leather patch featuring Khomplete Khemistri Apparel logo. Gold embroidered shield crest on premium leather patch. Warm cuffed design. One size fits most.",
    price: 1200,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '29', imageUrl: "/assets/generated_images/men's_beanie_with_logo_patch.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Logo Scarf",
    description: "Black knit winter scarf with Khomplete Khemistri Apparel logo embroidered on end. Gold shield crest design. Warm acrylic material. Perfect for cold weather.",
    price: 1800,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '30', imageUrl: "/assets/generated_images/men's_black_logo_scarf.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Logo Gloves",
    description: "Black touchscreen compatible winter gloves with Khomplete Khemistri Apparel logo on back of hand. Gold embroidered shield design. Warm knit material. Sizes: M, L, XL.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '31', imageUrl: "/assets/generated_images/men's_black_logo_gloves.png", gender: 'Men', fulfillment: 'Amazon' }
  },
  {
    name: "Men's Winter Bundle",
    description: "Complete men's winter set with matching beanie, scarf, and gloves featuring the K.K.A (Khomplete Khemistri Apparel) logo with gold embroidery. Available in Gray, Red, and Beige. Perfect gift set.",
    price: 6000,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '32', imageUrl: "/attached_assets/Screenshot_20251214_071010_Etsy_1765714465398.jpg", gender: 'Men', fulfillment: 'Etsy', bundle: 'true' }
  },
  // WINTER ACCESSORIES - WOMEN'S
  {
    name: "Women's Logo Beanie",
    description: "Pink ribbed knit beanie with Khomplete Khemistri Apparel logo embroidered on front. Gold shield crest design. Soft cuffed style. One size fits most.",
    price: 1200,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '33', imageUrl: "/assets/generated_images/women's_pink_logo_beanie.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Earmuffs",
    description: "Pink fuzzy earmuffs with Khomplete Khemistri Apparel logo on side. Plush faux fur ear warmers with gold embroidered shield design. Adjustable headband. One size fits most.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '34', imageUrl: "/assets/generated_images/women's_pink_logo_earmuffs.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Scarf",
    description: "Pink knit winter scarf with Khomplete Khemistri Apparel logo embroidered on end. Gold shield crest design. Soft and warm. Perfect for cold weather.",
    price: 1800,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '35', imageUrl: "/assets/generated_images/women's_pink_logo_scarf.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Logo Gloves",
    description: "Pink touchscreen compatible winter gloves with Khomplete Khemistri Apparel logo on back of hand. Gold embroidered shield design. Soft knit material. Sizes: S, M, L.",
    price: 1500,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '36', imageUrl: "/assets/generated_images/women's_pink_logo_gloves.png", gender: 'Women', fulfillment: 'Amazon' }
  },
  {
    name: "Women's Winter Bundle",
    description: "Complete women's winter set with matching beanie, scarf, and gloves featuring the K.K.A (Khomplete Khemistri Apparel) logo with gold embroidery. Available in Gray, Red, and Beige. Perfect gift set.",
    price: 6000,
    metadata: { category: 'Winter', productType: 'accessory', sortOrder: '37', imageUrl: "/attached_assets/Screenshot_20251214_071010_Etsy_1765714465398.jpg", gender: 'Women', fulfillment: 'Etsy', bundle: 'true' }
  },
  // BABY & KIDS COLLECTION
  {
    name: 'Baby Onesie',
    description: 'Adorable baby bodysuit with Khomplete Khemistri Apparel logo on front chest. White cotton with black and gold shield crest. Snap closure for easy changing. Sizes: 0-3M, 3-6M, 6-12M.',
    price: 2000,
    metadata: { category: 'Baby', productType: 'apparel', sortOrder: '19', imageUrl: '/assets/generated_images/white_baby_onesie_branded.png', gender: 'Kids' }
  },
  {
    name: 'Baby Bib',
    description: 'Branded baby bib with Khomplete Khemistri Apparel logo. Black fabric with gold shield design. Velcro closure for easy on/off. Keep your little one stylish during mealtime.',
    price: 1200,
    metadata: { category: 'Baby', productType: 'apparel', sortOrder: '20', imageUrl: '/assets/generated_images/black_branded_baby_bib.png', gender: 'Kids' }
  },
  {
    name: 'Toddler T-Shirt',
    description: 'Kids t-shirt with Khomplete Khemistri Apparel logo on front. Black cotton with gold shield crest logo. Perfect for your little one to match the family. Sizes: 2T, 3T, 4T.',
    price: 2000,
    metadata: { category: 'Kids', productType: 'apparel', sortOrder: '21', imageUrl: '/assets/generated_images/black_toddler_t-shirt_branded.png', gender: 'Kids' }
  },
  {
    name: 'Baby Romper',
    description: 'Comfortable baby romper one-piece with Khomplete Khemistri Apparel logo on chest. Gray heather cotton with snap buttons. Perfect for everyday wear. Sizes: 0-3M, 3-6M, 6-12M, 12-18M.',
    price: 2200,
    metadata: { category: 'Baby', productType: 'apparel', sortOrder: '22', imageUrl: '/assets/generated_images/gray_baby_romper_branded.png', gender: 'Kids' }
  },
  {
    name: 'Baby Beanie',
    description: 'Soft knit baby beanie with Khomplete Khemistri Apparel logo patch. Black cotton stretch material. Keep your little one warm and stylish. One size fits 0-12 months.',
    price: 1000,
    metadata: { category: 'Baby', productType: 'apparel', sortOrder: '23', imageUrl: '/assets/generated_images/black_baby_beanie_hat.png', gender: 'Kids' }
  },
  {
    name: 'Kids Sippy Cup',
    description: 'Insulated stainless steel sippy cup with Khomplete Khemistri Apparel logo. Black with gold shield crest design. Spill-proof lid with handles for little hands. 12oz capacity, BPA-free.',
    price: 500,
    metadata: { category: 'Baby', productType: 'accessory', sortOrder: '24', imageUrl: '/assets/generated_images/branded_baby_sippy_cup.png', gender: 'Kids' }
  },
  // FOOTWEAR COLLECTION
  {
    name: 'Classic White High-Tops',
    description: 'Premium white canvas high-top sneakers featuring the Khomplete Khemistri Apparel circular logo. "Established in 2020" printed on sole. Clean white design with black logo accent.',
    price: 7500,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '12', imageUrl: '/assets/1764780937475_1764822351469.jpg' }
  },
  {
    name: 'Black & Gold High-Tops',
    description: 'Premium black canvas high-top sneakers featuring the Khomplete Khemistri 5 Swords crest in blue and gold. "Established in 2020" on sole. Luxury streetwear design.',
    price: 7500,
    metadata: { category: 'Footwear', productType: 'apparel', sortOrder: '13', imageUrl: '/assets/1764676690790_1764822373703.jpg' }
  },
  // ACCESSORIES
  {
    name: '40 Oz Branded Tumbler',
    description: 'Premium 40 oz insulated tumbler with your choice of Khomplete Khemistri logo. Available in 6 colors: Bayleaf, Black, Eucalyptus, Light Pink, Lilac, and Rose Quartz.',
    price: 2500,
    metadata: { category: 'Drinkware', productType: 'accessory', colors: 'Bayleaf, Black, Eucalyptus, Light Pink, Lilac, Rose Quartz', imageUrl: '/assets/Screenshot_20251202_194149_Amazon_Shopping_1764813802811.jpg' }
  },
  {
    name: 'Executive Umbrella',
    description: 'Premium branded umbrella featuring the Khomplete Khemistri eagle design',
    price: 4500,
    metadata: { category: 'Lifestyle', productType: 'accessory', imageUrl: '/assets/1764674028102_1764809055176.jpg' }
  },
  {
    name: 'Signature Scent Candle',
    description: 'Premium scented candle with Khomplete Khemistri Accessories branding',
    price: 1500,
    metadata: { category: 'Home', productType: 'accessory', imageUrl: '/assets/1764815519810_1764815959048.jpg' }
  },
  {
    name: 'Branded Tote Bag',
    description: 'Spacious canvas tote bag with Khomplete Khemistri Apparel logo. Natural cream canvas with black and gold logo. Perfect for shopping, gym, or everyday use.',
    price: 2200,
    metadata: { category: 'Bags', productType: 'accessory', imageUrl: '/attached_assets/copilot_image_1765114167490_1765212687857.jpeg', gender: 'Unisex' }
  },
  {
    name: 'Cosmetic Bag',
    description: 'Stylish makeup pouch with Khomplete Khemistri Accessories logo. Black faux leather with gold zipper. Perfect travel size for cosmetics and toiletries.',
    price: 1800,
    metadata: { category: 'Bags', productType: 'accessory', imageUrl: '/assets/generated_images/black_branded_cosmetic_bag.png', gender: 'Women' }
  },
  {
    name: 'Logo Keychain',
    description: 'Gold metal keychain with Khomplete Khemistri shield and swords crest charm. Black and gold enamel design. A stylish accessory for your keys.',
    price: 1200,
    metadata: { category: 'Accessories', productType: 'accessory', imageUrl: '/assets/generated_images/gold_logo_keychain.png', gender: 'Unisex' }
  },
  {
    name: 'Custom Logo Watch',
    description: 'Luxury unisex wristwatch with your choice of Khomplete Khemistri logo from our extensive catalog (Apparel Logo, Accessories Eagle Badge, 5 Swords Crest, and more). Premium metal case and band. SELECT YOUR COLOR AND LOGO at checkout! Available in Gold, Black, and Silver. A stunning statement piece for any occasion.',
    price: 5000,
    metadata: { category: 'Accessories', productType: 'accessory', imageUrl: '/attached_assets/kka_gold_watch.jpg', gender: 'Unisex', colors: 'Gold, Black, Silver', logoOptions: 'Apparel Logo, Accessories Eagle Badge, 5 Swords Crest, and more from catalog' }
  },
  {
    name: 'Branded Scrunchies',
    description: 'Fabric scrunchie hair tie with Khomplete Khemistri logo pattern. Black satin with gold printed logos. Fashion hair accessory set.',
    price: 1000,
    metadata: { category: 'Accessories', productType: 'accessory', imageUrl: '/attached_assets/copilot_image_1765114167490_1765212687857.jpeg', gender: 'Women' }
  },
  // BED LINENS - SHEET SETS
  {
    name: 'Khomplete Khemistri Accessories Bed Sheet Set - Twin',
    description: 'TWIN SIZE - Premium cotton bed sheet set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered on pillowcase. Elegant burgundy brown sheets. Includes fitted sheet, flat sheet, and 1 pillowcase.',
    price: 6000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '50', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Twin' }
  },
  {
    name: 'Khomplete Khemistri Accessories Bed Sheet Set - Full',
    description: 'FULL SIZE - Premium cotton bed sheet set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered on pillowcases. Elegant burgundy brown sheets. Includes fitted sheet, flat sheet, and 2 pillowcases.',
    price: 7000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '51', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Full' }
  },
  {
    name: 'Khomplete Khemistri Accessories Bed Sheet Set - Queen',
    description: 'QUEEN SIZE - Premium cotton bed sheet set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered on pillowcases. Elegant burgundy brown sheets. Includes fitted sheet, flat sheet, and 2 pillowcases.',
    price: 8000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '52', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Queen' }
  },
  {
    name: 'Khomplete Khemistri Accessories Bed Sheet Set - King',
    description: 'KING SIZE - Premium cotton bed sheet set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered on pillowcases. Elegant burgundy brown sheets. Includes fitted sheet, flat sheet, and 2 pillowcases.',
    price: 9000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '53', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'King' }
  },
  {
    name: 'Khomplete Khemistri Accessories Bed Sheet Set - California King',
    description: 'CALIFORNIA KING SIZE - Premium cotton bed sheet set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered on pillowcases. Elegant burgundy brown sheets. Includes fitted sheet, flat sheet, and 2 pillowcases.',
    price: 9900,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '54', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'California King' }
  },
  // BED LINENS - FLEECE BLANKETS
  {
    name: 'Khomplete Khemistri Accessories Fleece Blanket - Twin',
    description: 'TWIN SIZE (60" x 80") - Plush fleece throw blanket featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered in center. Deep burgundy brown. Soft and cozy. Perfect for bed or couch.',
    price: 6000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '55', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Twin' }
  },
  {
    name: 'Khomplete Khemistri Accessories Fleece Blanket - Full/Queen',
    description: 'FULL/QUEEN SIZE (80" x 90") - Plush fleece throw blanket featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered in center. Deep burgundy brown. Soft and cozy. Perfect for bed or couch.',
    price: 7000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '56', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Full/Queen' }
  },
  {
    name: 'Khomplete Khemistri Accessories Fleece Blanket - King',
    description: 'KING SIZE (90" x 100") - Plush fleece throw blanket featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered in center. Deep burgundy brown. Soft and cozy. Perfect for bed or couch.',
    price: 8000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '57', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'King' }
  },
  // BED LINENS - DUVET/COMFORTER SETS
  {
    name: 'Khomplete Khemistri Accessories Duvet Set - Twin',
    description: 'TWIN SIZE - Elegant duvet comforter set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered at foot. Rich burgundy brown. Includes duvet cover and 1 pillowsham. Insert not included.',
    price: 6000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '58', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Twin' }
  },
  {
    name: 'Khomplete Khemistri Accessories Duvet Set - Full',
    description: 'FULL SIZE - Elegant duvet comforter set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered at foot. Rich burgundy brown. Includes duvet cover and 2 pillowshams. Insert not included.',
    price: 7000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '59', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Full' }
  },
  {
    name: 'Khomplete Khemistri Accessories Duvet Set - Queen',
    description: 'QUEEN SIZE - Elegant duvet comforter set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered at foot. Rich burgundy brown. Includes duvet cover and 2 pillowshams. Insert not included.',
    price: 8000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '60', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'Queen' }
  },
  {
    name: 'Khomplete Khemistri Accessories Duvet Set - King',
    description: 'KING SIZE - Elegant duvet comforter set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered at foot. Rich burgundy brown. Includes duvet cover and 2 pillowshams. Insert not included.',
    price: 9000,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '61', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'King' }
  },
  {
    name: 'Khomplete Khemistri Accessories Duvet Set - California King',
    description: 'CALIFORNIA KING SIZE - Elegant duvet comforter set featuring the Khomplete Khemistri Accessories eagle badge with full brand name embroidered at foot. Rich burgundy brown. Includes duvet cover and 2 pillowshams. Insert not included.',
    price: 9900,
    metadata: { category: 'Bedding', productType: 'accessory', sortOrder: '62', imageUrl: '/attached_assets/kk_accessories_bedding_logo.jpg', fulfillment: 'Amazon', size: 'California King' }
  },
  // VINTAGE BALTIMORE
  {
    name: 'Memorial Stadium Tribute Tee',
    description: 'The Old Gray Lady of 33rd Street. Home to Baltimore Colts 1953-1983, Baltimore Orioles 1954-1991. Demolished 2001-2002. Never Forgotten. Time Will Not Dim The Glory Of Their Deeds.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/assets/1764718803250_1764814033310.jpg' }
  },
  {
    name: 'Yellow Bowl Restaurant Tee',
    description: 'Baltimore\'s Yellow Bowl - A Legacy of Soul Food. Celebrating the iconic Greenmount Avenue restaurant that served the community for generations. Available in Black and Yellow.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/assets/1764718158966_1764814033324.jpg' }
  },
  {
    name: 'Cherry Hill Tribute Tee',
    description: 'Baltimore Cherry Hill - Celebrating the history and pride of this iconic Baltimore neighborhood. Wear your community pride.',
    price: 3000,
    metadata: { category: 'Baltimore Pride', productType: 'vintage', imageUrl: '/assets/image_1764716203628_1764814033395.jpeg' }
  },
  {
    name: 'B&O Railroad Tribute Tee',
    description: 'Baltimore & Ohio Railroad - America\'s First. Est. 1830. The Nation\'s First Common Carrier. Connecting 13 Great States. Symbol of American Innovation. Available in multiple colors.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/assets/1764714412543_1764814033463.jpg' }
  },
  {
    name: 'Baltimore Trailways / Greyhound Station Tee',
    description: 'Baltimore Trailways / Greyhound Station - West Fayette Street. This bus station served as a vital transportation hub for decades. A landmark for travelers, connecting Baltimoreans to cities across the country. Though the station is now gone, its memory remains a significant part of Baltimore\'s transit heritage.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765197832200_1765197897952.jpg' }
  },
  {
    name: "Shane's Sandwich Shop Tee",
    description: "Shane's Sandwich Shop - Baltimore, MD. A Baltimore Landmark. Founder Harley Brinsfield started Harley's Market around 1640, serving subs and secret sauce burgers. Radio Fame hosted jazz shows and made it a neighborhood cure. Both Harley's chains eventually closing, but Shane's chains' legacy lives on as Baltimore's food history.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765197579253_1765197897977.jpg' }
  },
    {
    name: 'Memorial Stadium Navy Tee',
    description: "Memorial Stadium - East 33rd Street. Baltimore's beloved stadium, home to the Colts and Orioles. A Place In Our Hearts. A Place In History. Navy blue edition.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/copilot_image_1765193892692_1765197897994.jpeg' }
  },
  {
    name: 'National Great Blacks in Wax Museum Tee',
    description: 'The National Great Blacks in Wax Museum - Baltimore, Maryland. A Vision Preserved: The History. The museum was founded in 1983 by educators Dr. Joanne Martin and Dr. Elmer Martin. The museum\'s mission is to stimulate an interest in Black history and use great decor as youth.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765195062381_1765197898004.jpg' }
  },
  {
    name: 'Shot Tower Marketplace Tee',
    description: 'Shot Tower Marketplace - Baltimore. Pray For Me. History of the Baltimore Shot Tower: Built 1828, designed by Caspar Wever. At 234 feet tall, was the tallest structure in the United States until 1846. Operated until 1892. A City Landmark and Museum.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170112320_1765198682968.jpg' }
  },
  {
    name: 'Fort McHenry Tee',
    description: 'Fort McHenry - Baltimore. Pray For Me. Defended Baltimore during War of 1812. Inspired Francis Scott Key\'s "The Star Spangled Banner." The fortress sustained 25 hours of bombardment. U.S. National Monument and Historic Shrine. A City Landmark and Museum.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170277431_1765198682982.jpg' }
  },
  {
    name: 'Washington Monument Baltimore Tee',
    description: 'Washington Monument - Baltimore. Pray For Me. Dedicated July 4, 1815. 178 feet tall. The first major monument to George Washington. An architectural landmark. Baltimore\'s iconic column in Mount Vernon Place.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170340921_1765198682990.jpg' }
  },
  {
    name: 'Chicken George Gold Tee',
    description: 'Chicken George - Famous Fried Chicken - Baltimore Since 1970s. Known for its famous fried chicken. A beloved Baltimore eatery. Multiple locations across the city including Harford Rd, Edmonson Ave, Park Heights Ave.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170414148_1765198682998.jpg' }
  },
  {
    name: 'Super Pride Markets Tee',
    description: 'Super Pride Markets - Baltimore Since 1970s. A beloved Baltimore grocery chain. Known for community involvement. Original locations: Wark Heights, Eastern Ave, North Ave.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170623315_1765198683006.jpg' }
  },
  {
    name: 'Stop, Shop & Save Tee',
    description: 'Stop, Shop & Save - Baltimore Since 1940s. A popular Baltimore grocery chain known for fresh produce & meats. Original locations: West Baltimore Blvd, York Rd, Northwood.',
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170666925_1765198683015.jpg' }
  },
  {
    name: "McCrory's Tee",
    description: "McCrory's - Baltimore Since 1882. A beloved Baltimore 5-&10 store known for its lunch counter. Multiple locations across the city: North Howard St, Lexington St, Eastern Ave.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170774205_1765198683024.jpg' }
  },
  {
    name: "J.J. Newberry's Tee",
    description: "J.J. Newberry's - Baltimore Since 1900s. A beloved American 5-&10 store known for its lunch counter & diverse goods. Multiple locations across the city: North Howard St, Lexington St, Eastern Ave.",
    price: 3000,
    metadata: { category: 'Legacy Spots', productType: 'vintage', imageUrl: '/attached_assets/1765170828481_1765198683036.jpg' }
  },
  // POETRY ON A PLAQUE
  {
    name: 'Four Seasons of Poetic Verses - Wooden Plaque',
    description: 'A poem for every month of the year, covering all four seasons. Beautifully displayed on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'seasons', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Four Seasons of Poetic Verses - Glass Frame',
    description: 'A poem for every month of the year, covering all four seasons. Elegantly presented in a silver glass frame.',
    price: 3000,
    metadata: { category: 'seasons', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Mental Health - Wooden Plaque',
    description: 'Poetry addressing mental wellness, self-care, and healing journeys. Displayed on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'mental-health', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Mental Health - Glass Frame',
    description: 'Poetry addressing mental wellness, self-care, and healing journeys. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'mental-health', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Enchanted Love - Wooden Plaque',
    description: 'Romantic poetry that captures the essence of love and devotion. Mounted on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'love', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Enchanted Love - Glass Frame',
    description: 'Romantic poetry that captures the essence of love and devotion. Beautifully displayed in a silver glass frame.',
    price: 3000,
    metadata: { category: 'love', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Inspired Motivations - Wooden Plaque',
    description: 'Uplifting and encouraging poetry to inspire your daily journey. Presented on a premium wooden plaque.',
    price: 4000,
    metadata: { category: 'inspiration', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Inspired Motivations - Glass Frame',
    description: 'Uplifting and encouraging poetry to inspire your daily journey. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'inspiration', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'The Landscapes of Lost - Wooden Plaque',
    description: 'Heartfelt poetry for those dealing with grief and loss. A comforting tribute on premium wood.',
    price: 4000,
    metadata: { category: 'grief', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'The Landscapes of Lost - Glass Frame',
    description: 'Heartfelt poetry for those dealing with grief and loss. A comforting tribute in elegant glass.',
    price: 3000,
    metadata: { category: 'grief', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
  {
    name: 'Where Spirit Meets Verse - Wooden Plaque',
    description: 'Spiritual poetry exploring faith, hope, and divine connection. Displayed on premium wood.',
    price: 4000,
    metadata: { category: 'spiritual', productType: 'poetry', format: 'plaque', imageUrl: '/attached_assets/poetry_plaques_showcase.jpg' }
  },
  {
    name: 'Where Spirit Meets Verse - Glass Frame',
    description: 'Spiritual poetry exploring faith, hope, and divine connection. Elegantly framed in silver glass.',
    price: 3000,
    metadata: { category: 'spiritual', productType: 'poetry', format: 'glass', imageUrl: '/attached_assets/glass_frame_showcase.jpg' }
  },
];

// Helper function to seed all products in Stripe
async function seedProducts() {
  try {
    const stripe = await getUncachableStripeClient();
    
    // Fetch ALL existing products with pagination
    const allExistingProducts: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    
    while (hasMore) {
      const params: any = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      
      const response = await stripe.products.list(params);
      allExistingProducts.push(...response.data);
      hasMore = response.has_more;
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }
    
    console.log(`Found ${allExistingProducts.length} existing products in Stripe`);
    
    for (const productDef of ALL_PRODUCTS) {
      const existingProduct = allExistingProducts.find(p => p.name === productDef.name);
      
      if (!existingProduct) {
        console.log(`Creating product: ${productDef.name}...`);
        
        const product = await stripe.products.create({
          name: productDef.name,
          description: productDef.description,
          metadata: productDef.metadata,
          images: [],
        });
        
        await stripe.prices.create({
          product: product.id,
          unit_amount: productDef.price,
          currency: 'usd',
        });
        
        console.log(`Created: ${productDef.name} at $${(productDef.price / 100).toFixed(2)}`);
      } else {
        // Update existing product metadata if imageUrl changed
        const currentImageUrl = existingProduct.metadata?.imageUrl;
        if (currentImageUrl !== productDef.metadata.imageUrl) {
          console.log(`Updating image for: ${productDef.name}...`);
          await stripe.products.update(existingProduct.id, {
            description: productDef.description,
            metadata: productDef.metadata,
          });
          console.log(`Updated: ${productDef.name}`);
        }
        
        // Check if price needs to be updated
        const prices = await stripe.prices.list({ product: existingProduct.id, active: true, limit: 1 });
        if (prices.data.length > 0) {
          const currentPrice = prices.data[0];
          if (currentPrice.unit_amount !== productDef.price) {
            console.log(`Updating price for: ${productDef.name} from $${(currentPrice.unit_amount! / 100).toFixed(2)} to $${(productDef.price / 100).toFixed(2)}...`);
            // Archive old price and create new one
            await stripe.prices.update(currentPrice.id, { active: false });
            await stripe.prices.create({
              product: existingProduct.id,
              unit_amount: productDef.price,
              currency: 'usd',
            });
            console.log(`Price updated for: ${productDef.name}`);
          }
        }
      }
    }
    
    // Deactivate products that are no longer in ALL_PRODUCTS
    const productNames = ALL_PRODUCTS.map(p => p.name);
    for (const existingProduct of allExistingProducts) {
      if (!productNames.includes(existingProduct.name) && existingProduct.active) {
        console.log(`Deactivating removed product: ${existingProduct.name}...`);
        await stripe.products.update(existingProduct.id, { active: false });
        console.log(`Deactivated: ${existingProduct.name}`);
      }
    }
    
    console.log('Product seeding complete!');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Shared hub authentication (session + passport local strategy)
  setupAuth(app);

  // Seed products in the background (non-blocking)
  seedProducts().catch(err => console.error('Product seeding failed:', err));
  
  // Get Stripe publishable key for frontend
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  // Get all products from Stripe (with fallback to direct Stripe API)
  app.get("/api/products", async (req, res) => {
    try {
      // First try database
      let rows: any[] = [];
      try {
        rows = await stripeStorage.listProductsWithPrices();
      } catch (dbError) {
        console.log('Database query failed, falling back to Stripe API');
      }
      
      // If database has no products, fetch directly from Stripe
      if (!rows || rows.length === 0) {
        console.log('No products in database, fetching from Stripe API...');
        const stripe = await getUncachableStripeClient();
        const stripeProducts = await stripe.products.list({ active: true, limit: 100 });
        
        const products = [];
        for (const product of stripeProducts.data) {
          const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
          const price = prices.data[0];
          const metadata = product.metadata || {};
          
          products.push({
            id: product.id,
            title: product.name,
            description: product.description || '',
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (product.images?.[0] || ''),
            productType: metadata.productType || 'general',
            sortOrder: parseInt(metadata.sortOrder || '99'),
            gender: metadata.gender || null,
            price: price ? (price.unit_amount! / 100).toFixed(2) : '0.00',
            priceId: price?.id || null,
          });
        }
        
        return res.json(dedupeByName(products));
      }
      
      // Group prices by product and format for frontend
      const productsMap = new Map();
      for (const row of rows) {
        if (!productsMap.has(row.product_id)) {
          const metadata = (row.product_metadata || {}) as any;
          const images = (row.product_images || []) as any[];
          
          productsMap.set(row.product_id, {
            id: row.product_id,
            title: row.product_name,
            description: row.product_description,
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (images.length > 0 ? images[0] : ''),
            productType: metadata.productType || 'general',
            gender: metadata.gender || null,
            price: null,
            priceId: null,
          });
        }
        
        // Add price info (using first active price)
        const product = productsMap.get(row.product_id);
        if (row.price_id && !product.priceId) {
          product.price = (row.unit_amount as any) ? ((row.unit_amount as number) / 100).toFixed(2) : '0.00';
          product.priceId = row.price_id;
        }
      }

      res.json(dedupeByName(Array.from(productsMap.values())));
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get products by type (apparel or accessory) with fallback
  app.get("/api/products/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      
      // First try database
      let rows: any[] = [];
      try {
        rows = await stripeStorage.getProductsWithPricesByType(type);
      } catch (dbError) {
        console.log('Database query failed, falling back to Stripe API');
      }
      
      // If database has no products, fetch directly from Stripe
      if (!rows || rows.length === 0) {
        console.log(`No ${type} products in database, fetching from Stripe API...`);
        const stripe = await getUncachableStripeClient();
        const stripeProducts = await stripe.products.list({ active: true, limit: 100 });
        
        const products = [];
        for (const product of stripeProducts.data) {
          const metadata = product.metadata || {};
          if (metadata.productType !== type) continue;
          
          const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
          const price = prices.data[0];
          
          products.push({
            id: product.id,
            title: product.name,
            description: product.description || '',
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (product.images?.[0] || ''),
            productType: metadata.productType || 'general',
            sortOrder: parseInt(metadata.sortOrder || '99'),
            gender: metadata.gender || null,
            price: price ? (price.unit_amount! / 100).toFixed(2) : '0.00',
            priceId: price?.id || null,
          });
        }
        
        const deduped = dedupeByName(products);
        deduped.sort((a, b) => a.sortOrder - b.sortOrder);
        return res.json(deduped);
      }
      
      const productsMap = new Map();
      for (const row of rows) {
        if (!productsMap.has(row.product_id)) {
          const metadata = (row.product_metadata || {}) as any;
          const images = (row.product_images || []) as any[];
          
          productsMap.set(row.product_id, {
            id: row.product_id,
            title: row.product_name,
            description: row.product_description,
            category: metadata.category || 'General',
            imageUrl: metadata.imageUrl || (images.length > 0 ? images[0] : ''),
            productType: metadata.productType || 'general',
            sortOrder: parseInt(metadata.sortOrder || '99'),
            soldOut: metadata.soldOut === 'true',
            gender: metadata.gender || null,
            price: null,
            priceId: null,
          });
        }
        
        const product = productsMap.get(row.product_id);
        if (row.price_id && !product.priceId) {
          product.price = (row.unit_amount as any) ? ((row.unit_amount as number) / 100).toFixed(2) : '0.00';
          product.priceId = row.price_id;
        }
      }

      const products = dedupeByName(Array.from(productsMap.values())).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products by type:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create checkout session (Square-hosted checkout)
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId, productName, productDescription } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Server-authoritative pricing: never trust an amount from the client.
      // The price comes from our synced product data in the database.
      const priceRow: any = await stripeStorage.getPriceWithProduct(priceId);
      if (!priceRow || priceRow.unit_amount == null) {
        return res.status(404).json({ error: "Product price not found" });
      }

      const amountCents = Number(priceRow.unit_amount);
      if (!amountCents || amountCents <= 0) {
        return res.status(400).json({ error: "Invalid product price" });
      }

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      const url = await createSquarePaymentLink({
        name: (priceRow.product_name as string) || productName || "Order",
        amountCents,
        description: productDescription || (priceRow.product_description as string) || undefined,
        redirectUrl: `${baseUrl}/checkout/success`,
      });

      res.json({ url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  // Create custom checkout session for logo customization (Square-hosted checkout)
  app.post("/api/create-custom-checkout", async (req, res) => {
    try {
      const { logoId, logoName, garmentType, garmentId, placements, placementDescription } = req.body;

      if (!logoId || !garmentId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Server-authoritative pricing: compute the total here, never trust the client.
      // Base garment prices (USD) must mirror the LogoCustomizer options.
      const GARMENT_BASE_PRICES: Record<string, number> = {
        "short-sleeve": 30,
        "long-sleeve": 35,
        "pullover-hoodie": 50,
        "full-zip-hoodie": 60,
        "jacket": 75,
        "jeans": 65,
        "sweatpants": 55,
      };

      const basePrice = GARMENT_BASE_PRICES[garmentId];
      if (!basePrice) {
        return res.status(400).json({ error: "Invalid garment selection" });
      }

      const placementCount = Array.isArray(placements) ? placements.length : 1;
      const totalDollars = basePrice + (placementCount > 1 ? 10 : 0);
      const amountCents = totalDollars * 100;

      const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      const url = await createSquarePaymentLink({
        name: `Custom ${garmentType || "Garment"} - Logo #${logoId}`,
        amountCents,
        description: `Logo: ${logoName} | Placement: ${placementDescription}`,
        redirectUrl: `${baseUrl}/checkout/success`,
      });

      res.json({ url });
    } catch (error: any) {
      console.error('Error creating custom checkout session:', error);
      res.status(500).json({ error: error.message || "Failed to create custom checkout session" });
    }
  });

  // Email subscription endpoint
  const subscribeSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    source: z.string().optional(),
  });

  app.post("/api/subscribe", async (req, res) => {
    try {
      const result = subscribeSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors[0].message });
      }
      
      const { email, source } = result.data;
      
      // Check if already subscribed
      const existing = await storage.getSubscriberByEmail(email);
      if (existing) {
        return res.status(200).json({ message: "You're already subscribed! We'll keep you updated." });
      }
      
      // Add new subscriber
      const subscriber = await storage.addSubscriber({ email, source: source || null });
      
      if (subscriber) {
        res.status(201).json({ message: "Thank you for subscribing! You'll receive updates on new products and features." });
      } else {
        res.status(200).json({ message: "You're already subscribed! We'll keep you updated." });
      }
    } catch (error: any) {
      console.error('Error adding subscriber:', error);
      
      // If table doesn't exist, try to create it and retry
      if (error.message && error.message.includes('does not exist')) {
        try {
          const { ensureTablesExist } = await import('./db');
          await ensureTablesExist();
          
          // Retry adding subscriber
          const { email, source } = subscribeSchema.parse(req.body);
          const subscriber = await storage.addSubscriber({ email, source: source || null });
          if (subscriber) {
            return res.status(201).json({ message: "Thank you for subscribing! You'll receive updates on new products and features." });
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
        }
      }
      
      res.status(500).json({ error: "Failed to subscribe. Please try again." });
    }
  });

  // Get all subscribers (for admin use)
  app.get("/api/subscribers", async (req, res) => {
    try {
      const subscribers = await storage.getAllSubscribers();
      res.json(subscribers);
    } catch (error: any) {
      console.error('Error fetching subscribers:', error);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  return httpServer;
}
