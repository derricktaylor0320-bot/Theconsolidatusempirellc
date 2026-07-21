import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "../../../image.png";

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-[#160b05] text-white">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover opacity-25 blur-3xl"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#160b05]/80 via-black/15 to-[#160b05]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-black/20" />
      </div>

      <div className="relative z-10 container mx-auto grid min-h-[85vh] items-center gap-8 px-4 py-10 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:gap-12 lg:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center"
        >
          <img
            src={heroImage}
            alt="Golden-brown three-eagle crest for The Consolidatus Empire LLC"
            className="max-h-[58vh] w-auto max-w-full rounded-sm object-contain shadow-[0_20px_70px_rgba(0,0,0,0.65)] ring-1 ring-primary/30 sm:max-h-[64vh] lg:max-h-[76vh]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
        >
          <p className="mb-10 text-lg font-light text-white/90 md:text-xl">
            The Consolidatus Empire LLC. <br />
            A collective of premium brands, creative spaces, and visionary apparel.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
          >
            <Link href="/apparel">
              <Button size="lg" className="h-auto bg-primary px-8 py-6 font-display text-lg uppercase tracking-wider text-black hover:bg-white hover:text-black">
                Shop Khemistri
              </Button>
            </Link>
            <Link href="/hub">
              <Button size="lg" variant="outline" className="h-auto border-white bg-transparent px-8 py-6 font-display text-lg uppercase tracking-wider text-white hover:bg-white hover:text-black">
                Centralized Hub
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
