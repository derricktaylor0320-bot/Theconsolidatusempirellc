import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Beef,
  CupSoda,
  Cookie,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

const proteins = [
  "Beef",
  "Chicken",
  "Turkey",
  "Italian Sausage",
];

const sodas = [
  { name: "Swoon", price: "$3" },
  { name: "Poppi", price: "$3" },
  { name: "OLIPOP", price: "$3" },
];

const desserts = [
  { name: "Pound Cake", price: "$3 / slice · $15 whole" },
  { name: "Sweet Potato Pie", price: "$3 / slice · $15 whole" },
  { name: "Rice Pudding", price: "$5 / 4 oz bowl" },
  { name: "Banana Pudding", price: "$5 / 4 oz bowl" },
];

const aLaCarte = [
  { name: "Single Hot Dog", price: "$4.50" },
  { name: "Two Hot Dogs", price: "$8.00" },
  { name: "Premium Soda", price: "$3.00" },
  { name: "Bottled Water", price: "$1.50" },
  { name: "Bag of Chips", price: "$1.00" },
];

export default function HotDogs() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="py-20 bg-secondary text-secondary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs md:text-sm font-display uppercase tracking-[0.3em] text-primary mb-6"
                data-testid="badge-coming-soon"
              >
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </span>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 tracking-tight uppercase">
                Premium Choice <span className="gold-shine">Hot Dogs</span>
              </h1>
              <p className="text-xl text-secondary-foreground/70 max-w-3xl mx-auto">
                A premium street-food experience joining the Consolidatus Empire.
                Quality franks, your choice of meat, ice-cold drinks, and
                homemade desserts — done right.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Combo deal */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="max-w-3xl mx-auto border-primary/40 overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <span className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 text-primary border border-primary/40">
                      <UtensilsCrossed className="w-8 h-8" />
                    </span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase mb-2">
                    The Combo
                  </h2>
                  <p
                    className="text-5xl font-bold text-primary mb-4"
                    data-testid="text-combo-price"
                  >
                    $11
                  </p>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Two hot dogs, a bag of chips, and a premium soda. Pick your
                    meat below — every combo is made to order.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Menu sections */}
        <section className="pb-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Proteins */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <Card className="h-full" data-testid="card-proteins">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/15 text-primary border border-primary/40 shrink-0">
                        <Beef className="w-5 h-5" />
                      </span>
                      <h3 className="font-display text-xl font-bold uppercase">
                        Choose Your Dog
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {proteins.map((p) => (
                        <li
                          key={p}
                          className="flex items-center gap-2 text-foreground"
                          data-testid={`text-protein-${p.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm font-medium text-primary uppercase tracking-wider">
                      No pork products
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sodas */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="h-full" data-testid="card-sodas">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/15 text-primary border border-primary/40 shrink-0">
                        <CupSoda className="w-5 h-5" />
                      </span>
                      <h3 className="font-display text-xl font-bold uppercase">
                        Sodas
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {sodas.map((s) => (
                        <li
                          key={s.name}
                          className="flex items-center justify-between gap-3 text-foreground"
                          data-testid={`text-soda-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {s.name}
                          </span>
                          <span className="text-sm font-medium text-primary text-right shrink-0">
                            {s.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Premium healthy-choice sodas — ice cold. $3 each, or one
                      included with every combo.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Desserts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="h-full" data-testid="card-desserts">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-full bg-primary/15 text-primary border border-primary/40 shrink-0">
                        <Cookie className="w-5 h-5" />
                      </span>
                      <h3 className="font-display text-xl font-bold uppercase">
                        Desserts
                      </h3>
                    </div>
                    <ul className="space-y-3">
                      {desserts.map((d) => (
                        <li
                          key={d.name}
                          className="flex items-start justify-between gap-3 text-foreground"
                          data-testid={`text-dessert-${d.name.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            {d.name}
                          </span>
                          <span className="text-sm font-medium text-primary text-right shrink-0">
                            {d.price}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Offered periodically — ask what's fresh.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* A la carte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <Card className="max-w-3xl mx-auto" data-testid="card-a-la-carte">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-bold uppercase mb-4 text-center">
                    On Its Own
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {aLaCarte.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-3 text-foreground border border-border/50 rounded-lg px-4 py-3"
                        data-testid={`text-alacarte-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <span>{item.name}</span>
                        <span className="font-medium text-primary">{item.price}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Two dogs, chips, and a premium soda on their own run $12 — grab{" "}
                    <span className="text-primary font-medium">The Combo for $11</span>{" "}
                    and save.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="mt-16 bg-secondary rounded-2xl p-8 text-center max-w-3xl mx-auto">
              <h3 className="font-display text-2xl font-bold mb-3 uppercase">
                Opening <span className="text-primary">Soon</span>
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Premium Choice Hot Dogs is getting ready to serve. Card payments
                accepted in person for fast, seamless checkout. Stay tuned for
                launch details and locations.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
