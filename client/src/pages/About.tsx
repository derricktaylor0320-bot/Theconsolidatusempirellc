import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BrandSectionBanner from "@/components/BrandSectionBanner";
import { motion } from "framer-motion";
import founderImg from "@assets/1764214779988_1764214819082.jpg";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="py-24 bg-secondary text-secondary-foreground relative overflow-hidden min-h-[80vh] flex items-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4">
            <BrandSectionBanner className="mb-10" />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter mb-8">
                🖤 About Us: <span className="text-primary">Khomplete Khemistri</span>
              </h1>
              
              {/* Founder Image */}
              <div className="mb-12 relative inline-block">
                <div className="absolute inset-0 border-2 border-primary translate-x-2 translate-y-2 rounded-xl" />
                <img 
                  src={founderImg} 
                  alt="Founder of Khomplete Khemistri" 
                  className="relative rounded-xl shadow-2xl w-full max-w-md mx-auto object-cover aspect-[3/4] border border-white/10"
                />
              </div>

              <div className="prose prose-invert prose-lg mx-auto space-y-8 text-lg md:text-xl font-light leading-relaxed text-secondary-foreground/90 text-left">
                <p>
                  <span className="font-bold text-primary">Khomplete Khemistri Apparel</span> is a brand founded on the principles of brotherhood, loyalty, and entrepreneurial spirit. Officially established as an LLC in 2023, the business is the culmination of a deep bond formed in 2020 among three bandmates who share a singular vision for both music and self-made success.
                </p>
                
                <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-primary pt-4">The Foundation of Khomplete Khemistri</h3>
                <p>
                  The name Khomplete Khemistri—with its unique spelling—is a direct, creative tribute to our original singing group. It represents the singular, powerful chemistry between the partners and our dedication to thinking outside the box. While we continue to pursue our passion for music, this apparel line serves as a tangible expression of our shared belief in entrepreneurship.
                </p>

                <h3 className="text-2xl font-display font-bold uppercase tracking-wide text-primary pt-4">Our Mission: Empowering the Boss</h3>
                <p>
                  We believe in the power of owning your destiny. Our founder and partners are committed to designing high-quality apparel that embodies the boss mindset.
                </p>
                <p>
                  When you choose Khomplete Khemistri, you are choosing more than just clothing. You are choosing a statement of empowerment, a reminder that there is no limit to what you can achieve as an entrepreneur.
                </p>
                
                <p className="text-2xl font-display uppercase tracking-wide pt-8 border-t border-primary/20 text-center">
                  "Khomplete Khemistri Apparel: Wear the mindset. Be the boss."
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
