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
];

export function getSupplementInfo(title?: string | null): SupplementInfo | undefined {
  if (!title) return undefined;
  return SUPPLEMENTS.find((s) => s.match.test(title))?.info;
}
