/** Auto-generated from shared/fuelPerks.ts — run: npx tsx scripts/sync-fuel-perks-config.mjs */
module.exports = {
  "platform": {
    "platformName": "The FR2P Club Fuel Rewards",
    "shortName": "Fuel Rewards",
    "tagline": "Save at the Pump. Earn While You Drive.",
    "badge": "Affiliate Marketing Program · Standalone or Inside The FR2P Club"
  },
  "programType": "Affiliate marketing program — this is not crowdfunding, an investment, or a guaranteed income opportunity.",
  "payoutExplainer": {
    "howMoneyFlows": [
      "A new partner selects a Fuel Rewards tier and pays their subscription through Stripe (secure checkout).",
      "Subscription revenue goes into the platform operating account — commissions are allocated from this pool, not from anyone's personal pocket.",
      "When someone joins through your referral link and pays their subscription, you may earn a potential recurring commission based on your tier level and their active status.",
      "Payouts are processed through the platform payment system (Stripe) once commissions meet the minimum threshold and holding period.",
      "Results vary. Your potential recurring earnings depend on how many active referrals you build and maintain — there are no income guarantees."
    ],
    "notCrowdfunding": "Fuel Rewards is not crowdfunding. You are not investing in a project or buying equity. You are joining an affiliate marketing program where potential recurring commissions may come from referral activity funded by subscription revenue.",
    "stripeRole": "Stripe handles all membership payments and payout processing. The FR2P Club does not manually pay affiliates out of pocket — commissions come from the subscription revenue pool the platform collects."
  },
  "tiers": [
    {
      "id": "member",
      "name": "Member Access",
      "tag": "Included with FR2P",
      "price": "Included",
      "priceDisplay": "Free",
      "monthlyCost": "$0",
      "annualCost": "$0",
      "billingNote": "Included with active The FR2P Club membership — no additional monthly fee.",
      "description": "Get started with fuel savings and your personal referral link — included free with any active The FR2P Club membership.",
      "earnDescription": "Potential for recurring affiliate commissions on Fuel Rewards signups through your link — based on your activity and active referrals. No income guarantees.",
      "potentialCommissionLabel": "Base potential recurring share",
      "potentialCommissionDetail": "Lower potential recurring commission rate than paid tiers. You may earn a base share when referrals you bring in pay their active Fuel Rewards subscription.",
      "vsTierBelow": null,
      "vsTierAbove": "Starter ($19.99/mo) adds a higher potential recurring commission rate, a basic business card template, and starter partner tools.",
      "monthlyIncludes": [
        "Personal Fuel Rewards referral link",
        "Fuel savings program access each month",
        "Program overview & affiliate training",
        "Share your link via text, email, or social media"
      ],
      "annualIncludes": [
        "12 months of referral link access (with active FR2P membership)",
        "12 months of fuel savings program access",
        "Ongoing training resources throughout the year",
        "Option to upgrade to a paid tier anytime for higher potential recurring commissions"
      ],
      "features": [
        "Referral link & fuel savings access",
        "Basic program training",
        "Upgrade anytime for higher potential recurring commissions"
      ],
      "featured": false,
      "hasMarketingBackOffice": false,
      "isPaidTier": false
    },
    {
      "id": "starter",
      "name": "Starter Partner",
      "tag": "Tier 1 · $19.99 / Month",
      "price": "$19.99",
      "priceDisplay": "$19.99",
      "monthlyCost": "$19.99",
      "annualCost": "$239.88",
      "billingNote": "Billed $19.99 every month · $239.88 if paid monthly for 12 months. Cancel anytime.",
      "description": "Your entry into Fuel Rewards affiliate marketing — referral tools, fuel savings, and starter marketing materials every month.",
      "earnDescription": "Higher potential recurring commission rate than Member Access. You may earn a starter-level share when your direct referrals maintain active paid subscriptions.",
      "potentialCommissionLabel": "~15% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $19.99/mo, your potential recurring commission could be approximately $3.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to free Member Access: higher potential recurring commission rate, basic business card template, and starter partner training.",
      "vsTierAbove": "Pro ($29.99/mo) adds the full Marketing Back Office, HiHello, GotPrint/VistaPrint guides, gas pump QR templates, and a higher potential recurring commission rate (~20%).",
      "monthlyIncludes": [
        "Personal Fuel Rewards referral link (active every month)",
        "Fuel savings program access for you and referrals",
        "Starter-level potential recurring commission rate (~15% share)",
        "Monthly program updates & training resources",
        "Basic business card template — download & print",
        "Share referral link via text, email & social media"
      ],
      "annualIncludes": [
        "12 months of referral link & fuel savings access ($239.88 total if billed monthly)",
        "12 months of starter-level potential recurring commission eligibility on active referrals",
        "12 months of training updates & business card template access",
        "Potential to build a recurring referral base over the full year — results vary"
      ],
      "features": [
        "Fuel savings + referral link",
        "~15% potential recurring commission share",
        "Basic business card template",
        "Monthly training resources"
      ],
      "featured": false,
      "hasMarketingBackOffice": false,
      "isPaidTier": true,
      "monthlyFee": 19.99,
      "centsPerGallon": 5,
      "bestFor": "Light drivers getting started with affiliate marketing"
    },
    {
      "id": "pro",
      "name": "Pro Partner",
      "tag": "Tier 2 · $29.99 / Month",
      "price": "$29.99",
      "priceDisplay": "$29.99",
      "monthlyCost": "$29.99",
      "annualCost": "$359.88",
      "billingNote": "Billed $29.99 every month · $359.88 if paid monthly for 12 months. Includes Marketing Back Office.",
      "description": "Full Marketing Back Office every month — business cards, postcards, HiHello digital QR card, gas pump signs, and print vendor guides.",
      "earnDescription": "Enhanced potential recurring commission rate (~20%) plus full Marketing Back Office. More tools to market locally may increase your potential for building active referrals.",
      "potentialCommissionLabel": "~20% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $29.99/mo, your potential recurring commission could be approximately $6.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to Starter ($19.99): adds full Marketing Back Office & Marketing Tools, HiHello (App Store & Google Play), GotPrint/VistaPrint guides, gas pump QR templates, and ~5% higher potential recurring commission share.",
      "vsTierAbove": "Elite Premium ($39.99/mo) adds car magnet templates, gas station partnership toolkit, Elite badge, dedicated support, and the highest potential recurring commission rate (~25%).",
      "monthlyIncludes": [
        "Full Marketing Back Office & Marketing Tools — every month",
        "Customize & print business cards and postcards",
        "HiHello digital business card app — iPhone (Apple App Store) & Android (Google Play Store)",
        "Add your name, role, phone & Fuel Rewards referral link in HiHello",
        "Share HiHello QR via text, email, Bluetooth, WhatsApp & more",
        "Gas pump QR sign templates for station partnerships",
        "GotPrint.com ordering guide — postcards starting at $49",
        "VistaPrint ordering guide — bulk business cards & large print runs",
        "~20% potential recurring commission rate on active direct referrals"
      ],
      "annualIncludes": [
        "12 months of Marketing Back Office & all marketing tools ($359.88 total if billed monthly)",
        "12 months of HiHello, GotPrint & VistaPrint partner access & guides",
        "12 months of enhanced potential recurring commission eligibility (~20% share)",
        "12 months of gas pump QR templates & print material customization",
        "Potential to compound recurring referral income over the year — results vary, not guaranteed"
      ],
      "features": [
        "Marketing Back Office + Marketing Tools",
        "HiHello app (App Store & Google Play)",
        "GotPrint.com & VistaPrint partners",
        "~20% potential recurring commission share"
      ],
      "featured": false,
      "hasMarketingBackOffice": true,
      "isPaidTier": true,
      "monthlyFee": 29.99,
      "centsPerGallon": 8,
      "bestFor": "Daily commuters — most popular",
      "mostPopular": true
    },
    {
      "id": "elite",
      "name": "Elite Premium",
      "tag": "Tier 3 · $39.99 / Month · Top Tier",
      "price": "$39.99",
      "priceDisplay": "$39.99",
      "monthlyCost": "$39.99",
      "annualCost": "$479.88",
      "billingNote": "Billed $39.99 every month · $479.88 if paid monthly for 12 months. Highest potential recurring commission rate.",
      "description": "The ultimate Fuel Rewards partner package — everything in Pro plus car magnets, station toolkit, and the highest potential recurring commission rate.",
      "earnDescription": "Highest potential recurring commission rate (~25%) on the platform. All Pro tools plus Elite field marketing resources to maximize your potential for building active referrals.",
      "potentialCommissionLabel": "~25% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $39.99/mo, your potential recurring commission could be approximately $10.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to Pro ($29.99): adds car magnet templates, gas station partnership playbook, Elite partner badge, dedicated support, and ~5% higher potential recurring commission share (~25% vs ~20%).",
      "vsTierAbove": null,
      "monthlyIncludes": [
        "Everything in Pro Partner ($29.99) — every month",
        "Full Marketing Back Office & all Marketing Tools unlocked",
        "HiHello digital business card (Apple App Store · Google Play Store)",
        "Car magnet marketing templates — rolling advertisement on your vehicle",
        "Gas station partnership playbook & pump QR toolkit",
        "GotPrint.com — postcards from $49 · VistaPrint — bulk print runs",
        "~25% potential recurring commission rate — highest tier share",
        "Elite partner badge & dedicated Elite support channel"
      ],
      "annualIncludes": [
        "12 months of all Pro + Elite marketing tools ($479.88 total if billed monthly)",
        "12 months of highest-tier potential recurring commission eligibility (~25% share)",
        "12 months of car magnet, station partnership & field marketing resources",
        "12 months of Elite partner recognition & support",
        "Maximum potential to build recurring referral income over the year — results vary, not guaranteed"
      ],
      "features": [
        "All Pro Marketing Back Office tools",
        "HiHello · GotPrint · VistaPrint included",
        "~25% potential recurring commission share (highest)",
        "Car magnets & station partnership toolkit"
      ],
      "featured": true,
      "hasMarketingBackOffice": true,
      "isPaidTier": true,
      "monthlyFee": 39.99,
      "centsPerGallon": 12,
      "bestFor": "Maximum savings & affiliate growth"
    }
  ],
  "paidTiers": [
    {
      "id": "starter",
      "name": "Starter Partner",
      "tag": "Tier 1 · $19.99 / Month",
      "price": "$19.99",
      "priceDisplay": "$19.99",
      "monthlyCost": "$19.99",
      "annualCost": "$239.88",
      "billingNote": "Billed $19.99 every month · $239.88 if paid monthly for 12 months. Cancel anytime.",
      "description": "Your entry into Fuel Rewards affiliate marketing — referral tools, fuel savings, and starter marketing materials every month.",
      "earnDescription": "Higher potential recurring commission rate than Member Access. You may earn a starter-level share when your direct referrals maintain active paid subscriptions.",
      "potentialCommissionLabel": "~15% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $19.99/mo, your potential recurring commission could be approximately $3.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to free Member Access: higher potential recurring commission rate, basic business card template, and starter partner training.",
      "vsTierAbove": "Pro ($29.99/mo) adds the full Marketing Back Office, HiHello, GotPrint/VistaPrint guides, gas pump QR templates, and a higher potential recurring commission rate (~20%).",
      "monthlyIncludes": [
        "Personal Fuel Rewards referral link (active every month)",
        "Fuel savings program access for you and referrals",
        "Starter-level potential recurring commission rate (~15% share)",
        "Monthly program updates & training resources",
        "Basic business card template — download & print",
        "Share referral link via text, email & social media"
      ],
      "annualIncludes": [
        "12 months of referral link & fuel savings access ($239.88 total if billed monthly)",
        "12 months of starter-level potential recurring commission eligibility on active referrals",
        "12 months of training updates & business card template access",
        "Potential to build a recurring referral base over the full year — results vary"
      ],
      "features": [
        "Fuel savings + referral link",
        "~15% potential recurring commission share",
        "Basic business card template",
        "Monthly training resources"
      ],
      "featured": false,
      "hasMarketingBackOffice": false,
      "isPaidTier": true,
      "monthlyFee": 19.99,
      "centsPerGallon": 5,
      "bestFor": "Light drivers getting started with affiliate marketing"
    },
    {
      "id": "pro",
      "name": "Pro Partner",
      "tag": "Tier 2 · $29.99 / Month",
      "price": "$29.99",
      "priceDisplay": "$29.99",
      "monthlyCost": "$29.99",
      "annualCost": "$359.88",
      "billingNote": "Billed $29.99 every month · $359.88 if paid monthly for 12 months. Includes Marketing Back Office.",
      "description": "Full Marketing Back Office every month — business cards, postcards, HiHello digital QR card, gas pump signs, and print vendor guides.",
      "earnDescription": "Enhanced potential recurring commission rate (~20%) plus full Marketing Back Office. More tools to market locally may increase your potential for building active referrals.",
      "potentialCommissionLabel": "~20% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $29.99/mo, your potential recurring commission could be approximately $6.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to Starter ($19.99): adds full Marketing Back Office & Marketing Tools, HiHello (App Store & Google Play), GotPrint/VistaPrint guides, gas pump QR templates, and ~5% higher potential recurring commission share.",
      "vsTierAbove": "Elite Premium ($39.99/mo) adds car magnet templates, gas station partnership toolkit, Elite badge, dedicated support, and the highest potential recurring commission rate (~25%).",
      "monthlyIncludes": [
        "Full Marketing Back Office & Marketing Tools — every month",
        "Customize & print business cards and postcards",
        "HiHello digital business card app — iPhone (Apple App Store) & Android (Google Play Store)",
        "Add your name, role, phone & Fuel Rewards referral link in HiHello",
        "Share HiHello QR via text, email, Bluetooth, WhatsApp & more",
        "Gas pump QR sign templates for station partnerships",
        "GotPrint.com ordering guide — postcards starting at $49",
        "VistaPrint ordering guide — bulk business cards & large print runs",
        "~20% potential recurring commission rate on active direct referrals"
      ],
      "annualIncludes": [
        "12 months of Marketing Back Office & all marketing tools ($359.88 total if billed monthly)",
        "12 months of HiHello, GotPrint & VistaPrint partner access & guides",
        "12 months of enhanced potential recurring commission eligibility (~20% share)",
        "12 months of gas pump QR templates & print material customization",
        "Potential to compound recurring referral income over the year — results vary, not guaranteed"
      ],
      "features": [
        "Marketing Back Office + Marketing Tools",
        "HiHello app (App Store & Google Play)",
        "GotPrint.com & VistaPrint partners",
        "~20% potential recurring commission share"
      ],
      "featured": false,
      "hasMarketingBackOffice": true,
      "isPaidTier": true,
      "monthlyFee": 29.99,
      "centsPerGallon": 8,
      "bestFor": "Daily commuters — most popular",
      "mostPopular": true
    },
    {
      "id": "elite",
      "name": "Elite Premium",
      "tag": "Tier 3 · $39.99 / Month · Top Tier",
      "price": "$39.99",
      "priceDisplay": "$39.99",
      "monthlyCost": "$39.99",
      "annualCost": "$479.88",
      "billingNote": "Billed $39.99 every month · $479.88 if paid monthly for 12 months. Highest potential recurring commission rate.",
      "description": "The ultimate Fuel Rewards partner package — everything in Pro plus car magnets, station toolkit, and the highest potential recurring commission rate.",
      "earnDescription": "Highest potential recurring commission rate (~25%) on the platform. All Pro tools plus Elite field marketing resources to maximize your potential for building active referrals.",
      "potentialCommissionLabel": "~25% potential recurring share",
      "potentialCommissionDetail": "Illustrative example only: if a referral pays $39.99/mo, your potential recurring commission could be approximately $10.00/mo per active referral at this tier. Actual amounts vary — not guaranteed.",
      "vsTierBelow": "Compared to Pro ($29.99): adds car magnet templates, gas station partnership playbook, Elite partner badge, dedicated support, and ~5% higher potential recurring commission share (~25% vs ~20%).",
      "vsTierAbove": null,
      "monthlyIncludes": [
        "Everything in Pro Partner ($29.99) — every month",
        "Full Marketing Back Office & all Marketing Tools unlocked",
        "HiHello digital business card (Apple App Store · Google Play Store)",
        "Car magnet marketing templates — rolling advertisement on your vehicle",
        "Gas station partnership playbook & pump QR toolkit",
        "GotPrint.com — postcards from $49 · VistaPrint — bulk print runs",
        "~25% potential recurring commission rate — highest tier share",
        "Elite partner badge & dedicated Elite support channel"
      ],
      "annualIncludes": [
        "12 months of all Pro + Elite marketing tools ($479.88 total if billed monthly)",
        "12 months of highest-tier potential recurring commission eligibility (~25% share)",
        "12 months of car magnet, station partnership & field marketing resources",
        "12 months of Elite partner recognition & support",
        "Maximum potential to build recurring referral income over the year — results vary, not guaranteed"
      ],
      "features": [
        "All Pro Marketing Back Office tools",
        "HiHello · GotPrint · VistaPrint included",
        "~25% potential recurring commission share (highest)",
        "Car magnets & station partnership toolkit"
      ],
      "featured": true,
      "hasMarketingBackOffice": true,
      "isPaidTier": true,
      "monthlyFee": 39.99,
      "centsPerGallon": 12,
      "bestFor": "Maximum savings & affiliate growth"
    }
  ],
  "featureGuides": [
    {
      "id": "community-fuel-pool",
      "title": "Community Fuel Pool",
      "subtitle": "How subscription revenue funds your potential recurring commissions",
      "steps": [
        "When a new partner picks a Fuel Rewards tier, they pay their monthly subscription through Stripe — secure checkout, no cash handled by you.",
        "That subscription revenue goes into the platform operating account. This is the community fuel pool that commissions are paid from — not from anyone's personal pocket.",
        "When someone joins through your referral link and keeps an active paid subscription, you may earn a potential recurring commission based on your tier level.",
        "Payouts are processed through Stripe once commissions meet the minimum threshold and holding period.",
        "Your results depend on how many active referrals you build and maintain. There are no income guarantees."
      ],
      "proTip": "Think of the fuel pool like a shared subscription fund — the more active partners in the program, the more the pool can support affiliate payouts."
    },
    {
      "id": "recurring-commissions",
      "title": "Potential Recurring Commissions",
      "subtitle": "How your $29.99/mo tier may earn month after month",
      "steps": [
        "Share your personal Fuel Rewards referral link by text, email, social media, or QR code.",
        "When someone signs up through your link and pays their active subscription, you may earn a potential recurring commission each month they stay active.",
        "At the Pro tier ($29.99/mo), your illustrative share is ~20% — for example, ~$6/mo per active $29.99 referral. Actual amounts vary.",
        "Higher tiers unlock higher potential recurring share rates. Elite ($39.99) reaches ~25%.",
        "Commissions come from the subscription revenue pool, processed by Stripe — not paid manually out of pocket."
      ],
      "proTip": "Focus on quality referrals who will stay active. One loyal referral paying monthly beats ten signups who cancel."
    },
    {
      "id": "qr-marketing",
      "title": "QR Code Marketing",
      "subtitle": "Turn gas pumps and waiting areas into signup moments",
      "steps": [
        "Open the Marketing Back Office and enter your name, phone, and Fuel Rewards referral link.",
        "Download or print the Gas Pump QR Sign template — it is designed for drivers who are already standing at the pump.",
        "Ask the gas station manager for permission to display your sign near the pump area or on the pump island.",
        "Drivers scan your QR while they wait, land on your referral page, and can sign up for Fuel Rewards on the spot.",
        "Every signup through your link is tracked to you for potential recurring commissions while they stay active."
      ],
      "marketingMaterialId": "pump-qr-flyer",
      "proTip": "Position the QR at eye level where drivers stand while filling up — not on the ground or behind equipment."
    },
    {
      "id": "car-magnets",
      "title": "Car & Station Magnets",
      "subtitle": "Turn your vehicle into a rolling advertisement",
      "steps": [
        "Set up your HiHello digital business card first — add your name, role, phone, and Fuel Rewards referral link.",
        "Open the Marketing Back Office and customize the Car Magnet template with your contact info.",
        "Order custom car magnets through VistaPrint (best for bulk) or a local sign shop. Include your HiHello QR code on the design.",
        "Apply the magnet to your vehicle doors or rear — every drive becomes a marketing opportunity.",
        "For gas stations, ask the manager if you can leave a small magnet-style sign on their community board or counter."
      ],
      "marketingMaterialId": "car-magnet-guide",
      "externalLinks": [
        {
          "label": "Order at VistaPrint",
          "href": "https://www.vistaprint.com"
        }
      ],
      "proTip": "Use weather-resistant magnetic signs rated for outdoor use. Remove and reapply monthly to protect your paint."
    },
    {
      "id": "station-partnerships",
      "title": "Gas Station Partnerships",
      "subtitle": "Partner with station owners to display your QR where drivers wait",
      "steps": [
        "Visit a local gas station and ask to speak with the manager or business owner.",
        "Explain that your QR code helps their customers save money on fuel — it is a value-add for their pumps, not a sales pitch.",
        "Offer a small QR sign or sticker for the pump area using the Gas Pump QR Sign from the Marketing Back Office.",
        "While someone fills up, they scan your code, sign up for Fuel Rewards, and start saving — you may earn potential recurring commissions.",
        "Repeat at multiple stations in your area to build a local network of referral points."
      ],
      "marketingMaterialId": "pump-qr-flyer",
      "proTip": "Start with stations you already visit regularly. Familiar faces get better responses than cold walk-ins."
    },
    {
      "id": "digital-business-suite",
      "title": "Digital Business Suite (HiHello)",
      "subtitle": "Your free digital business card with a live-updating QR code",
      "steps": [
        "Download HiHello free on iPhone (Apple App Store) or Android (Google Play Store).",
        "Create your digital card: add your name, title (Fuel Rewards Partner), phone number, and your Fuel Rewards referral link.",
        "HiHello generates a QR code that updates automatically — change your phone or link anytime without reprinting.",
        "Share your QR via text, email, Bluetooth, WhatsApp, or any app on your phone's share sheet.",
        "Add the same QR to your printed business cards, postcards, pump signs, and car magnets from the Marketing Back Office."
      ],
      "externalLinks": [
        {
          "label": "Apple App Store",
          "href": "https://apps.apple.com/us/app/hihello-digital-business-card/id1453874447"
        },
        {
          "label": "Google Play Store",
          "href": "https://play.google.com/store/apps/details?id=me.hihello.mobile"
        },
        {
          "label": "HiHello.me",
          "href": "https://www.hihello.me"
        }
      ],
      "proTip": "Set your referral link as the primary action on your HiHello card so every scan goes straight to your signup page."
    },
    {
      "id": "print-materials",
      "title": "Print Materials & Marketing Back Office",
      "subtitle": "Business cards, postcards, pump signs, and car magnet templates",
      "steps": [
        "Go to the Marketing Back Office tab and enter your contact info once — it auto-fills every template.",
        "Choose a material: business card, fuel savings postcard, gas pump QR sign, or car magnet guide.",
        "Click Customize & Print to preview your design with your personal info overlaid.",
        "Print at home, or order professionally through GotPrint (postcards from $49) or VistaPrint (bulk cards and magnets).",
        "Hand cards to station managers, drop postcards locally, and display pump signs where drivers can scan."
      ],
      "marketingMaterialId": "fuel-business-card",
      "externalLinks": [
        {
          "label": "GotPrint.com",
          "href": "https://www.gotprint.com"
        },
        {
          "label": "VistaPrint.com",
          "href": "https://www.vistaprint.com"
        }
      ],
      "proTip": "Save your info in the Marketing Back Office first — then every template is one click away from being print-ready."
    }
  ],
  "marketingMaterials": [
    {
      "id": "fuel-business-card",
      "title": "Fuel Rewards Business Card",
      "description": "Professional card for gas station partnerships — add your HiHello QR so drivers scan at the pump.",
      "category": "Print Ready",
      "printNote": "Hand to gas station managers when asking to display your QR code. Glossy finish recommended."
    },
    {
      "id": "fuel-postcard",
      "title": "Fuel Savings Postcard",
      "description": "4×6 postcard explaining fuel rewards savings — perfect for windshield drops and direct mail.",
      "category": "Postcard",
      "printNote": "Order at GotPrint.com — postcards starting at $49 for a professional run. Great for local campaigns."
    },
    {
      "id": "pump-qr-flyer",
      "title": "Gas Pump QR Sign",
      "description": "Bold sign template for gas pump displays — partner with station owners to put your QR where drivers wait.",
      "category": "Field Marketing",
      "printNote": "Print on weather-resistant material. Ask the station manager for permission before placing on pumps."
    },
    {
      "id": "car-magnet-guide",
      "title": "Car Magnet & Mobile Marketing",
      "description": "Use this template for vehicle magnets — turn every drive into a rolling advertisement with your QR code.",
      "category": "Field Marketing",
      "printNote": "Order custom car magnets through VistaPrint (bulk orders) or local sign shops. Add your HiHello QR."
    }
  ],
  "tierComparison": [
    [
      "Monthly subscription cost",
      "Free*",
      "$19.99",
      "$29.99",
      "$39.99"
    ],
    [
      "Annual cost (if billed monthly)",
      "Free*",
      "$239.88",
      "$359.88",
      "$479.88"
    ],
    [
      "Potential recurring commission share",
      "Base",
      "~15%",
      "~20%",
      "~25%"
    ],
    [
      "Fuel savings access",
      "✓",
      "✓",
      "✓",
      "✓"
    ],
    [
      "Personal referral link",
      "✓",
      "✓",
      "✓",
      "✓"
    ],
    [
      "Basic business card template",
      "—",
      "✓",
      "✓",
      "✓"
    ],
    [
      "Marketing Back Office",
      "—",
      "—",
      "✓",
      "✓"
    ],
    [
      "HiHello (App Store & Google Play)",
      "—",
      "—",
      "✓",
      "✓"
    ],
    [
      "GotPrint.com & VistaPrint guides",
      "—",
      "—",
      "✓",
      "✓"
    ],
    [
      "Gas pump QR signage",
      "—",
      "—",
      "✓",
      "✓"
    ],
    [
      "Car magnet templates",
      "—",
      "—",
      "—",
      "✓"
    ],
    [
      "Station partnership toolkit",
      "—",
      "—",
      "—",
      "✓"
    ],
    [
      "Elite partner badge & support",
      "—",
      "—",
      "—",
      "✓"
    ]
  ],
  "incomeSteps": [
    {
      "step": "1",
      "title": "Share Your Link",
      "desc": "Send your personal Fuel Rewards referral link by text, email, social media, or QR code. Every signup through your link is tracked to you."
    },
    {
      "step": "2",
      "title": "Market Locally",
      "desc": "Print business cards and postcards. Ask gas station managers if you can display your QR sign on their pumps. Add a car magnet with your QR."
    },
    {
      "step": "3",
      "title": "Potential Recurring Commissions",
      "desc": "Each active referral who pays their subscription may generate potential recurring commissions for you — based on your tier's commission share. Higher tiers = higher potential recurring percentage."
    }
  ],
  "stationPlaybook": [
    "Visit a local gas station and ask to speak with the manager or business owner.",
    "Explain that your QR code helps their customers save money on fuel — it's a value-add for their pumps.",
    "Offer a small sign or sticker with your QR code for the pump area (use the Gas Pump QR Sign in the Marketing Back Office).",
    "While someone is filling up, they scan your code, sign up for Fuel Rewards, and start saving — and you may earn potential recurring commissions if they maintain an active subscription.",
    "Repeat at multiple stations in your area to build a local network of referral points."
  ],
  "links": {
    "hiHelloAppStore": "https://apps.apple.com/us/app/hihello-digital-business-card/id1453874447",
    "hiHelloGooglePlay": "https://play.google.com/store/apps/details?id=me.hihello.mobile",
    "gotPrint": "https://www.gotprint.com",
    "vistaPrint": "https://www.vistaprint.com"
  }
};
