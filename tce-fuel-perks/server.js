const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const ILLUSTRATIVE_GALLONS = 80;
const ILLUSTRATIVE_REFERRALS = 5;

const FUEL_PERKS_TIERS = [
    {
        id: 'starter',
        name: 'Road Starter',
        monthlyFee: 19.99,
        centsPerGallon: 19,
        bestFor: 'Light drivers getting started',
        commissionSharePercent: 15,
        commissionPerReferralMonthly: 3.0,
        annualSubscriptionCost: 239.88,
        perks: ['19¢/gal community fuel pool savings', 'Member QR code', 'Referral link', '~15% potential recurring commission share'],
    },
    {
        id: 'pro',
        name: 'Fleet Pro',
        monthlyFee: 29.99,
        centsPerGallon: 29,
        bestFor: 'Daily commuters — most popular',
        mostPopular: true,
        commissionSharePercent: 20,
        commissionPerReferralMonthly: 6.0,
        annualSubscriptionCost: 359.88,
        perks: ['29¢/gal community fuel pool savings', 'Member QR code', 'Referral tracking', 'Marketing Back Office access', '~20% potential recurring commission share'],
    },
    {
        id: 'elite',
        name: 'Premium Elite',
        monthlyFee: 39.99,
        centsPerGallon: 39,
        bestFor: 'Maximum savings & affiliate growth',
        commissionSharePercent: 25,
        commissionPerReferralMonthly: 10.0,
        annualSubscriptionCost: 479.88,
        perks: ['39¢/gal community fuel pool savings', 'Magnet & asset kit', 'FR2P cross-promo boosts', 'Affiliate downline tools', '~25% potential recurring commission share'],
    },
];

const PAYOUT_EXPLAINER = {
    programType: 'Affiliate marketing program with a community subscription fuel pool — not crowdfunding, equity, or a guaranteed income product.',
    howMoneyIsRaised: [
        'Each member pays their tier subscription monthly through Stripe (secure checkout).',
        'Those payments flow into the platform community fuel pool — a collective subscription fund, not anyone\'s personal pocket.',
        'The pool funds per-gallon fuel savings for active members and potential recurring affiliate commissions when you refer new paying partners.',
        'Payouts are processed through Stripe once commissions meet platform thresholds. Results depend on your activity and active referrals.',
    ],
};

function getTierById(id) {
    return FUEL_PERKS_TIERS.find((tier) => tier.id === id);
}

function getDefaultTier() {
    return getTierById('pro') || FUEL_PERKS_TIERS[1];
}

function formatTierLabel(tier) {
    return `${tier.name} ($${tier.monthlyFee.toFixed(2)}/mo)`;
}

function buildProjections(tier) {
    const fuelSavingsMonthly = (ILLUSTRATIVE_GALLONS * tier.centsPerGallon) / 100;
    const commissionRecurringMonthly = tier.commissionPerReferralMonthly * ILLUSTRATIVE_REFERRALS;
    const combinedUtilizationMonthly = fuelSavingsMonthly + commissionRecurringMonthly;
    return {
        gallonsPerMonth: ILLUSTRATIVE_GALLONS,
        illustrativeActiveReferrals: ILLUSTRATIVE_REFERRALS,
        fuelSavingsMonthly,
        fuelSavingsAnnual: fuelSavingsMonthly * 12,
        commissionRecurringMonthly,
        commissionRecurringAnnual: commissionRecurringMonthly * 12,
        combinedUtilizationMonthly,
        combinedUtilizationAnnual: combinedUtilizationMonthly * 12,
        netAfterSubscriptionMonthly: combinedUtilizationMonthly - tier.monthlyFee,
        netAfterSubscriptionAnnual: (combinedUtilizationMonthly - tier.monthlyFee) * 12,
    };
}

function getConfigPayload() {
    return {
        platform: {
            platformName: 'FR2P Fuel Rewards',
            tagline: 'Community-backed fuel savings for every budget.',
        },
        payoutExplainer: PAYOUT_EXPLAINER,
        assumptions: {
            gallonsPerMonth: ILLUSTRATIVE_GALLONS,
            activeReferrals: ILLUSTRATIVE_REFERRALS,
            disclaimer: 'All figures are illustrative examples of potential fuel savings and recurring commissions only. Not guaranteed.',
        },
        tiers: FUEL_PERKS_TIERS.map((tier) => ({
            ...tier,
            projections: buildProjections(tier),
        })),
    };
}

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const membersDB = new Map();

app.get('/api/config', (_req, res) => {
    res.json(getConfigPayload());
});

app.post('/api/subscribe', (req, res) => {
    const { name, email, phone, tierId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const tier = getTierById(tierId) || getDefaultTier();
    const memberId = 'FR2P-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const affiliateLink = `https://tceholdings.org/fuel/ref?code=${memberId}`;

    const newMember = {
        memberId,
        name: name || 'Valued Member',
        email,
        phone: phone || '',
        tierId: tier.id,
        tier: formatTierLabel(tier),
        monthlyFee: tier.monthlyFee,
        centsPerGallon: tier.centsPerGallon,
        status: 'Active',
        joinedDate: new Date().toISOString(),
        affiliateLink,
        qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}`
    };

    membersDB.set(memberId, newMember);
    res.json({ success: true, message: 'Successfully enrolled in The FR2P Club Fuel Program!', data: newMember });
});

app.get('/api/member/:id', (req, res) => {
    const member = membersDB.get(req.params.id);
    const fallbackTier = getDefaultTier();
    if (!member) {
        return res.json({
            memberId: req.params.id,
            name: 'Derrick Taylor',
            tierId: fallbackTier.id,
            tier: formatTierLabel(fallbackTier),
            monthlyFee: fallbackTier.monthlyFee,
            centsPerGallon: fallbackTier.centsPerGallon,
            affiliateLink: `https://tceholdings.org/fuel/ref?code=${req.params.id}`,
            qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tceholdings.org/fuel/ref?code=${req.params.id}`
        });
    }
    res.json(member);
});

app.listen(PORT, () => {
    console.log(`TCE Fuel Perks Sub-Brand running on port ${PORT}`);
});
