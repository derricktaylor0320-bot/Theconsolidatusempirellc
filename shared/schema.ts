import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  productType: text("product_type").notNull(), // 'apparel' or 'accessory'
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// A single purchased line item, stored inside the order's `items` jsonb column.
export interface OrderItem {
  name: string;
  quantity: number;
  amountCents: number; // per-unit price in cents
  note?: string;
}

// Paid orders captured at checkout. We do NOT persist anything when the buyer
// is sent to Square; only once they return AND Square confirms the order is
// paid do we record it (keyed by the Square order id). This means abandoned or
// cancelled checkouts never create a row. `status` is kept for forward
// flexibility but persisted rows are always "paid".
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("pending"), // 'pending' | 'paid'
  // Fulfillment progress, owner-controlled from the orders page.
  fulfillmentStatus: text("fulfillment_status").notNull().default("unfulfilled"), // 'unfulfilled' | 'fulfilled'
  items: jsonb("items").$type<OrderItem[]>().notNull(),
  totalCents: integer("total_cents").notNull(),
  squareOrderId: text("square_order_id").unique(),
  // Buyer contact + ship-to details captured from Square at checkout. The owner
  // needs the address to place the order with the fulfilling company (Amazon,
  // Etsy, etc.), and the email to send the shipping/tracking notification.
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  shippingAddress: text("shipping_address"),
  // Tracking info entered by the owner when they mark the order shipped.
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const FULFILLMENT_STATUSES = ["unfulfilled", "fulfilled"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const updateOrderFulfillmentSchema = z.object({
  fulfillmentStatus: z.enum(FULFILLMENT_STATUSES),
  // Optional tracking details supplied when marking an order shipped. Cleared
  // when an order is reverted to unfulfilled.
  carrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
});

export const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  amountCents: z.number().int().nonnegative(),
  note: z.string().optional(),
});

export const insertOrderSchema = z.object({
  items: z.array(orderItemSchema),
  totalCents: z.number().int().nonnegative(),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  source: text("source"), // where they signed up from (hub, footer, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  createdAt: true,
});

export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  // Optional profile photo (site-hosted upload under /media-files/avatars/)
  // and free-form location ("Atlanta, GA" / "USA") shown next to reviews.
  avatarUrl: text("avatar_url"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public-facing user shape (never expose the password hash to clients)
export type PublicUser = Pick<
  User,
  "id" | "email" | "displayName" | "avatarUrl" | "location"
>;

// Profile fields a signed-in user may edit about themselves. Empty strings
// clear the value. The avatar is handled separately via file upload.
export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(80, "Name is too long").optional(),
  location: z.string().trim().max(80, "Location is too long").optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Single-use, expiring tokens for the "forgot password" flow.
// We store only a hash of the token so a database leak can't be used to
// reset accounts; the raw token lives only in the emailed reset link.
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(
  passwordResetTokens,
).omit({
  id: true,
  usedAt: true,
  createdAt: true,
});

export type InsertPasswordResetToken = z.infer<
  typeof insertPasswordResetTokenSchema
>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Schemas for the auth endpoints
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Media gallery: singing video clips and audio projects shown on the /media
// page. Each item belongs to a named collection (e.g. "R&B Singing Clips").
// `sourceType` distinguishes externally hosted links (YouTube, Vimeo,
// SoundCloud, etc.) from files uploaded straight to the site. For uploads,
// `url` points at the locally served file (/media-files/<fileName>) and
// `fileName` is the stored name on disk (kept so we can delete the file).
export const mediaItems = pgTable("media_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  collection: text("collection").notNull(),
  mediaType: text("media_type").notNull(), // 'video' | 'audio'
  sourceType: text("source_type").notNull(), // 'link' | 'upload'
  url: text("url").notNull(),
  fileName: text("file_name"), // stored filename for uploads (null for links)
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const MEDIA_TYPES = ["video", "audio"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

// Validates the "paste a link" create form. Uploads build their row directly
// from the multipart fields + file metadata, so they don't use this schema.
export const insertMediaLinkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  collection: z.string().trim().min(1, "Collection name is required").max(80),
  mediaType: z.enum(MEDIA_TYPES),
  url: z.string().trim().url("Please enter a valid link (URL)"),
  description: z.string().trim().max(500).optional(),
});

// Shared validation for the upload form's text fields.
export const mediaUploadFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  collection: z.string().trim().min(1, "Collection name is required").max(80),
  description: z.string().trim().max(500).optional(),
});

export type InsertMediaLink = z.infer<typeof insertMediaLinkSchema>;
export type MediaItem = typeof mediaItems.$inferSelect;

// Customer product reviews. Keyed by product NAME (not catalog id) because the
// catalog holds duplicate product rows under different ids for the same item
// (the storefront dedupes by name), so the name is the stable identity.
// One review per signed-in user per product — submitting again updates it.
// `verified` is set server-side when the reviewer's account email matches a
// recorded paid order containing that product.
export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    productName: text("product_name").notNull(),
    userId: varchar("user_id").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    rating: integer("rating").notNull(), // 1-5 stars
    comment: text("comment").notNull(),
    verified: boolean("verified").notNull().default(false),
    // Optional US location for this review (e.g. "Atlanta, GA" or "Georgia").
    // Prefer this over the profile location when present so each review can
    // show where the customer was when they wrote it.
    location: text("location"),
    // Up to 3 site-hosted photo URLs of the product they received
    // (/media-files/review-photos/...). Empty array when none were uploaded.
    photoUrls: jsonb("photo_urls").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("IDX_reviews_user_product").on(t.userId, t.productName)],
);

// Validates the client-submitted review form. Reviewer identity (userId,
// reviewerName) and the `verified` flag are derived server-side from the
// session + order history — never trusted from the client. Photo URLs are
// accepted only after the upload endpoint stores them under our media dir.
export const insertReviewSchema = z.object({
  productName: z.string().trim().min(1, "Product is required").max(200),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Please pick a star rating")
    .max(5, "Rating can be at most 5 stars"),
  comment: z
    .string()
    .trim()
    .min(3, "Please tell us a little about the product")
    .max(1000, "Reviews can be at most 1000 characters"),
  location: z
    .string()
    .trim()
    .min(2, "Please share your location in the United States")
    .max(80, "Location is too long")
    .optional(),
  photoUrls: z
    .array(z.string().trim().min(1))
    .max(3, "You can upload up to 3 photos")
    .optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Public review shape returned by the API (never exposes reviewer user ids).
export type PublicReview = Omit<Review, "userId">;

// Review as served by the list endpoints: joined with the reviewer's current
// profile photo and location so reviews always show up-to-date profile info.
export type PublicReviewWithReviewer = PublicReview & {
  reviewerAvatarUrl: string | null;
  reviewerLocation: string | null;
};

// Tracks one-time discount redemptions (currently Discount10% from photo
// reviews). Frequent-shopper Discount15% is re-checked from order count and
// does not need a redemption row.
export const discountRedemptions = pgTable("discount_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  code: text("code").notNull(),
  squareOrderId: text("square_order_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DiscountRedemption = typeof discountRedemptions.$inferSelect;

// ---------------------------------------------------------------------------
// Pocket Booster — subscription-powered cash cushions + Pay-to-Learn rewards
// ---------------------------------------------------------------------------

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  tierLevel: integer("tier_level").notNull(), // 1–4
  monthlySubscription: decimal("monthly_subscription", {
    precision: 10,
    scale: 2,
  }).notNull(),
  maxCushionLimit: decimal("max_cushion_limit", {
    precision: 10,
    scale: 2,
  }).notNull(),
  nextBillingAmount: decimal("next_billing_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  subscriptionStatus: text("subscription_status").notNull().default("active"), // active | paused | cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

export const cashAdvances = pgTable("cash_advances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amountBorrowed: decimal("amount_borrowed", {
    precision: 10,
    scale: 2,
  }).notNull(),
  repaymentType: text("repayment_type").notNull(),
  status: text("status").notNull().default("active"), // active | repaid | cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export type CashAdvance = typeof cashAdvances.$inferSelect;

export const repaymentSchedules = pgTable("repayment_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advanceId: varchar("advance_id").notNull(),
  userId: varchar("user_id").notNull(),
  deductionAmount: decimal("deduction_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | collected | failed | cancelled
  // Square Invoices API refs for the payday autopilot charge / emailed invoice.
  squareOrderId: text("square_order_id"),
  squareInvoiceId: text("square_invoice_id"),
  squareInvoiceUrl: text("square_invoice_url"),
  squareInvoiceStatus: text("square_invoice_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RepaymentSchedule = typeof repaymentSchedules.$inferSelect;

export const educationalMilestones = pgTable(
  "educational_milestones",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    moduleName: text("module_name").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [
    uniqueIndex("IDX_educational_milestones_user_module").on(
      t.userId,
      t.moduleName,
    ),
  ],
);

export type EducationalMilestone = typeof educationalMilestones.$inferSelect;

// ---------------------------------------------------------------------------
// P2P Liquidity Loop — investor capital backs the Pocket Booster reserve vault
// ---------------------------------------------------------------------------

export const userInvestments = pgTable("user_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amountAllocated: decimal("amount_allocated", {
    precision: 12,
    scale: 2,
  }).notNull(),
  /** 1 Revenue Participation Unit = $1.00 USD contribution */
  unitsCount: decimal("units_count", {
    precision: 12,
    scale: 2,
  }).notNull(),
  projectTag: text("project_tag").notNull().default("POCKET_BOOSTER_RESERVE"),
  yieldRate: decimal("yield_rate", { precision: 6, scale: 4 }).notNull().default("0.0850"),
  lockPeriodDays: integer("lock_period_days").notNull().default(90),
  hasVotingRights: boolean("has_voting_rights").notNull().default(false),
  instrumentType: text("instrument_type")
    .notNull()
    .default("REVENUE_PARTICIPATION_UNIT"),
  accruedYield: decimal("accrued_yield", {
    precision: 12,
    scale: 4,
  })
    .notNull()
    .default("0"),
  paidYield: decimal("paid_yield", {
    precision: 12,
    scale: 4,
  })
    .notNull()
    .default("0"),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | CLOSED
  lastYieldAt: timestamp("last_yield_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UserInvestment = typeof userInvestments.$inferSelect;

/**
 * Core LLC equity shield — foundational ownership only.
 * Invest / RPU paths must NEVER insert or update this table.
 */
export const companyEquity = pgTable("company_equity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberName: text("member_name").notNull().unique(),
  /** Non-numeric lock label — never treated as investor-dilutable shares */
  equityPercentage: text("equity_percentage")
    .notNull()
    .default("FOUNDATIONAL_LOCKED"),
  isFoundational: boolean("is_foundational").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CompanyEquity = typeof companyEquity.$inferSelect;

export const pocketBoosterVault = pgTable("pocket_booster_vault", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: varchar("investment_id").notNull().unique(),
  totalVaultContribution: decimal("total_vault_contribution", {
    precision: 12,
    scale: 2,
  }).notNull(),
  availableLendingCapital: decimal("available_lending_capital", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type PocketBoosterVault = typeof pocketBoosterVault.$inferSelect;

export const projectLedger = pgTable("project_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: varchar("investment_id").notNull(),
  operationsSpend: decimal("operations_spend", {
    precision: 12,
    scale: 2,
  }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProjectLedger = typeof projectLedger.$inferSelect;

export const yieldPayouts = pgTable("yield_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  investmentId: varchar("investment_id").notNull(),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 4 }).notNull(),
  source: text("source").notNull().default("SUBSCRIPTION_REVENUE"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type YieldPayout = typeof yieldPayouts.$inferSelect;

/** In-app investor notifications — where money went & how it was used */
export const investmentNotifications = pgTable("investment_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  investmentId: varchar("investment_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  projectTag: text("project_tag"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InvestmentNotification = typeof investmentNotifications.$inferSelect;
