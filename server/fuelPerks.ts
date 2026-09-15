import express, { type Express, type Router } from "express";
import path from "path";
import {
  formatFuelPerksTierLabel,
  getDefaultFuelPerksTier,
  getFuelPerksConfigPayload,
  getFuelPerksTierById,
} from "@shared/fuelPerks";

const membersDB = new Map<string, Record<string, string | number>>();

function createFuelPerksRouter(): Router {
  const router = express.Router();
  const publicDir = path.resolve(process.cwd(), "tce-fuel-perks", "public");

  router.use(express.json());

  router.get("/api/config", (_req, res) => {
    res.json(getFuelPerksConfigPayload());
  });

  router.post("/api/subscribe", (req, res) => {
    const { name, email, phone, tierId } = req.body ?? {};
    if (!email) return res.status(400).json({ error: "Email is required." });

    const tier = getFuelPerksTierById(tierId) ?? getDefaultFuelPerksTier();
    const memberId =
      "FR2P-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const affiliateLink = `https://tceholdings.org/fuel/ref?code=${memberId}`;

    const newMember = {
      memberId,
      name: name || "Valued Member",
      email,
      phone: phone || "",
      tierId: tier.id,
      tier: formatFuelPerksTierLabel(tier),
      monthlyFee: tier.monthlyFee,
      centsPerGallon: tier.centsPerGallon,
      status: "Active",
      joinedDate: new Date().toISOString(),
      affiliateLink,
      qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(affiliateLink)}`,
    };

    membersDB.set(memberId, newMember);
    res.json({
      success: true,
      message: "Successfully enrolled in The FR2P Club Fuel Program!",
      data: newMember,
    });
  });

  router.get("/api/member/:id", (req, res) => {
    const member = membersDB.get(req.params.id);
    const fallbackTier = getDefaultFuelPerksTier();
    if (!member) {
      return res.json({
        memberId: req.params.id,
        name: "Derrick Taylor",
        tierId: fallbackTier.id,
        tier: formatFuelPerksTierLabel(fallbackTier),
        monthlyFee: fallbackTier.monthlyFee,
        centsPerGallon: fallbackTier.centsPerGallon,
        affiliateLink: `https://tceholdings.org/fuel/ref?code=${req.params.id}`,
        qrCodeApiUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://tceholdings.org/fuel/ref?code=${req.params.id}`,
      });
    }
    res.json(member);
  });

  router.use(express.static(publicDir));

  return router;
}

export function registerFuelPerksRoutes(app: Express) {
  app.use("/fuel-perks/embed", createFuelPerksRouter());

  app.get("/fuel/ref", (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const target = code
      ? `/fuel-perks?ref=${encodeURIComponent(code)}`
      : "/fuel-perks";
    res.redirect(302, target);
  });
}
