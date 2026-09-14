import type { Express } from "express";
import type { EmpireAppStatus } from "@shared/backOffice";
import { EMPIRE_APPS, recordPageViewSchema, submitFeedbackSchema, updateFeedbackStatusSchema } from "@shared/backOffice";
import { requireOwner } from "./auth";
import { storage } from "./storage";
import { RateLimiter } from "./rateLimit";
import { getGoogleSetupStatus } from "./seo";

const pageViewLimiter = new RateLimiter(120, 60_000);
const feedbackLimiter = new RateLimiter(5, 60_000);

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function healthFromStatus(status: EmpireAppStatus, views7d: number): "ok" | "degraded" | "down" {
  if (status === "coming_soon") return "down";
  if (status === "beta") return views7d > 0 ? "ok" : "degraded";
  return views7d > 0 ? "ok" : "degraded";
}

export function registerBackOfficeRoutes(app: Express): void {
  app.post("/api/analytics/page-view", (req, res) => {
    const ip = req.ip || "unknown";
    if (pageViewLimiter.hit(ip).limited) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const parsed = recordPageViewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid page view payload" });
    }

    const { path, visitorId, referrer } = parsed.data;
    if (path.startsWith("/api") || path.startsWith("/media-files")) {
      return res.json({ ok: true, skipped: true });
    }

    storage
      .recordPageView({ path, visitorId, referrer })
      .then(() => res.json({ ok: true }))
      .catch((error) => {
        console.error("Failed to record page view:", error);
        res.status(500).json({ error: "Failed to record page view" });
      });
  });

  app.post("/api/feedback", (req, res) => {
    const ip = req.ip || "unknown";
    if (feedbackLimiter.hit(ip).limited) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const parsed = submitFeedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || "Invalid feedback",
      });
    }

    const { message, email, interestArea, sourcePath } = parsed.data;
    storage
      .submitFeedback({
        message,
        email: email || null,
        interestArea: interestArea || null,
        sourcePath: sourcePath || null,
      })
      .then((row) => res.status(201).json({ ok: true, id: row.id }))
      .catch((error) => {
        console.error("Failed to submit feedback:", error);
        res.status(500).json({ error: "Failed to submit feedback" });
      });
  });

  app.get("/api/back-office/overview", requireOwner, async (req, res) => {
    try {
      const overview = await storage.getBackOfficeOverview();
      const displayName =
        (req.user as { displayName?: string | null; email?: string })?.displayName ||
        (req.user as { email?: string })?.email?.split("@")[0] ||
        "Owner";

      const apps = EMPIRE_APPS.map((app) => {
        const views =
          overview.topDestinations.find((d) => d.path === app.href)?.views ?? 0;
        return {
          ...app,
          health: healthFromStatus(app.status, views),
          views7d: views,
        };
      });

      res.json({
        greeting: `${greetingForHour(new Date().getHours())}, ${displayName}`,
        generatedAt: new Date().toISOString(),
        google: getGoogleSetupStatus(),
        stats: {
          totalUsers: overview.totalUsers,
          totalSubscribers: overview.totalSubscribers,
          totalOrders: overview.totalOrders,
          totalRevenueCents: overview.totalRevenueCents,
          uniqueVisitors7d: overview.uniqueVisitors7d,
          pageViews7d: overview.pageViews7d,
          pageViews30d: overview.pageViews30d,
          pendingFeedback: overview.pendingFeedback,
          pocketBoosterMembers: overview.pocketBoosterMembers,
          expenseReliefMembers: overview.expenseReliefMembers,
          activeInvestors: overview.activeInvestors,
        },
        apps,
        topDestinations: overview.topDestinations,
        recentBuyers: overview.recentBuyers,
        recentFeedback: overview.recentFeedback,
      });
    } catch (error) {
      console.error("Back office overview failed:", error);
      res.status(500).json({ error: "Failed to load back office overview" });
    }
  });

  app.get("/api/back-office/feedback", requireOwner, async (_req, res) => {
    try {
      const rows = await storage.getAllFeedback(100);
      res.json(rows);
    } catch (error) {
      console.error("Failed to load feedback:", error);
      res.status(500).json({ error: "Failed to load feedback" });
    }
  });

  app.patch("/api/back-office/feedback/:id", requireOwner, async (req, res) => {
    try {
      const parsed = updateFeedbackStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid feedback update" });
      }
      const updated = await storage.updateFeedbackStatus(
        req.params.id,
        parsed.data.status,
        parsed.data.ownerNotes,
      );
      if (!updated) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to update feedback:", error);
      res.status(500).json({ error: "Failed to update feedback" });
    }
  });
}
