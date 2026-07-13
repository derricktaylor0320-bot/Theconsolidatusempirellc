import { type Product, type InsertProduct, products, type Subscriber, type InsertSubscriber, subscribers, type User, type InsertUser, users, type PasswordResetToken, type InsertPasswordResetToken, passwordResetTokens, type Order, type OrderItem, type FulfillmentStatus, orders, type MediaItem, mediaItems, type Review, reviews, discountRedemptions } from "@shared/schema";
import { DISCOUNT_CODES } from "@shared/discounts";

// Review row joined with the reviewer's current profile photo + location.
export type ReviewWithReviewer = Review & {
  reviewerAvatarUrl: string | null;
  reviewerLocation: string | null;
};
import { db } from "./db";
import { and, eq, ne, isNull, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductsByType(productType: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Subscriber operations
  addSubscriber(subscriber: InsertSubscriber): Promise<Subscriber | null>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  getAllSubscribers(): Promise<Subscriber[]>;

  // Order operations
  getAllOrders(options?: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }>;
  getPaidOrdersByEmail(
    email: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ orders: Order[]; total: number }>;
  updateOrderFulfillment(
    id: string,
    fulfillmentStatus: FulfillmentStatus,
    tracking?: { carrier?: string | null; trackingNumber?: string | null },
  ): Promise<{ order: Order; transitionedToFulfilled: boolean } | undefined>;
  getOrderBySquareId(squareOrderId: string): Promise<Order | undefined>;
  getOrderById(id: string): Promise<Order | undefined>;
  recordPaidOrder(order: {
    squareOrderId: string;
    items: OrderItem[];
    totalCents: number;
    customerEmail?: string | null;
    customerName?: string | null;
    shippingAddress?: string | null;
  }): Promise<Order>;

  // User / auth operations
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;

  // Password reset token operations
  createPasswordResetToken(
    token: InsertPasswordResetToken,
  ): Promise<PasswordResetToken>;
  getValidPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  deletePasswordResetTokensForUser(userId: string): Promise<void>;

  // Media gallery operations
  getAllMediaItems(): Promise<MediaItem[]>;
  getMediaItem(id: string): Promise<MediaItem | undefined>;
  createMediaItem(item: {
    title: string;
    collection: string;
    mediaType: string;
    sourceType: string;
    url: string;
    fileName?: string | null;
    description?: string | null;
  }): Promise<MediaItem>;
  deleteMediaItem(id: string): Promise<MediaItem | undefined>;

  // Profile operations
  updateUserProfile(
    userId: string,
    fields: { displayName?: string | null; location?: string | null },
  ): Promise<User | undefined>;
  updateUserAvatar(userId: string, avatarUrl: string | null): Promise<User | undefined>;

  // Product review operations
  getReviewsForProduct(productName: string): Promise<ReviewWithReviewer[]>;
  getRecentReviews(limit: number): Promise<ReviewWithReviewer[]>;
  getReviewById(id: string): Promise<Review | undefined>;
  upsertReview(review: {
    productName: string;
    userId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    verified: boolean;
    location?: string | null;
    photoUrls?: string[];
  }): Promise<Review>;
  deleteReview(id: string): Promise<Review | undefined>;
  hasUserPurchasedProduct(email: string, productName: string): Promise<boolean>;
  countPaidOrdersByEmail(email: string): Promise<number>;
  hasUnusedPhotoReviewDiscount(userId: string): Promise<boolean>;
  recordDiscountRedemption(input: {
    userId: string;
    code: string;
    squareOrderId?: string | null;
  }): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByType(productType: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.productType, productType));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async addSubscriber(insertSubscriber: InsertSubscriber): Promise<Subscriber | null> {
    try {
      const [subscriber] = await db
        .insert(subscribers)
        .values(insertSubscriber)
        .onConflictDoNothing({ target: subscribers.email })
        .returning();
      return subscriber || null;
    } catch (error) {
      return null;
    }
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return subscriber || undefined;
  }

  async getAllSubscribers(): Promise<Subscriber[]> {
    return await db.select().from(subscribers);
  }

  async getAllOrders(options?: { limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number }> {
    const limit = options?.limit;
    const offset = options?.offset ?? 0;

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(orders);

    let query = db.select().from(orders).orderBy(desc(orders.createdAt)).$dynamic();
    if (limit !== undefined) {
      query = query.limit(limit).offset(offset);
    }
    const rows = await query;

    return { orders: rows, total: count };
  }

  // Customer's own paid orders, matched by the email on the Square receipt
  // (same identity used for Verified Purchase badges). Guests who later
  // register with that email can review everything they previously bought.
  async getPaidOrdersByEmail(
    email: string,
    options?: { limit?: number; offset?: number },
  ): Promise<{ orders: Order[]; total: number }> {
    const normalized = email.toLowerCase().trim();
    const limit = options?.limit;
    const offset = options?.offset ?? 0;
    const emailMatch = sql`lower(${orders.customerEmail}) = ${normalized}`;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.status, "paid"), emailMatch));

    let query = db
      .select()
      .from(orders)
      .where(and(eq(orders.status, "paid"), emailMatch))
      .orderBy(desc(orders.createdAt))
      .$dynamic();
    if (limit !== undefined) {
      query = query.limit(limit).offset(offset);
    }
    const rows = await query;

    return { orders: rows, total: count };
  }

  async updateOrderFulfillment(
    id: string,
    fulfillmentStatus: FulfillmentStatus,
    tracking?: { carrier?: string | null; trackingNumber?: string | null },
  ): Promise<{ order: Order; transitionedToFulfilled: boolean } | undefined> {
    if (fulfillmentStatus === "fulfilled") {
      // Record the carrier/tracking number supplied by the owner and stamp the
      // ship date. The WHERE clause only matches rows that aren't already
      // fulfilled, so concurrent requests can't both flip the order and both
      // fire the customer's shipping email — at most one wins the transition.
      const carrier = tracking?.carrier?.trim();
      const trackingNumber = tracking?.trackingNumber?.trim();
      const [transitioned] = await db
        .update(orders)
        .set({
          fulfillmentStatus,
          carrier: carrier ? carrier : null,
          trackingNumber: trackingNumber ? trackingNumber : null,
          shippedAt: new Date(),
        })
        .where(
          and(eq(orders.id, id), ne(orders.fulfillmentStatus, "fulfilled")),
        )
        .returning();

      if (transitioned) {
        return { order: transitioned, transitionedToFulfilled: true };
      }
      // No row changed: the order was already fulfilled (or doesn't exist).
      const existing = await this.getOrderById(id);
      return existing
        ? { order: existing, transitionedToFulfilled: false }
        : undefined;
    }

    // Reverting to unfulfilled wipes the shipping details.
    const [order] = await db
      .update(orders)
      .set({
        fulfillmentStatus,
        carrier: null,
        trackingNumber: null,
        shippedAt: null,
      })
      .where(eq(orders.id, id))
      .returning();
    return order
      ? { order, transitionedToFulfilled: false }
      : undefined;
  }

  async getOrderBySquareId(squareOrderId: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.squareOrderId, squareOrderId));
    return order || undefined;
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async recordPaidOrder(input: {
    squareOrderId: string;
    items: OrderItem[];
    totalCents: number;
    customerEmail?: string | null;
    customerName?: string | null;
    shippingAddress?: string | null;
  }): Promise<Order> {
    // Idempotent: if the buyer refreshes the success page we update the same
    // row (keyed by the Square order id) instead of inserting a duplicate.
    const customerEmail = input.customerEmail ?? null;
    const customerName = input.customerName ?? null;
    const shippingAddress = input.shippingAddress ?? null;
    const [order] = await db
      .insert(orders)
      .values({
        status: "paid",
        items: input.items,
        totalCents: input.totalCents,
        squareOrderId: input.squareOrderId,
        customerEmail,
        customerName,
        shippingAddress,
      })
      .onConflictDoUpdate({
        target: orders.squareOrderId,
        set: {
          status: "paid",
          items: input.items,
          totalCents: input.totalCents,
          customerEmail,
          customerName,
          shippingAddress,
        },
      })
      .returning();
    return order;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, email: insertUser.email.toLowerCase().trim() })
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));
    return user || undefined;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async createPasswordResetToken(
    token: InsertPasswordResetToken,
  ): Promise<PasswordResetToken> {
    const [created] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return created;
  }

  async getValidPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
        ),
      );
    if (!token) return undefined;
    // Reject expired tokens (single-use + time-limited).
    if (token.expiresAt.getTime() < Date.now()) return undefined;
    return token;
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }

  async deletePasswordResetTokensForUser(userId: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
  }

  // --- Media gallery ---------------------------------------------------------
  async getAllMediaItems(): Promise<MediaItem[]> {
    return await db
      .select()
      .from(mediaItems)
      .orderBy(mediaItems.collection, mediaItems.sortOrder, desc(mediaItems.createdAt));
  }

  async getMediaItem(id: string): Promise<MediaItem | undefined> {
    const [item] = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.id, id));
    return item;
  }

  async createMediaItem(item: {
    title: string;
    collection: string;
    mediaType: string;
    sourceType: string;
    url: string;
    fileName?: string | null;
    description?: string | null;
  }): Promise<MediaItem> {
    const [created] = await db
      .insert(mediaItems)
      .values({
        title: item.title,
        collection: item.collection,
        mediaType: item.mediaType,
        sourceType: item.sourceType,
        url: item.url,
        fileName: item.fileName ?? null,
        description: item.description ?? null,
      })
      .returning();
    return created;
  }

  async deleteMediaItem(id: string): Promise<MediaItem | undefined> {
    const [deleted] = await db
      .delete(mediaItems)
      .where(eq(mediaItems.id, id))
      .returning();
    return deleted;
  }

  // --- Profile ---------------------------------------------------------------
  async updateUserProfile(
    userId: string,
    fields: { displayName?: string | null; location?: string | null },
  ): Promise<User | undefined> {
    const set: Partial<typeof users.$inferInsert> = {};
    if (fields.displayName !== undefined) set.displayName = fields.displayName;
    if (fields.location !== undefined) set.location = fields.location;
    if (Object.keys(set).length === 0) {
      return await this.getUser(userId);
    }
    const [updated] = await db
      .update(users)
      .set(set)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserAvatar(
    userId: string,
    avatarUrl: string | null,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // --- Product reviews -------------------------------------------------------
  // Reviews are joined with the reviewer's CURRENT profile (photo + location)
  // at read time, so profile updates automatically flow into old reviews.
  private reviewWithReviewerSelect = {
    review: reviews,
    reviewerAvatarUrl: users.avatarUrl,
    reviewerLocation: users.location,
  };

  private static joinReviewRow(row: {
    review: Review;
    reviewerAvatarUrl: string | null;
    reviewerLocation: string | null;
  }): ReviewWithReviewer {
    return {
      ...row.review,
      reviewerAvatarUrl: row.reviewerAvatarUrl,
      reviewerLocation: row.reviewerLocation,
    };
  }

  async getReviewsForProduct(productName: string): Promise<ReviewWithReviewer[]> {
    const rows = await db
      .select(this.reviewWithReviewerSelect)
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.userId))
      .where(eq(reviews.productName, productName))
      .orderBy(desc(reviews.createdAt));
    return rows.map(DatabaseStorage.joinReviewRow);
  }

  async getRecentReviews(limit: number): Promise<ReviewWithReviewer[]> {
    const rows = await db
      .select(this.reviewWithReviewerSelect)
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
    return rows.map(DatabaseStorage.joinReviewRow);
  }

  async getReviewById(id: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async upsertReview(input: {
    productName: string;
    userId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    verified: boolean;
    location?: string | null;
    photoUrls?: string[];
  }): Promise<Review> {
    // One review per user per product: re-submitting replaces the earlier
    // review (and refreshes its timestamp so the update surfaces as recent).
    const photoUrls = Array.isArray(input.photoUrls) ? input.photoUrls.slice(0, 3) : [];
    const location = input.location ?? null;
    const [review] = await db
      .insert(reviews)
      .values({
        productName: input.productName,
        userId: input.userId,
        reviewerName: input.reviewerName,
        rating: input.rating,
        comment: input.comment,
        verified: input.verified,
        location,
        photoUrls,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.productName],
        set: {
          reviewerName: input.reviewerName,
          rating: input.rating,
          comment: input.comment,
          verified: input.verified,
          location,
          photoUrls,
          createdAt: new Date(),
        },
      })
      .returning();
    return review;
  }

  async deleteReview(id: string): Promise<Review | undefined> {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();
    return deleted;
  }

  async hasUserPurchasedProduct(
    email: string,
    productName: string,
  ): Promise<boolean> {
    // "Verified Purchase" = a recorded paid order under this email contains a
    // line item with this exact product name. Order items live in a jsonb
    // array, so we unnest it to match names.
    const result: any = await db.execute(sql`
      SELECT 1
      FROM orders
      WHERE status = 'paid'
        AND lower(customer_email) = lower(${email})
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(items) AS item
          WHERE item->>'name' = ${productName}
        )
      LIMIT 1
    `);
    return (result?.rows?.length ?? 0) > 0;
  }

  // Each paid order row = one completed checkout visit, regardless of how many
  // line items were in that cart.
  async countPaidOrdersByEmail(email: string): Promise<number> {
    const result: any = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM orders
      WHERE status = 'paid'
        AND lower(customer_email) = lower(${email})
    `);
    return Number(result?.rows?.[0]?.count ?? 0);
  }

  // Discount10% is earned by uploading at least one photo with a review, and
  // can be redeemed once (tracked in discount_redemptions).
  async hasUnusedPhotoReviewDiscount(userId: string): Promise<boolean> {
    const photoReviews: any = await db.execute(sql`
      SELECT 1
      FROM reviews
      WHERE user_id = ${userId}
        AND jsonb_array_length(COALESCE(photo_urls, '[]'::jsonb)) > 0
      LIMIT 1
    `);
    if ((photoReviews?.rows?.length ?? 0) === 0) return false;

    const [redeemed] = await db
      .select()
      .from(discountRedemptions)
      .where(
        and(
          eq(discountRedemptions.userId, userId),
          eq(discountRedemptions.code, DISCOUNT_CODES.PHOTO_REVIEW),
        ),
      )
      .limit(1);
    return !redeemed;
  }

  async recordDiscountRedemption(input: {
    userId: string;
    code: string;
    squareOrderId?: string | null;
  }): Promise<void> {
    await db.insert(discountRedemptions).values({
      userId: input.userId,
      code: input.code,
      squareOrderId: input.squareOrderId ?? null,
    });
  }
}

export const storage = new DatabaseStorage();
