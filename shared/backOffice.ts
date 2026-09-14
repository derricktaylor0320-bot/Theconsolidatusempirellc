import { z } from "zod";

/** Empire destinations surfaced in the owner back office. */
export type EmpireAppStatus = "live" | "beta" | "coming_soon";

export type EmpireApp = {
  id: string;
  name: string;
  href: string;
  category: "shop" | "creative" | "programs" | "empire";
  status: EmpireAppStatus;
  /** Optional API probe used for health checks from the back office. */
  healthPath?: string;
};

export const EMPIRE_APPS: EmpireApp[] = [
  { id: "hub", name: "Centralized Hub", href: "/hub", category: "empire", status: "live" },
  { id: "apparel", name: "Apparel", href: "/apparel", category: "shop", status: "live", healthPath: "/api/products" },
  { id: "accessories", name: "Accessories", href: "/accessories", category: "shop", status: "live", healthPath: "/api/products" },
  { id: "elements", name: "Elements Health & Skincare", href: "/elements", category: "shop", status: "live" },
  { id: "pocket-booster", name: "Pocket Booster", href: "/pocket-booster", category: "programs", status: "live", healthPath: "/api/pocket-booster/me" },
  { id: "expense-relief", name: "TCE Expense Advantage", href: "/expense-relief", category: "programs", status: "live", healthPath: "/api/expense-relief/me" },
  { id: "invest", name: "Empire Invest", href: "/invest", category: "programs", status: "live", healthPath: "/api/liquidity/me" },
  { id: "fuel-perks", name: "FR2P Fuel Rewards", href: "/fuel-perks", category: "programs", status: "beta" },
  { id: "fr2p", name: "The FR2P Club", href: "/fr2p", category: "programs", status: "live" },
  { id: "media", name: "Media & Music", href: "/media", category: "creative", status: "live", healthPath: "/api/media" },
  { id: "hot-dogs", name: "Premium Choice Hot Dogs", href: "/hot-dogs", category: "creative", status: "live" },
  { id: "orders", name: "Order Fulfillment", href: "/orders", category: "empire", status: "live", healthPath: "/api/orders" },
];

export const FEEDBACK_STATUSES = ["new", "in_progress", "resolved"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const submitFeedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please share at least a sentence or two")
    .max(2000, "Message is too long"),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
  interestArea: z.string().trim().max(120).optional(),
  sourcePath: z.string().trim().max(200).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export const updateFeedbackStatusSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES),
  ownerNotes: z.string().trim().max(2000).optional(),
});

export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;

export const recordPageViewSchema = z.object({
  path: z.string().trim().min(1).max(200),
  visitorId: z.string().trim().min(8).max(64),
  referrer: z.string().trim().max(500).optional(),
});

export type RecordPageViewInput = z.infer<typeof recordPageViewSchema>;
