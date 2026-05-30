import { type Product, type InsertProduct, products, type Subscriber, type InsertSubscriber, subscribers, type User, type InsertUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
