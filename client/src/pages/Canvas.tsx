import { motion } from "framer-motion";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Import all logo variations (Circular) - 1st Generation 100-117
import logoGold3D from "@assets/Screenshot_20251126_202749_Photos_1764207404143.jpg";
import logoBlueWhite from "@assets/Screenshot_20251126_202727_Photos_1764207404154.jpg";
import logoBlackWhite from "@assets/Screenshot_20251126_202703_Photos_1764207404162.jpg";
import logoRedBlack from "@assets/image000004_1764207404172.jpg";
import logoBWInverted from "@assets/image000005_1764207404180.jpg";
import logoPinkBlack from "@assets/image000006_1764207404188.jpg";
import logoGoldWhite from "@assets/Screenshot_20250423_101841_Drive_1764207404197.jpg";
import logoLightBlue from "@assets/image000008_1764207404205.jpg";
import logoGreyWhite from "@assets/image000007_1764207404213.jpg";
import logoForestGreen from "@assets/logo_forest_green.jpg";
import logoDeepPurple from "@assets/logo_deep_purple.jpg";
import logoBlackGoldCircle from "@assets/logo_black_gold.jpg";
import logoOrange from "@assets/logo_orange.jpg";
import logoBrownGold from "@assets/logo_brown_gold.jpg";
import logoTeal from "@assets/logo_teal.jpg";
import logoLimeGreen from "@assets/logo_lime_green.jpg";
import logoCircleText from "@assets/logo_circle_text.jpg";
import medallionCorePrinciples from "@assets/copilot_image_1781210586301_1781211927468.jpeg";

// Import the shield/crest variations (Badge of Honor) - 1st Generation 118-132
import shieldBlackWhite from "@assets/Screenshot_20251126_205145_Photos_1764208360832.jpg";
import shieldBlueGold from "@assets/Screenshot_20251126_205125_Photos_1764208373884.jpg";
import crestBlueValuesSwords from "@assets/image000009_1781214860404.jpg";
import shieldGoldBrown from "@assets/Screenshot_20251126_205108_Photos_1764208382966.jpg";
import shieldCyanGold from "@assets/Screenshot_20251126_204843_Photos_1764208390801.jpg";
import badgeBlueValues from "@assets/copilot_image_1781211230575_1781211851159.jpeg";
import crestGoldApparel from "@assets/1781208988886_1781211764006.png";
import shieldSilver from "@assets/Screenshot_20251126_205037_Photos_1764217995547.jpg";
import badgeBrownGoldOrnate from "@assets/badge_brown_gold_ornate.jpg";
import badgePurpleOrnate from "@assets/badge_purple_ornate.jpg";
import badgeNavySilver from "@assets/badge_navy_silver.jpg";
import badgePurpleSwords from "@assets/badge_purple_swords.jpg";
import badgeGreenSwords from "@assets/badge_green_swords.jpg";
import badgeRedGoldSwords from "@assets/badge_red_gold_swords.jpg";

// Import the Eagle Shields (Shield of Honor) - 2nd Generation 200-208
import honorBrownGold from "@assets/1764209713521_1764218036651.jpg";
import honorSilverGold from "@assets/1764210798224_1764211139124.jpg";
import honorNavyGold from "@assets/1764210111747_1764211158691.jpg";
import honorBlackGold from "@assets/1764209965710_1764211158709.jpg";
import honorMaroonGold from "@assets/1764209907665_1764211158717.jpg";
import honorNavySilver from "@assets/1764209634941_1764211158726.jpg";
import honorAllGold from "@assets/1764210327974_1764211486802.jpg";
import honorPurpleGold from "@assets/shield_purple_gold.jpg";
import honorWhiteGold from "@assets/shield_white_gold.jpg";

// Import Legacy Collage
import legacyCollage from "@assets/Screenshot_20251126_202634_Photos_1764214454254.jpg";

// Import KKMG LLC Eagle Shield (#214)
import kkmgEagleShield from "@assets/1781352952354_1781362246255.png";

// Import Luxury Banners
import luxuryBanner from "@assets/1764816894577_1764816974804.jpg";
import bannerMoodVibe from "@assets/generated_images/color_mood_vibe_banner.png";
import banner1stGen from "@assets/generated_images/1st_generation_logos_banner.png";
import bannerBadgeHonor from "@assets/generated_images/badge_of_honor_banner.png";
import banner2ndGen from "@assets/generated_images/2nd_gen_logos_banner.png";

// Import 2nd Generation Logos
import logoAccessoriesEagle from "@assets/generated_images/kk_accessories_standalone_logo.png";
import logoCrossedSwords from "@assets/generated_images/crossed_swords_kk_logo.png";
import logoKKShieldSwords from "@assets/generated_images/kk_shield_with_swords.png";
import logoKKACrossedSwords from "@assets/generated_images/kka_crossed_swords_logo.png";
import logoBeddingLuxury from "@assets/kk_accessories_bedding_logo.jpg";
import logoKKAShield from "@assets/kka_shield_apparel_logo.jpg";

// Import 3rd Generation Logos - The Compass Collection
import bannerCompass from "@assets/1781364317455_1781369690056.png";
import compassKKApparel from "@assets/copilot_image_1781366430242_1781369724345.jpeg";
import compassKMG1 from "@assets/image_1781365445486_1781369761822.jpeg";
import compassKMG2 from "@assets/image_1781365494182_1781369761833.jpeg";
import compassSunburst from "@assets/1781351981898_1781369761839.png";

export default function Canvas() {
  const logos = [
    { id: "100", src: logoGold3D, alt: "Gold 3D Emblem", color: "Gold 3D" },
    { id: "101", src: logoGoldWhite, alt: "Gold & White Emblem", color: "Gold & White" },
    { id: "102", src: logoBlackWhite, alt: "Classic Black & White", color: "Black & White" },
    { id: "103", src: logoBWInverted, alt: "Inverted Black & White", color: "Inverted B&W" },
    { id: "104", src: logoRedBlack, alt: "Red & Black Strike", color: "Red & Black" },
    { id: "105", src: logoBlueWhite, alt: "Royal Blue Emblem", color: "Royal Blue" },
    { id: "106", src: logoLightBlue, alt: "Sky Blue Emblem", color: "Sky Blue" },
    { id: "107", src: logoPinkBlack, alt: "Neon Pink Emblem", color: "Neon Pink" },
    { id: "108", src: logoGreyWhite, alt: "Slate Grey Emblem", color: "Slate Grey" },
    { id: "109", src: logoForestGreen, alt: "Forest Green Emblem", color: "Forest Green" },
    { id: "110", src: logoDeepPurple, alt: "Deep Purple Emblem", color: "Deep Purple" },
    { id: "111", src: logoBlackGoldCircle, alt: "Black & Gold Emblem", color: "Black & Gold" },
    { id: "112", src: logoOrange, alt: "Orange Emblem", color: "Orange" },
    { id: "113", src: logoBrownGold, alt: "Brown & Gold Emblem", color: "Brown & Gold" },
    { id: "114", src: logoTeal, alt: "Teal Emblem", color: "Teal" },
    { id: "115", src: logoLimeGreen, alt: "Lime Green Emblem", color: "Lime Green" },
    { id: "116", src: logoCircleText, alt: "Circular Text Logo", color: "Circle Text" },
    { id: "117", src: medallionCorePrinciples, alt: "10 Core Principles Medallion", color: "Core Principles Medallion" },
  ];

  const badges = [
    { id: "118", src: badgeBlueValues, alt: "Blue & Gold Values Crest - Friendship, Trust, Harmony", color: "Blue Values Crest", featured: true },
    { id: "119", src: shieldBlueGold, alt: "Royal Blue & Gold Crest", color: "Royal Blue & Gold" },
    { id: "120", src: crestBlueValuesSwords, alt: "Khomplete Khemistri Apparel Crest - Unity, Strength, Brotherhood, Entrepreneurship, Harmony", color: "Blue Apparel Crest", featured: true },
    { id: "121", src: shieldGoldBrown, alt: "Classic Gold Crest", color: "Classic Gold" },
    { id: "122", src: shieldSilver, alt: "Silver Elite Crest", color: "Silver Elite" },
    { id: "123", src: shieldCyanGold, alt: "Cyan & Gold Crest", color: "Cyan & Gold" },
    { id: "124", src: shieldBlackWhite, alt: "Monochrome Crest", color: "Monochrome" },
    { id: "125", src: badgeBrownGoldOrnate, alt: "Brown & Gold Ornate Crest", color: "Brown & Gold Ornate" },
    { id: "126", src: badgePurpleOrnate, alt: "Purple Ornate Crest", color: "Purple Ornate" },
    { id: "127", src: badgeNavySilver, alt: "Navy & Silver Crest", color: "Navy & Silver" },
    { id: "128", src: badgePurpleSwords, alt: "Purple with Swords", color: "Purple Swords" },
    { id: "129", src: badgeGreenSwords, alt: "Green with Swords", color: "Emerald Swords" },
    { id: "130", src: badgeRedGoldSwords, alt: "Red & Gold with Swords", color: "Red & Gold Swords" },
    { id: "131", src: crestGoldApparel, alt: "Khomplete Khemistri Apparel Gold Crest", color: "Gold Apparel Crest", featured: true },
    { id: "132", src: kkmgEagleShield, alt: "KKMG LLC Eagle Shield of Honor", color: "KKMG LLC Shield", featured: true },
  ];

  const honorShields = [
    { id: "200", src: honorAllGold, alt: "The Golden Eagle Shield", color: "All Gold", featured: true },
    { id: "201", src: honorNavyGold, alt: "Navy & Gold Eagle Shield", color: "Navy & Gold" },
    { id: "202", src: honorSilverGold, alt: "Silver & Gold Eagle Shield", color: "Silver & Gold" },
    { id: "203", src: honorBlackGold, alt: "Black & Gold Eagle Shield", color: "Black & Gold" },
    { id: "204", src: honorMaroonGold, alt: "Maroon & Gold Eagle Shield", color: "Maroon & Gold" },
    { id: "205", src: honorNavySilver, alt: "Navy & Silver Eagle Shield", color: "Navy & Silver" },
    { id: "206", src: honorBrownGold, alt: "Brown & Gold Eagle Shield", color: "Brown & Gold" },
    { id: "207", src: honorPurpleGold, alt: "Purple & Gold Eagle Shield", color: "Purple & Gold" },
    { id: "208", src: honorWhiteGold, alt: "White & Gold Eagle Shield", color: "White & Gold" },
  ];

  const secondGenLogos = [
    { id: "209", src: logoAccessoriesEagle, alt: "Khomplete Khemistri Accessories Eagle", color: "Accessories Eagle", featured: true },
    { id: "210", src: logoCrossedSwords, alt: "Crossed Swords with Khomplete Khemistri", color: "Crossed Swords" },
    { id: "211", src: logoKKShieldSwords, alt: "KK Shield with Swords", color: "KK Shield & Swords" },
    { id: "212", src: logoKKACrossedSwords, alt: "KKA Crossed Swords Logo", color: "KKA Swords" },
    { id: "213", src: logoBeddingLuxury, alt: "Khomplete Khemistri Accessories - Sleep and Dream in Luxury", color: "Bedding Luxury", featured: true },
    { id: "214", src: logoKKAShield, alt: "KKA Shield with Eagle - Khomplete Khemistri Apparel", color: "KKA Shield", featured: true },
  ];

  const compassCollection = [
    { id: "300", src: compassKKApparel, alt: "Khomplete Khemistri Apparel Compass", color: "KK Apparel Compass", featured: true },
    { id: "301", src: compassKMG1, alt: "KKMG LLC Compass", color: "KKMG LLC Compass", featured: true },
    { id: "302", src: compassKMG2, alt: "KKMG LLC Compass II", color: "KKMG LLC Compass II" },
    { id: "303", src: compassSunburst, alt: "Khomplete Khemistri Apparel Sunburst Emblem", color: "Apparel Sunburst", featured: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        
        {/* Section 1: Royalty Canvas Collection (The 9 Logos) */}
        <section className="py-24 bg-secondary text-secondary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto text-center mb-16"
            >
              <img 
                src={luxuryBanner} 
                alt="Our Branded Logo Collection" 
                className="w-full h-auto object-contain rounded-lg shadow-2xl"
              />
            </motion.div>

            <div className="text-center mb-16">
              <img 
                src={bannerMoodVibe} 
                alt="Color to Match Your Mood and Vibe" 
                className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-xl mb-4"
              />
              <p className="text-secondary-foreground/60 mt-4 max-w-2xl mx-auto">
                Sixteen vibrant variations. One vision. Representing the multifaceted nature of our empire and celebrating our diverse community.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12">
              {logos.map((logo, index) => (
                <Link key={logo.id} href={`/customize/${logo.id}`} data-testid={`link-logo-${logo.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="group relative flex flex-col items-center justify-center bg-primary/5 rounded-xl p-6 hover:bg-primary/10 transition-colors duration-300 border border-white/5 hover:border-primary/20 cursor-pointer"
                  >
                    <div className="relative w-full aspect-square">
                      <img 
                        src={logo.src} 
                        alt={logo.alt}
                        className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-primary/60 text-sm font-mono">#{logo.id}</span>
                      <p className="text-secondary-foreground font-display text-sm uppercase tracking-wide mt-1">{logo.color}</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <span className="text-white font-display text-lg uppercase tracking-wide">Customize</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* 1st Generation Logos Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full mt-24"
            >
              <div className="text-center mb-8">
                <img 
                  src={banner1stGen} 
                  alt="Our 1st Generation Logos" 
                  className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-xl mb-4"
                />
                <p className="text-secondary-foreground/60 mt-4 max-w-2xl mx-auto">
                  The original designs that started it all. A testament to our brand's evolution.
                </p>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-primary/20 shadow-2xl">
                <img 
                  src={legacyCollage} 
                  alt="Our 1st Generation Logos by Khomplete Khemistri"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>
              <p className="text-center text-primary/80 text-sm uppercase tracking-widest mt-4">
                The Consolidatus Empire • Est. 2020
              </p>
            </motion.div>

            {/* Badge of Honor crests — part of the 1st Generation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full mt-24"
            >
              <div className="text-center mb-16">
                <img 
                  src={bannerBadgeHonor} 
                  alt="Our Royalty Badge of Honor" 
                  className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-xl mb-4"
                />
                <p className="text-secondary-foreground/60 mt-4 max-w-2xl mx-auto text-lg">
                  The crests that symbolize our bond. Brotherhood, Unity, and Strength.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {badges.map((badge, index) => (
                  <Link key={badge.id} href={`/customize/${badge.id}`} data-testid={`link-badge-${badge.id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      className={`group relative flex flex-col items-center justify-center bg-background rounded-xl p-4 border border-border hover:border-primary/40 overflow-hidden shadow-lg cursor-pointer ${badge.featured ? 'bg-gradient-to-b from-background to-primary/5' : ''}`}
                    >
                      <div className="relative w-full aspect-square flex items-center justify-center">
                        <img 
                          src={badge.src} 
                          alt={badge.alt}
                          className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <span className="text-primary/60 text-sm font-mono">#{badge.id}</span>
                        <p className="text-foreground font-display text-sm uppercase tracking-wide mt-1">{badge.color}</p>
                        <span className="text-xs text-primary/80 uppercase tracking-widest mt-2 block">1st Generation</span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                        <span className="text-white font-display text-lg uppercase tracking-wide">Customize</span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

        {/* Section 2: 2nd Generation (Eagle Shields + 2nd Gen Logos) */}
        <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <img 
                src={banner2ndGen} 
                alt="Our 2nd Generation Logos" 
                className="w-full max-w-4xl mx-auto h-auto object-contain rounded-lg shadow-xl mb-4"
              />
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                The evolution of the empire. Our Shield of Honor eagle crests joined by the new designs that protect the wealth, the vision, and the future.
                <span className="block text-primary font-bold mt-2">EST. 2020</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {honorShields.map((shield, index) => (
                <Link key={shield.id} href={`/customize/${shield.id}`} data-testid={`link-shield-${shield.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`group relative flex flex-col items-center justify-center bg-black rounded-xl p-4 border border-white/10 hover:border-primary/40 overflow-hidden cursor-pointer ${shield.featured ? 'md:col-span-2 lg:col-span-1 bg-gradient-to-b from-black to-primary/10' : ''}`}
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <img 
                        src={shield.src} 
                        alt={shield.alt}
                        className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-primary/60 text-sm font-mono">#{shield.id}</span>
                      <p className="text-white font-display text-lg uppercase tracking-wide mt-1">{shield.color}</p>
                      <span className="text-xs text-primary/80 uppercase tracking-widest mt-2 block">2nd Generation</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <span className="text-white font-display text-lg uppercase tracking-wide">Customize</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {secondGenLogos.map((logo, index) => (
                <Link key={logo.id} href={`/customize/${logo.id}`} data-testid={`link-2ndgen-${logo.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`group relative flex flex-col items-center justify-center bg-gradient-to-b from-black to-primary/5 rounded-xl p-6 border border-primary/20 hover:border-primary/50 overflow-hidden cursor-pointer shadow-xl`}
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <img 
                        src={logo.src} 
                        alt={logo.alt}
                        className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-primary/60 text-sm font-mono">#{logo.id}</span>
                      <p className="text-foreground font-display text-lg uppercase tracking-wide mt-1">{logo.color}</p>
                      <span className="text-xs text-primary/80 uppercase tracking-widest mt-2 block">2nd Generation</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <span className="text-white font-display text-lg uppercase tracking-wide">Customize</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: 3rd Generation - The Compass Collection */}
        <section className="py-24 bg-gradient-to-b from-secondary/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <img 
                src={bannerCompass} 
                alt="Our 3rd Generation Logos - The Compass Collection" 
                className="w-full max-w-2xl mx-auto h-auto object-contain rounded-lg shadow-xl mb-4"
              />
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Our 3rd Generation — The Compass Collection. Charting the course of the empire, guided by direction, discipline, and vision.
                <span className="block text-primary font-bold mt-2">EST. 2020</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {compassCollection.map((logo, index) => (
                <Link key={logo.id} href={`/customize/${logo.id}`} data-testid={`link-compass-${logo.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`group relative flex flex-col items-center justify-center bg-gradient-to-b from-black to-primary/5 rounded-xl p-6 border border-primary/20 hover:border-primary/50 overflow-hidden cursor-pointer shadow-xl`}
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <img 
                        src={logo.src} 
                        alt={logo.alt}
                        className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-primary/60 text-sm font-mono">#{logo.id}</span>
                      <p className="text-foreground font-display text-lg uppercase tracking-wide mt-1">{logo.color}</p>
                      <span className="text-xs text-primary/80 uppercase tracking-widest mt-2 block">3rd Generation</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <span className="text-white font-display text-lg uppercase tracking-wide">Customize</span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
