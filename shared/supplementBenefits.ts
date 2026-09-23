import {
  SEA_MOSS_GEL_CRAFT_NOTE,
  SEA_MOSS_GEL_HERITAGE_TAGLINE,
  SEA_MOSS_GELS,
} from "./elementsSeaMossGels";

export interface SupplementBenefit {
  label: string;
  text: string;
}

export interface SupplementInfo {
  intro?: string;
  benefits: SupplementBenefit[];
  note?: string;
  heading?: string;
}

const SEA_MOSS_FDA_NOTE =
  "These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.";

const SEA_MOSS_SHARED_BENEFITS: SupplementBenefit[] = [
  { label: "Enhances Immunity", text: "Supports everyday immune defenses as part of a holistic wellness routine." },
  { label: "Reduces Inflammation", text: "Mineral-rich sea moss helps support the body's natural inflammatory balance." },
  { label: "Increases Hydration", text: "Gel-form sea moss helps nourish the body with moisture-supporting minerals." },
];

function seaMossJarIntro(tagline: string): string {
  return `${tagline}. ${SEA_MOSS_GEL_HERITAGE_TAGLINE}. ${SEA_MOSS_GEL_CRAFT_NOTE}.`;
}

function seaMossGelSupplementEntries(): { match: RegExp; info: SupplementInfo }[] {
  const byId: Record<
    string,
    { match: RegExp; uniqueBenefits: SupplementBenefit[] }
  > = {
    original: {
      match: /original\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Boosts Energy & Vitality", text: "Supports healthy energy levels with naturally occurring iodine, iron, and B-vitamins from wildcrafted sea moss." },
        { label: "Supports Joint & Bone Health", text: "Mineral-dense nourishment including calcium and magnesium to support joint and bone wellness." },
        { label: "Clears Excess Mucus", text: "The gel's mucilage properties help soothe and clear excess mucus as part of a daily wellness ritual." },
      ],
    },
    "healthy-heart": {
      match: /healthy\s*heart\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Supports Heart Function", text: "Crafted with intention to support cardiovascular wellness as part of a daily ritual." },
        { label: "Boosts Circulation", text: "Formulated to support healthy circulation and the flow of nutrients throughout the body." },
        { label: "Increases Energy & Vitality", text: "Mineral-rich sea moss helps support sustained energy without relying on stimulants." },
      ],
    },
    "cell-defender": {
      match: /cell\s*defender\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Enhances Wellness at a Cellular Level", text: "Promotes cellular wellness with a mineral-dense blend of vitamins and trace elements." },
        { label: "Encourages Healthy Antioxidant Levels & Detoxification", text: "Supports the body's natural antioxidant and detoxification pathways." },
        { label: "Fights Against Malignant Cell Growth", text: "Formulated as part of a holistic defense strategy for long-term vitality." },
      ],
    },
    "iron-goddess": {
      match: /iron\s*goddess\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Non-Heme Iron Support", text: "Provides non-heme iron from sea moss to support the body's natural iron needs as part of a balanced diet." },
        { label: "Mineral Density", text: "Packed with 92 trace minerals including iron, iodine, and zinc for comprehensive body support." },
        { label: "Whole-Body Nourishment", text: "Crafted for women and anyone seeking plant-based mineral nourishment for daily wellness." },
      ],
    },
    "immune-booster": {
      match: /immune\s*booster\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Improves Respiratory Function", text: "Formulated to improve respiratory function and support clear, comfortable breathing." },
        { label: "Decreases Histamine Response", text: "Supports allergy wellness by helping the body manage histamine response naturally." },
        { label: "Clears Excess Mucus", text: "The gel's mucilage properties help soothe and clear mucus as part of a holistic wellness routine." },
      ],
    },
    "fulton-gregory-detox": {
      match: /fulton\s*gregory\s*detox\s*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Cleansing Support", text: "Aids in cleansing the body as part of a fasting or detox wellness protocol." },
        { label: "Mental Clarity", text: "Supports clarity and focus during periods of intentional detox and renewal." },
        { label: "Revitalization", text: "Helps revitalize the body with mineral-rich nourishment during fasting and detox routines." },
      ],
    },
    "peaceful-moon-cycle": {
      match: /peaceful\s*moon\s*cycle.*sea\s*moss\s*gel/i,
      uniqueBenefits: [
        { label: "Supports Healthy Hormone Balance", text: "Formulated to support women's hormonal balance as part of a daily holistic wellness practice." },
        { label: "Promotes Emotional Ease", text: "Mineral-rich sea moss nourishes the body to support mood stability and emotional wellness." },
        { label: "Reduces Cramping & Bloating", text: "Crafted to support menstrual comfort and ease during your cycle." },
      ],
    },
  };

  return SEA_MOSS_GELS.map((gel) => {
    const entry = byId[gel.id];
    return {
      match: entry.match,
      info: {
        intro: seaMossJarIntro(gel.tagline),
        benefits: [...entry.uniqueBenefits, ...SEA_MOSS_SHARED_BENEFITS],
        note: SEA_MOSS_FDA_NOTE,
      },
    };
  });
}

const DEODORANT_DISCLAIMER =
  "For external use only. Perform a patch test on the inner arm before full application. Discontinue use if irritation occurs.";

const DEODORANT_BASE_INGREDIENTS =
  "Cocos Nucifera (Coconut) Oil, Cera Alba (Beeswax), Maranta Arundinacea (Arrowroot) Root Powder, Sodium Bicarbonate (Baking Soda), Melaleuca Alternifolia (Tea Tree) Leaf Oil";

const SUPPLEMENTS: { match: RegExp; info: SupplementInfo }[] = [
  {
    match: /sandalwood\s*&\s*teakwood\s*deodorant/i,
    info: {
      intro:
        "Khomplete Khemistri Elements Sandalwood & Teakwood Deodorant is a natural aluminum-free stick (2.5 oz) with a warm, woodsy scent.",
      benefits: [
        {
          label: "Ingredients",
          text: `${DEODORANT_BASE_INGREDIENTS}, Santalum Album (Sandalwood) Oil, Tectona Grandis (Teakwood) Oil.`,
        },
      ],
      note: DEODORANT_DISCLAIMER,
      heading: "Product Details",
    },
  },
  {
    match: /lavender\s*deodorant/i,
    info: {
      intro:
        "Khomplete Khemistri Elements Lavender Deodorant is a natural aluminum-free stick (2.5 oz) with a calming floral scent.",
      benefits: [
        {
          label: "Ingredients",
          text: `${DEODORANT_BASE_INGREDIENTS}, Lavandula Angustifolia (Lavender) Oil.`,
        },
      ],
      note: DEODORANT_DISCLAIMER,
      heading: "Product Details",
    },
  },
  {
    match: /natural\s*spring\s*water/i,
    info: {
      intro:
        "Don’t just hydrate—upgrade your chemistry. Khomplete Khemistri Natural Spring Water is 100% natural spring water, sourced from the earth’s own filtration system—not a city facility.",
      benefits: [
        {
          label: "True Purity",
          text: "No industrial processing, no chemical recycling—just as nature intended. Not recycled, processed tap water with a fancy brand name.",
        },
        {
          label: "The Element of Life",
          text: "Pure H2O that supports your body’s health and your skin’s vitality from the inside out.",
        },
        {
          label: "Elite Quality",
          text: "A premium, naturally sourced water that stands above mass-produced bottled water stripped of its natural character.",
        },
        {
          label: "Taste the Difference",
          text: "The average person might settle for tap water in a bottle—you aren’t the average person. Choose hydration with natural character.",
        },
      ],
    },
  },
  ...seaMossGelSupplementEntries(),
  {
    // Fallback for any other sea moss gel listing.
    match: /sea\s*moss\s*gel/i,
    info: {
      intro:
        "Wildcrafted Irish sea moss gel is a holistic 16 oz jar rich in vitamins and minerals (including iodine, iron, and calcium). Each blend is crafted with intention to serve a deeper purpose in supporting your health — stir into smoothies, tea, or recipes as part of your daily wellness ritual.",
      benefits: [
        {
          label: "Holistic Wellness",
          text: "Crafted with intention to nourish body, mind, and vitality — not merely as a supplement but as purposeful daily nourishment.",
        },
        {
          label: "Thyroid Support",
          text: "Natural iodine from sea moss helps the thyroid produce hormones that regulate metabolism, energy, and body temperature.",
        },
        {
          label: "Gut Health",
          text: "The gel’s mucilage and prebiotic fiber help feed beneficial gut bacteria and support regularity and nutrient absorption.",
        },
        {
          label: "Immune Wellness",
          text: "Vitamins, minerals, and plant compounds in sea moss support everyday immune defenses and overall vitality.",
        },
      ],
      note:
        "These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.",
    },
  },
  {
    match: /sea\s*moss/i,
    info: {
      intro:
        "Sea moss capsules offer a concentrated source of 92 minerals (including iodine, iron, and zinc) and are primarily used to support thyroid function, gut health, and immune response.",
      benefits: [
        {
          label: "Thyroid Support",
          text: "The high iodine content helps the thyroid produce hormones that regulate metabolism, energy, and body temperature.",
        },
        {
          label: "Gut Health",
          text: "Capsules provide prebiotic fiber and mucilage that feed beneficial gut bacteria, potentially improving digestion and relieving symptoms of IBS.",
        },
        {
          label: "Energy Levels",
          text: "Iron supports red blood cell production and oxygen transport, while B-vitamins help convert food into energy, reducing fatigue.",
        },
        {
          label: "Immune System",
          text: "Bioactive compounds like sulfated polysaccharides and zinc exhibit antiviral and antimicrobial properties that may strengthen immune defenses.",
        },
        {
          label: "Skin Health",
          text: "Sulfur and vitamins A, C, and E support collagen synthesis, reduce inflammation, and may help with conditions like acne or eczema.",
        },
      ],
    },
  },
  {
    match: /magnesium/i,
    info: {
      benefits: [
        {
          label: "Sleep and Relaxation",
          text: "Glycine acts as an inhibitory neurotransmitter, promoting calm and supporting melatonin production for improved sleep quality.",
        },
        {
          label: "Muscle and Nerve Support",
          text: "It aids in muscle relaxation, reduces cramps, and supports proper nerve transmission without digestive distress.",
        },
        {
          label: "Bone and Metabolic Health",
          text: "It supports bone density, blood sugar regulation, and heart health, making it suitable for long-term wellness.",
        },
      ],
      note:
        "For most adults, a dosage of 200–350 mg of elemental magnesium daily is recommended, often taken in the evening to leverage its calming properties. It is particularly well-tolerated for individuals with sensitive digestive systems or those seeking relief from anxiety and insomnia.",
    },
  },
  {
    match: /co\s*-?q\s*-?10|coenzyme\s*q10|ubiquinol|ubiquinone/i,
    info: {
      benefits: [
        {
          label: "Energy Production",
          text: "CoQ10 is a critical cofactor in the mitochondrial electron transport chain, facilitating the synthesis of adenosine triphosphate (ATP), the body's primary energy source.",
        },
        {
          label: "Antioxidant Activity",
          text: "It protects cell membranes and lipoproteins from oxidative stress by neutralizing free radicals and regenerating other antioxidants like Vitamin E.",
        },
        {
          label: "Health Support",
          text: "Research suggests potential benefits for congestive heart failure, migraine prevention, and statin-induced muscle pain, though evidence for other conditions like Parkinson's disease remains inconclusive.",
        },
        {
          label: "Sources",
          text: "The body produces most CoQ10, but it can also be obtained from oily fish (salmon, tuna), organ meats (liver), nuts, seeds, and vegetable oils.",
        },
        {
          label: "Supplementation",
          text: "Available as ubiquinone (oxidized) or ubiquinol (reduced), supplements are typically taken at 30–200 mg daily. Absorption is enhanced when taken with meals containing fat.",
        },
      ],
      note:
        "Generally safe with mild side effects like digestive upset; however, it may interact with blood thinners (e.g., warfarin) and reduce the effectiveness of chemotherapy. Consult a healthcare provider before use, especially during pregnancy or while on medication.",
    },
  },
  {
    match: /beet/i,
    info: {
      intro:
        "Beetroot supplements primarily offer benefits for cardiovascular health and exercise performance due to their high nitrate content, which the body converts into nitric oxide. Nitric oxide acts as a vasodilator, relaxing blood vessels to lower blood pressure, improve circulation, and enhance oxygen efficiency in muscles.",
      benefits: [
        {
          label: "Blood Pressure Reduction",
          text: "Clinical meta-analyses show beetroot supplementation can reduce systolic blood pressure by 3–5 mmHg, particularly in individuals with hypertension.",
        },
        {
          label: "Enhanced Athletic Performance",
          text: "Supplements improve endurance and stamina by optimizing mitochondrial efficiency and oxygen delivery, with effects most pronounced in aerobic activities like running and cycling.",
        },
        {
          label: "Reduced Inflammation and Oxidative Stress",
          text: "The pigment betalains in beets provide potent antioxidant and anti-inflammatory effects, which may aid in muscle recovery and reduce post-exercise soreness.",
        },
        {
          label: "Improved Endothelial Function",
          text: "Regular use supports the health of blood vessel linings, improving flow-mediated dilation and overall vascular flexibility.",
        },
      ],
      note:
        "While beetroot powder and capsules offer convenience and concentrated nitrates, they lack the fiber found in whole beets, which is beneficial for digestion and blood sugar control. Supplementation is generally safe but should be approached with caution by individuals with low blood pressure, kidney stone risks (due to oxalates), or those taking nitrate-based or antihypertensive medications.",
    },
  },
  {
    match: /arginine/i,
    info: {
      intro:
        "L-arginine is a conditionally essential amino acid that serves as a precursor for nitric oxide (NO) production, which helps dilate blood vessels and improve blood flow. While the body typically synthesizes sufficient amounts, supplements are often used to support heart health, manage high blood pressure, alleviate angina, and treat erectile dysfunction.",
      benefits: [
        {
          label: "Heart & Circulation",
          text: "Commonly used to improve circulation in conditions like peripheral arterial disease and to support heart health, blood pressure management, angina relief, and erectile dysfunction.",
        },
        {
          label: "Athletic Performance",
          text: "May potentially aid athletic performance, though the evidence for exercise benefits is mixed.",
        },
        {
          label: "Natural Sources",
          text: "It is naturally found in protein-rich foods such as meat, fish, dairy, nuts, and legumes.",
        },
      ],
      note:
        "Potential side effects include nausea, bloating, diarrhea, and headaches. It can interact dangerously with blood pressure medications, nitrates, and erectile dysfunction drugs (like sildenafil) by causing excessive hypotension. It is also not recommended for individuals who have recently had a heart attack.",
    },
  },
  {
    match: /brain/i,
    info: {
      intro:
        "Brain Support Complex is a nootropic supplement designed to enhance memory, focus, and mental clarity without the use of stimulants or caffeine. These formulations typically combine ingredients like Ginkgo Biloba, Bacopa Monnieri, Phosphatidylserine, and Huperzine-A to support cognitive function and protect brain cells.",
      benefits: [
        {
          label: "Memory & Recall",
          text: "Formulated to support memory retention and recall for sharper day-to-day thinking.",
        },
        {
          label: "Focus & Mental Clarity",
          text: "Supports focus, mental agility, and clear thinking without stimulants or caffeine.",
        },
        {
          label: "Combats Mental Fatigue & Brain Fog",
          text: "Helps reduce mental fatigue and brain fog to support sustained cognitive performance.",
        },
        {
          label: "Brain Cell Protection",
          text: "Nootropic ingredients like Ginkgo Biloba, Bacopa Monnieri, Phosphatidylserine, and Huperzine-A support cognitive function and help protect brain cells.",
        },
      ],
      note:
        "Caffeine-free and suitable for adults, students, and seniors seeking sharper thinking. A typical dose is one to two capsules daily.",
    },
  },
  {
    match: /bcaa/i,
    info: {
      intro:
        "BCAAs (branched-chain amino acids) support muscle growth and exercise recovery and have several research-backed uses.",
      benefits: [
        {
          label: "Muscle Growth",
          text: "May help promote muscle growth.",
        },
        {
          label: "Less Soreness",
          text: "May ease muscle soreness after exercise.",
        },
        {
          label: "Reduced Fatigue",
          text: "May help you feel less exercise fatigue.",
        },
        {
          label: "Prevent Muscle Wasting",
          text: "May help prevent muscle wasting.",
        },
        {
          label: "Appetite Support",
          text: "May boost your appetite if you're malnourished or have cancer.",
        },
        {
          label: "Additional Clinical Uses",
          text: "May ease symptoms of tardive dyskinesia and of hepatic encephalopathy due to cirrhosis, help protect people with cirrhosis from getting liver cancer, treat certain brain disorders, and improve mental function in people with phenylketonuria.",
        },
      ],
    },
  },
  {
    match: /turmeric/i,
    info: {
      intro:
        "Turmeric paired with BioPerine (black pepper extract) dramatically improves the absorption of curcumin, turmeric's active compound.",
      benefits: [
        {
          label: "Massive Absorption Boost",
          text: "Studies indicate that piperine can increase curcumin bioavailability by up to 2000%, making supplements far more effective than turmeric alone.",
        },
        {
          label: "Enhanced Anti-Inflammatory Support",
          text: "Improved absorption allows for better management of joint health, arthritis symptoms, and general inflammation.",
        },
        {
          label: "Antioxidant Protection",
          text: "Higher bioavailability enables curcumin to more effectively scavenge free radicals and reduce oxidative stress.",
        },
        {
          label: "Additional BioPerine Benefits",
          text: "BioPerine itself possesses antioxidant properties and may enhance the absorption of other nutrients like CoQ10 and iron.",
        },
      ],
      note:
        "For optimal results, supplements typically contain 1000 mg of curcumin extract alongside 5–10 mg of BioPerine. Taking the supplement with a meal containing fat further aids digestion and absorption.",
    },
  },
  {
    match: /k2/i,
    info: {
      intro:
        "Vitamin D3 (cholecalciferol) helps your body absorb calcium, while vitamin K2 makes sure that calcium goes to your bones and teeth instead of building up in your arteries. Taken together, they work as a team for stronger bones and a healthier heart.",
      benefits: [
        {
          label: "Better Calcium Absorption",
          text: "Vitamin D3 helps your body absorb more calcium from the food you eat.",
        },
        {
          label: "Directs Calcium Where It Belongs",
          text: "Vitamin K2 helps transport that calcium to your bones and teeth rather than letting it sit in your arteries and other soft tissues.",
        },
        {
          label: "Stronger Bones",
          text: "Supports bone growth and remodeling, helping lower the risk of osteoporosis.",
        },
        {
          label: "Heart Health",
          text: "By keeping calcium out of your arteries, the pair helps keep your heart healthy and lower the risk of heart disease.",
        },
        {
          label: "Everyday Body Functions",
          text: "Vitamin D3 also supports muscle contractions and converting food into energy, while K2 supports healthy blood clotting.",
        },
      ],
      note:
        "Deficiencies in both vitamins are widespread and hard to correct through diet alone — especially K2, which isn't found in many commonly eaten foods — which is why they're often taken together as a supplement.",
    },
  },
  {
    match: /creatine/i,
    info: {
      intro:
        "Creatine monohydrate is the most researched and effective dietary supplement for increasing phosphocreatine stores in skeletal muscles, which enhances energy production (ATP) during short-duration, high-intensity exercises like weightlifting and sprinting.",
      benefits: [
        {
          label: "Strength & Power",
          text: "Widely used to improve muscle strength, power, and lean body mass when combined with resistance training.",
        },
        {
          label: "Energy for High-Intensity Exercise",
          text: "Boosts phosphocreatine stores to fuel short bursts of intense effort like weightlifting and sprinting.",
        },
        {
          label: "Cognitive Benefits",
          text: "May also offer cognitive benefits such as improved memory and reduced mental fatigue, particularly in older adults or those under stress.",
        },
      ],
      note:
        "The standard protocol is a maintenance dose of 3–5 grams daily; some users do a loading phase of 20 grams per day (split into four doses) for 5–7 days to saturate muscles faster. Generally safe for healthy individuals, though it can cause temporary water retention and weight gain. Not recommended for those with pre-existing kidney disease, or those pregnant or breastfeeding, without medical supervision.",
    },
  },
  {
    match: /ashwagandha/i,
    info: {
      intro:
        "Pairing ashwagandha with black pepper (piperine) improves how much of the ashwagandha your body actually absorbs, making each dose more effective.",
      benefits: [
        {
          label: "Increased Absorption",
          text: "Piperine can significantly boost the amount of ashwagandha that reaches circulation, making each dose more effective.",
        },
        {
          label: "Enhanced Stress Relief",
          text: "Higher bioavailability leads to more potent regulation of cortisol and improved management of stress and anxiety.",
        },
        {
          label: "Improved Efficacy",
          text: "Users may experience faster and more noticeable benefits for sleep, mood, and energy levels compared to ashwagandha alone.",
        },
        {
          label: "Optimized Dosage",
          text: "Because absorption is improved, lower doses may be as effective as higher doses of non-enhanced ashwagandha.",
        },
      ],
      note:
        "Research suggests 5–20 mg of piperine per serving is the effective range for enhancing bioavailability. However, piperine can interact with medications metabolized by the CYP3A4 enzyme system, so individuals on prescription drugs should consult a healthcare provider before use.",
    },
  },
  {
    match: /acai/i,
    info: {
      intro:
        "Acai Berry Complex is a dietary blend designed to support healthy bowel movements, antioxidant protection, and daily wellness. These blends typically combine acai berry fruit extract with digestive aids like psyllium powder, inulin, and slippery elm bark.",
      benefits: [
        {
          label: "Digestive Support",
          text: "Digestive aids like psyllium powder, inulin, and slippery elm bark help support healthy, regular bowel movements.",
        },
        {
          label: "Antioxidant Protection",
          text: "Acai is a nutrient-dense superfruit rich in anthocyanins, supporting antioxidant intake and daily wellness.",
        },
        {
          label: "Nutrient-Rich Blend",
          text: "Often contains acai berry, psyllium powder, inulin, slippery elm bark, aloe ferox powder, chlorella, black walnut hulls, ginger root, and lycopene.",
        },
        {
          label: "Detox & Energy Support",
          text: "Commonly used to support detoxification, energy levels, and immune health.",
        },
      ],
      note:
        "Many versions are produced in USA-based, FDA-registered and GMP-certified facilities with third-party lab testing, and are typically Non-GMO, vegan-friendly, vegetarian, and lactose-free.",
    },
  },
];

export function getSupplementInfo(title?: string | null): SupplementInfo | undefined {
  if (!title) return undefined;
  return SUPPLEMENTS.find((s) => s.match.test(title))?.info;
}
