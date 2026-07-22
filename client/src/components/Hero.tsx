import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroBackground from "@assets/1783773416912_1783774780616.png";
import crestLogo from "../../../image.png";

export default function Hero() {
  return (
    <section className="relative flex h-[85vh] w-full items-center justify-center overflow-hidden text-white">
      <div className="absolute inset-0">
        <img
          src={heroBackground}
          alt="The Consolidatus Empire Headquarters"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_40%,rgba(0,0,0,0.35),transparent_75%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 flex items-center justify-center"
        >
          <img
            src={crestLogo}
            alt="Golden-brown three-eagle crest for The Consolidatus Empire LLC"
            className="h-auto w-72 object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.6)] md:w-96 lg:w-[26rem]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto mb-10 max-w-3xl font-brand text-base font-medium leading-relaxed tracking-[0.04em] text-white/95 md:text-xl"
        >
          The Consolidatus Empire LLC is designed to write your own ticket and{" "}
          <span className="text-primary">Be Your Own Boss</span>, empowering
          vision, building legacies where unity meets opportunity.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Link href="/apparel">
            <Button
              size="lg"
              className="h-auto bg-primary px-8 py-6 font-display text-lg uppercase tracking-wider text-black hover:bg-white hover:text-black"
            >
              Shop Khemistri
            </Button>
          </Link>
          <Link href="/hub">
            <Button
              size="lg"
              variant="outline"
              className="h-auto border-white bg-transparent px-8 py-6 font-display text-lg uppercase tracking-wider text-white hover:bg-white hover:text-black"
            >
              Centralized Hub
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
