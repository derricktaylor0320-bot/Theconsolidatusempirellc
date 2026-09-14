const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const FUEL_PERKS_TIERS = [
    {
        id: 'starter',
        name: 'Road Starter',
        monthlyFee: 19.99,
        centsPerGallon: 5,
        bestFor: 'Light drivers getting started',
        perks: ['5¢/gal savings', 'Member QR code', 'Referral link'],
    },
    {
        id: 'pro',
        name: 'Fleet Pro',
        monthlyFee: 29.99,
        centsPerGallon: 8,
        bestFor: 'Daily commuters — most popular',
        mostPopular: true,
        perks: ['8¢/gal savings', 'Member QR code', 'Referral tracking'],
    },
    {
        id: 'elite',
        name: 'Premium Elite',
        monthlyFee: 39.99,
        centsPerGallon: 12,
        bestFor: 'Maximum savings & affiliate growth',
        perks: ['12¢/gal savings', 'Magnet & asset kit', 'FR2P cross-promo boosts', 'Affiliate downline tools'],
    },
];

function getTierById(id) {
    return FUEL_PERKS_TIERS.find((tier) => tier.id === id);
}

function getDefaultTier() {
    return getTierById('pro') || FUEL_PERKS_TIERS[1];
}

function formatTierLabel(tier) {
    return `${tier.name} ($${tier.monthlyFee.toFixed(2)}/mo)`;
}

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const membersDB = new Map();

app.get('/api/config', (_req, res) => {
    res.json({ tiers: FUEL_PERKS_TIERS });
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
