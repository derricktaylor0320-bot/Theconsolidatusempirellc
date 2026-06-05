import { type Product, type InsertProduct, products, type Subscriber, type InsertSubscriber, subscribers, type User, type InsertUser, users, type PasswordResetToken, type InsertPasswordResetToken, passwordResetTokens } from "@shared/schema";
import { db } from "./db";
import { and, eq, isNull } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
