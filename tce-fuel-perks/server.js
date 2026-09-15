const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const programConfig = require('./programConfig');

const app = express();
const PORT = process.env.PORT || 3000;

function getTierById(id) {
    return programConfig.tiers.find((tier) => tier.id === id);
}

function getDefaultTier() {
    return getTierById('pro') || programConfig.paidTiers[1];
}

function formatTierLabel(tier) {
    if (!tier.isPaidTier) return `${tier.name} (Included with FR2P)`;
    return `${tier.name} ($${tier.monthlyFee.toFixed(2)}/mo)`;
}

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const membersDB = new Map();

app.get('/api/config', (_req, res) => {
    res.json(programConfig);
});

app.post('/api/subscribe', (req, res) => {
    const { name, email, phone, tierId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const tier = getTierById(tierId) || getDefaultTier();
    if (!tier.isPaidTier) {
        return res.status(400).json({
            error: 'Member Access is included with FR2P Club membership. Choose a paid tier to subscribe.',
        });
    }

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
        potentialCommissionLabel: tier.potentialCommissionLabel,
        status: 'Active',
        joinedDate: new Date().toISOString(),
        affiliateLink,
        qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}`,
    };

    membersDB.set(memberId, newMember);
    res.json({
        success: true,
        message: 'Successfully enrolled in The FR2P Club Fuel Program!',
        data: newMember,
    });
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
            potentialCommissionLabel: fallbackTier.potentialCommissionLabel,
            affiliateLink: `https://tceholdings.org/fuel/ref?code=${req.params.id}`,
            qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tceholdings.org/fuel/ref?code=${req.params.id}`,
        });
    }
    res.json(member);
});

app.listen(PORT, () => {
    console.log(`TCE Fuel Perks Sub-Brand running on port ${PORT}`);
});
