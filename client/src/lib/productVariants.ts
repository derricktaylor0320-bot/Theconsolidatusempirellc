// Collapses size/variant siblings (products sharing a `variantGroup`) into a
// single storefront card, Amazon-style: one picture with size buttons that
// swap the photo, title, price, and checkout priceId. Products without a
// variantGroup pass through untouched.

export interface ProductVariant {
  label: string;
  title: string;
  price: number;
  priceId: string | null;
  image: string;
  description: string | null;
  soldOut: boolean;
}

export function groupProductVariants(products: any[]): any[] {
  const groups = new Map<string, any>();
  const out: any[] = [];

  for (const p of products) {
    const groupName = p?.variantGroup;
    if (!groupName) {
      out.push(p);
      continue;
    }
    const variant: ProductVariant = {
      label: p.variantLabel || p.title,
      title: p.title,
      price: parseFloat(p.price ?? "0") || 0,
      priceId: p.priceId ?? null,
      image: p.imageUrl,
      description: p.description ?? null,
      soldOut: !!p.soldOut,
    };
    const existing = groups.get(groupName);
    if (existing) {
      existing.variants.push(variant);
    } else {
      const card = { ...p, variants: [variant] };
      groups.set(groupName, card);
      out.push(card);
    }
  }

  // Smallest size first (labels like "20 oz" sort numerically) so the default
  // photo/price is the entry-level variant.
  Array.from(groups.values()).forEach((card) => {
    card.variants.sort(
      (a: ProductVariant, b: ProductVariant) =>
        (parseFloat(a.label) || 0) - (parseFloat(b.label) || 0),
    );
  });

  return out;
}
