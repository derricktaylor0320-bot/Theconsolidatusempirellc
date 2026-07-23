import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { motion } from "framer-motion";
import letterheadCrest from "@assets/generated_images/consolidatus_empire_logo_2020.png";

const lifestyleCollections = [
  {
    number: "01",
    title: "Custom Apparel",
    description:
      "Signature apparel designed for style, comfort, and presence.",
  },
  {
    number: "02",
    title: "Personal Care & Fragrance",
    description:
      "Premium body butters and scented candles crafted for everyday self-care.",
  },
  {
    number: "03",
    title: "Drinkware & Daily Essentials",
    description:
      "Custom 40 oz insulated tumblers, durable phone cases, branded lighters, and essential accessories.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section
          className="relative overflow-hidden border-b border-primary/20 bg-secondary py-20 text-secondary-foreground md:py-28"
          data-testid="section-about-hero"
        >
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
            <div className="absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          </div>

          <div className="container relative mx-auto px-4">
            <BrandSectionBanner compact />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                Established 2020
              </p>
              <h1 className="mb-7 text-4xl font-display font-bold uppercase leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
                About <span className="gold-shine">Khomplete Khemistri</span>
              </h1>
              <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-secondary-foreground/80 md:text-xl">
                Apparel & Accessories built on harmony, balance, imagination,
                and the enduring power of three.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.5fr_0.75fr] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Our Story
              </p>
              <h2 className="mb-8 text-3xl font-display font-bold uppercase tracking-tight md:text-5xl">
                The Foundation & The Significance of Three
              </h2>
              <div className="space-y-6 text-lg font-light leading-relaxed text-foreground/85">
                <p>
                  Established in 2020 by three dedicated partners—Derrick
                  Taylor, Carlyle R. Oliver, and Jerome Young Jr.—Khomplete
                  Khemistri Apparel & Accessories began as a shared vision
                  rooted in harmony, balance, and bringing our collective
                  imagination to life. That core foundation is why the number 3
                  and the concept of the triumph hold such deep significance
                  for our brand.
                </p>
                <p>
                  Our journey started with a shared background as aspiring R&B
                  singers. We made a mutual pact: even if the music didn't pan
                  out, our bond as friends and our commitment to business would
                  remain unshakable. While life, family responsibilities, and
                  daily schedules meant we couldn't spend every day rehearsing
                  vocal harmonies like legendary groups do, that shared
                  creative mindset translated directly into our
                  entrepreneurial path.
                </p>
                <p>
                  Following years of laying the groundwork, the entity was
                  formally incorporated under Khomplete Khemistri Management
                  Group LLC (KKMG) in 2023, now operating under The
                  Consolidatus Empire LLC. Today, our brand represents that
                  exact synergy between core values, high-quality craft, and
                  unity.
                </p>
              </div>
            </motion.div>

            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="relative overflow-hidden rounded-2xl border border-primary/35 bg-secondary p-8 text-center shadow-2xl md:p-10"
              data-testid="card-significance-three"
            >
              <div className="pointer-events-none absolute inset-3 rounded-xl border border-primary/15" />
              <span className="relative block font-display text-[8rem] font-bold leading-none text-primary md:text-[10rem]">
                3
              </span>
              <p className="relative mt-2 font-brand text-lg uppercase tracking-[0.22em] text-primary">
                Partners
              </p>
              <div className="relative mx-auto my-5 h-px w-24 bg-primary/50" />
              <p className="relative font-brand text-lg uppercase tracking-[0.22em] text-primary">
                One Vision
              </p>
              <p className="relative mt-7 text-sm leading-relaxed text-secondary-foreground/65">
                Harmony. Balance. Unity.
              </p>
            </motion.aside>
          </div>
        </section>

        <section className="border-y border-primary/20 bg-secondary py-20 text-secondary-foreground md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Built for Everyday Life
              </p>
              <h2 className="mb-6 text-3xl font-display font-bold uppercase tracking-tight md:text-5xl">
                Our Mission & Brand Expansion
              </h2>
              <p className="text-lg font-light leading-relaxed text-secondary-foreground/80">
                Our mission is to create lifestyle products that do more than
                just complete an outfit—they amplify confidence, reflect
                individuality, and bring people together. What started with
                custom apparel has expanded into a full lifestyle collection.
                Today, Khomplete Khemistri touches every part of your daily
                routine.
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
              {lifestyleCollections.map((collection, index) => (
                <motion.article
                  key={collection.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-xl border border-primary/20 bg-background/35 p-7 transition-colors hover:border-primary/55"
                  data-testid={`card-collection-${index + 1}`}
                >
                  <span className="font-display text-sm font-semibold tracking-[0.2em] text-primary/70">
                    {collection.number}
                  </span>
                  <h3 className="mb-4 mt-5 text-xl font-display font-bold uppercase leading-tight tracking-wide text-primary">
                    {collection.title}
                  </h3>
                  <p className="leading-relaxed text-secondary-foreground/70">
                    {collection.description}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mx-auto grid max-w-6xl overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl md:grid-cols-[0.8fr_1.2fr]"
          >
            <div className="flex min-h-64 items-center justify-center bg-primary px-8 py-12 text-primary-foreground">
              <div className="text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] opacity-70">
                  The Mindset
                </p>
                <p className="font-display text-6xl font-bold uppercase leading-none md:text-7xl">
                  Be
                  <br />
                  The
                  <br />
                  Boss.
                </p>
              </div>
            </div>
            <div className="p-8 md:p-12 lg:p-14">
              <h2 className="mb-6 text-3xl font-display font-bold uppercase tracking-tight text-primary md:text-4xl">
                Empowering the Boss
              </h2>
              <p className="text-lg font-light leading-relaxed text-card-foreground/85">
                We believe that being a "Boss" isn't just about a title; it’s a
                mindset, a work ethic, and a commitment to personal excellence.
                Khomplete Khemistri empowers you to own your narrative, lead
                with confidence, and step out into the world with a presence
                that demands respect. When you carry or wear Khomplete
                Khemistri, you don't just fit in—you set the standard.
              </p>
            </div>
          </motion.div>
        </section>

        <section className="border-t border-primary/20 bg-secondary px-4 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                In Their Own Words
              </p>
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-secondary-foreground md:text-5xl">
                A Message from Our Founders
              </h2>
            </div>

            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              className="relative overflow-hidden border border-[#b68a3a] bg-[#f4efe2] px-6 py-10 text-[#3b2417] shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-10 md:px-16 md:py-14"
              data-testid="founders-letter"
            >
              <div className="pointer-events-none absolute inset-2 border border-[#b68a3a]/45" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-brand text-[8rem] font-bold text-[#a47a34]/[0.07] sm:text-[12rem] md:text-[17rem]">
                TCE
              </div>

              <div className="relative mx-auto mb-10 max-w-xl text-center">
                <svg
                  aria-hidden="true"
                  className="absolute h-0 w-0"
                  focusable="false"
                >
                  <filter
                    id="letterhead-logo-knockout"
                    colorInterpolationFilters="sRGB"
                  >
                    <feColorMatrix
                      type="matrix"
                      values="
                        1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        .85 .85 .85 0 -.35
                      "
                    />
                    <feComponentTransfer>
                      <feFuncA
                        type="gamma"
                        amplitude="1.35"
                        exponent=".72"
                        offset="0"
                      />
                    </feComponentTransfer>
                  </filter>
                </svg>
                <img
                  src={letterheadCrest}
                  alt="The Consolidatus Empire LLC letterhead crest"
                  className="mx-auto h-auto w-full max-w-sm"
                  style={{
                    filter:
                      "url(#letterhead-logo-knockout) drop-shadow(0 5px 5px rgb(97 61 19 / 0.18))",
                  }}
                  data-testid="img-founders-letterhead-logo"
                />
              </div>

              <blockquote className="relative mx-auto max-w-3xl space-y-6 text-base leading-8 sm:text-lg">
                <p>
                  “When the three of us established this journey in 2020, our
                  goal was simple: create something authentic, powerful, and
                  built to last. Khomplete Khemistri isn't just about what you
                  wear—it’s about how you carry yourself, how you connect with
                  others, and how you command your space.
                </p>
                <p>
                  Every piece we craft and every product we release is a
                  reflection of hard work, vision, and the continuous pursuit
                  of excellence. We built this platform for the dreamers, the
                  doers, and the leaders who move with purpose every single day.
                </p>
                <p>
                  Thank you for being a part of our story, supporting our
                  vision, and growing with us. Together, we are setting the
                  standard.”
                </p>
              </blockquote>

              <div className="relative mx-auto mt-10 max-w-3xl">
                <div className="flex items-center gap-4">
                  <span className="h-px flex-1 bg-[#a47a34]/55" />
                  <p className="font-brand text-xl italic text-[#8a622b] sm:text-2xl">
                    Sincerely
                  </p>
                  <span className="h-px flex-1 bg-[#a47a34]/55" />
                </div>
                <div className="mt-6 grid divide-y divide-[#a47a34]/40 border-y border-[#a47a34]/55 text-center font-brand font-semibold italic sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <p className="px-3 py-4">Derrick Taylor</p>
                  <p className="px-3 py-4">Carlyle R. Oliver</p>
                  <p className="px-3 py-4">Jerome Young Jr.</p>
                </div>
                <p className="mt-5 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#6f4a23]">
                  The Consolidatus Empire LLC
                </p>
              </div>
            </motion.article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
