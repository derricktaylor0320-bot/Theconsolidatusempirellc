// Canonical list of selectable brand-logo names ("alt" text) offered across the
// store's customizers (mug handle color + logo, phone case model + logo, etc.).
//
// This is the SERVER-side allowlist used to validate a customer's logo choice at
// checkout. It must stay in sync with the logo `alt` strings in
// client/src/lib/logoCatalog.ts (the client source of truth that also pairs each
// logo with its image). When you add or rename a logo there, update this list
// too — otherwise checkout will reject the new logo on customized products.
export const LOGO_ALTS: string[] = [
  // Canvas Collection
  "Gold 3D Emblem",
  "Gold & White Emblem",
  "Classic Black & White",
  "Inverted Black & White",
  "Red & Black Strike",
  "Royal Blue Emblem",
  "Sky Blue Emblem",
  "Neon Pink Emblem",
  "Slate Grey Emblem",
  "Forest Green Emblem",
  "Deep Purple Emblem",
  "Black & Gold Emblem",
  "Orange Emblem",
  "Brown & Gold Emblem",
  "Teal Emblem",
  "Lime Green Emblem",
  "Circular Text Logo",
  "10 Core Principles Medallion",
  "Khomplete Khemistri Accessories Eagle",
  "Crossed Swords with Khomplete Khemistri",
  "KKA Crossed Swords Logo",
  // Badge of Honor
  "Blue & Gold Values Crest - Friendship, Trust, Harmony",
  "Royal Blue & Gold Crest",
  "Khomplete Khemistri Apparel Crest - Unity, Strength, Brotherhood, Entrepreneurship, Harmony",
  "Classic Gold Crest",
  "Silver Elite Crest",
  "Cyan & Gold Crest",
  "Monochrome Crest",
  "Brown & Gold Ornate Crest",
  "Purple Ornate Crest",
  "Navy & Silver Crest",
  "Purple with Swords",
  "Green with Swords",
  "Red & Gold with Swords",
  "Khomplete Khemistri Apparel Gold Crest",
  "KKMG LLC Eagle Shield of Honor",
  // Shield of Honor
  "The Golden Eagle Shield",
  "Navy & Gold Eagle Shield",
  "Silver & Gold Eagle Shield",
  "Black & Gold Eagle Shield",
  "Maroon & Gold Eagle Shield",
  "Navy & Silver Eagle Shield",
  "Brown & Gold Eagle Shield",
  "Purple & Gold Eagle Shield",
  "White & Gold Eagle Shield",
  "KK Shield with Swords",
  "KKA Shield with Eagle - Khomplete Khemistri Apparel",
  // Compass Collection
  "Khomplete Khemistri Apparel Compass",
  "KKMG LLC Compass",
  "KKMG LLC Compass II",
  "Khomplete Khemistri Apparel Sunburst Emblem",
  // Canvas Collection (Pride)
  "Khomplete Khemistri Apparel Pride Rainbow Crest",
  // Canvas Collection (gold brand crests)
  "Khomplete Khemistri Apparel & Accessories Gold Crest",
];

export const LOGO_ALT_SET: Set<string> = new Set(LOGO_ALTS);
