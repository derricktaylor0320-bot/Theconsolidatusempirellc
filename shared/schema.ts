import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public-facing user shape (never expose the password hash to clients)
export type PublicUser = Pick<User, "id" | "email" | "displayName">;

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
