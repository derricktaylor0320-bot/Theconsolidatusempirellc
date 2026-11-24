import type { ReactNode } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  BUTTER_LOTION_IMAGE,
  BUTTER_LOTION_MATCHING_SETS_IMAGE,
  BUTTER_LOTION_PRICE_ID,
  butterLotionUnitPriceDollars,
  butterLotionWasPriceDollars,
} from "@shared/elementsButterLotion";
import {
  CUSTOM_BUTTER_LOTION_IMAGE,
  CUSTOM_BUTTER_LOTION_PRICE_ID,
  CUSTOM_BUTTER_LOTION_TAGLINE,
  customButterLotionUnitPriceDollars,
} from "@shared/elementsCustomButterLotion";

const LOTION_PRICE = butterLotionUnitPriceDollars();
const LOTION_WAS = butterLotionWasPriceDollars();
const CUSTOM_PRICE = customButterLotionUnitPriceDollars();

export default function ButterLotionCollection() {
  return (
    <section
      className="mb-14 max-w-6xl mx-auto"
      aria-labelledby="butter-lotion-collection-title"
      data-testid="section-butter-lotion-collection"
    >
      <div className="mb-8 text-center">
        <h2
          id="butter-lotion-collection-title"
          className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight text-foreground mb-2"
        >
          Body Wash &amp; Butter Lotion
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Nature meets performance — 3-in-1 body wash with matching butter lotion,
          everyday scent profiles, and the Custom Butter Lotion line.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-col rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm"
          data-testid="card-wash-lotion-matching"
        >
          <img
            src={BUTTER_LOTION_MATCHING_SETS_IMAGE}
            alt="Four 3-in-1 body wash bottles with matching butter lotion jars — Island Tranquility, Avocado Oil, Cocoa Mango, and Men's Energizing Scent"
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
            data-testid="img-wash-lotion-matching"
          />
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-primary mb-1">
              Matching sets
            </p>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-2">
              3-in-1 Wash + Butter Lotion
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Four scent sets: Island Tranquility, Avocado Oil, Cocoa Mango, and
              Men&apos;s Energizing. Wash $10 · lotion ${LOTION_PRICE}.
            </p>
            <ButtonLink href={`/product/${BUTTER_LOTION_PRICE_ID}`} testId="link-matching-lotion">
              Shop lotion
            </ButtonLink>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm"
          data-testid="card-butter-lotion-scents"
        >
          <img
            src={BUTTER_LOTION_IMAGE}
            alt="Khomplete Khemistri Butter Lotion Collection — fourteen 4 oz scent jars"
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
            data-testid="img-butter-lotion-scents"
          />
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-primary mb-1">
              Scent profiles
            </p>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-2">
              Butter Lotion Collection
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Fourteen scents — wash-matched sets plus everyday profiles like Ocean Breeze
              and Whispering Rose — now ${LOTION_PRICE} a jar{" "}
              <span className="line-through text-muted-foreground/80">${LOTION_WAS}</span>.
            </p>
            <ButtonLink href={`/product/${BUTTER_LOTION_PRICE_ID}`} testId="link-butter-lotion">
              Shop scents
            </ButtonLink>
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col rounded-xl border border-primary/20 bg-card overflow-hidden shadow-sm"
          data-testid="card-custom-butter-lotion"
        >
          <img
            src={CUSTOM_BUTTER_LOTION_IMAGE}
            alt="Khomplete Khemistri Custom Butter Lotion Line — eight signature scent lids"
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
            data-testid="img-custom-butter-lotion"
          />
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-wide text-primary mb-1">
              {CUSTOM_BUTTER_LOTION_TAGLINE}
            </p>
            <h3 className="font-display text-lg font-bold uppercase tracking-tight mb-2">
              Custom Butter Lotion
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              Eight signature vibes — Delicious Vulva, Velvet Desire, Dark Chemistry,
              and more. ${CUSTOM_PRICE} a jar.
            </p>
            <ButtonLink href={`/product/${CUSTOM_BUTTER_LOTION_PRICE_ID}`} testId="link-custom-butter-lotion">
              Shop custom line
            </ButtonLink>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function ButtonLink({
  href,
  children,
  testId,
}: {
  href: string;
  children: ReactNode;
  testId: string;
}) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      data-testid={testId}
    >
      {children}
    </Link>
  );
}
