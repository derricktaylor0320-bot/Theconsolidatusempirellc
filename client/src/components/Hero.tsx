import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import heroImage from "@assets/generated_images/luxury_empire_headquarters_background.png";
import consolidatusLogo from "@assets/generated_images/consolidatus_empire_logo_2020.png";

export default function Hero() {
  return (
    <section className="relative h-[85vh] w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="The Consolidatus Empire Headquarters" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center mb-6"
        >
          <img 
            src={consolidatusLogo} 
            alt="The Consolidatus Empire Logo" 
            className="w-64 h-auto md:w-80 lg:w-96 object-contain"
          />
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl font-light max-w-2xl mx-auto mb-10 text-white/90"
        >
          Khomplete Khemistri Mgmt LLC. <br/>
          A collective of premium brands, creative spaces, and visionary apparel.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/apparel">
            <Button size="lg" className="bg-primary text-black hover:bg-white hover:text-black font-display uppercase tracking-wider text-lg px-8 py-6 h-auto">
              Shop Khemistri
            </Button>
          </Link>
          <Link href="/hub">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black font-display uppercase tracking-wider text-lg px-8 py-6 h-auto bg-transparent">
              Centralized Hub
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
