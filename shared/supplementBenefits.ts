export interface SupplementBenefit {
  label: string;
  text: string;
}

export interface SupplementInfo {
  intro?: string;
  benefits: SupplementBenefit[];
  note?: string;
}

const SUPPLEMENTS: { match: RegExp; info: SupplementInfo }[] = [
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
];

export function getSupplementInfo(title?: string | null): SupplementInfo | undefined {
  if (!title) return undefined;
  return SUPPLEMENTS.find((s) => s.match.test(title))?.info;
}
