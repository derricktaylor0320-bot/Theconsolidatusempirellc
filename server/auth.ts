import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "./db";
import { storage } from "./storage";
import { sendEmail, buildPasswordResetEmail } from "./email";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type PublicUser,
  type User,
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${derived.toString("hex")}.${salt}`;
}

async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  if (hashedBuf.length !== derived.length) return false;
  return timingSafeEqual(hashedBuf, derived);
}

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

// SHA-256 of the raw reset token. Only this hash is stored in the database,
// so even a DB leak can't be used to reset accounts.
function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Resolve the public origin so emailed reset links point at the right host.
// Prefer explicit config (APP_URL/PUBLIC_URL), then Replit's domain, then the
// incoming request's host as a last resort.
function getPublicBaseUrl(req: { headers: Record<string, any>; protocol: string }): string {
  const explicit = process.env.APP_URL || process.env.PUBLIC_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (replitDomain) return `https://${replitDomain}`;

  const forwardedProto = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || "http";
  const host = req.headers["host"];
  return `${proto}://${host}`;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};

export function setupAuth(app: Express) {
  const PgStore = connectPgSimple(session);

  app.set("trust proxy", 1);

  const sessionSecret =
    process.env.SESSION_SECRET || "khomplete-khemistri-hub-dev-secret";

  app.use(
    session({
      store: new PgStore({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const ok = await verifyPassword(password, user.passwordHash);
          if (!ok) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err as Error);
    }
  });

  // Register a new account and sign the visitor in.
  app.post("/api/auth/register", async (req, res, next) => {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.errors[0]?.message || "Invalid input" });
    }

    const { email, password, displayName } = result.data;

    try {
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res
          .status(409)
          .json({ error: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash,
        displayName: displayName || null,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(toPublicUser(user));
      });
    } catch (err) {
      next(err);
    }
  });

  // Sign in to the shared hub session.
  app.post("/api/auth/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.errors[0]?.message || "Invalid input" });
    }

    passport.authenticate(
      "local",
      (err: Error | null, user: User | false, info?: { message?: string }) => {
        if (err) return next(err);
        if (!user) {
          return res
            .status(401)
            .json({ error: info?.message || "Invalid email or password" });
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.json(toPublicUser(user));
        });
      },
    )(req, res, next);
  });

  // Clear the shared hub session.
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true });
      });
    });
  });

  // Current signed-in identity (or 401 when signed out).
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      return res.json(toPublicUser(req.user as User));
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  // Request a password reset link by email.
  // Always responds the same way whether or not the email exists, so the
  // endpoint can't be used to discover which emails have accounts.
  app.post("/api/auth/forgot-password", async (req, res, next) => {
    const result = forgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.errors[0]?.message || "Invalid input" });
    }

    const genericResponse = {
      ok: true,
      message:
        "If an account exists for that email, a password reset link is on its way.",
    };

    try {
      const user = await storage.getUserByEmail(result.data.email);
      if (!user) {
        return res.json(genericResponse);
      }

      // Invalidate any earlier reset links for this account.
      await storage.deletePasswordResetTokensForUser(user.id);

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await storage.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      const baseUrl = getPublicBaseUrl(req);
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
      const { subject, html, text } = buildPasswordResetEmail(resetUrl);
      await sendEmail({ to: user.email, subject, html, text });

      return res.json(genericResponse);
    } catch (err) {
      next(err);
    }
  });

  // Complete a password reset using a single-use, time-limited token.
  app.post("/api/auth/reset-password", async (req, res, next) => {
    const result = resetPasswordSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.errors[0]?.message || "Invalid input" });
    }

    const { token, password } = result.data;

    try {
      const tokenHash = hashResetToken(token);
      const record = await storage.getValidPasswordResetToken(tokenHash);
      if (!record) {
        return res.status(400).json({
          error: "This reset link is invalid or has expired. Please request a new one.",
        });
      }

      const passwordHash = await hashPassword(password);
      await storage.updateUserPassword(record.userId, passwordHash);
      // Single-use: burn the token (and any siblings) so it can't be reused.
      await storage.markPasswordResetTokenUsed(record.id);
      await storage.deletePasswordResetTokensForUser(record.userId);

      return res.json({
        ok: true,
        message: "Your password has been updated. You can now sign in.",
      });
    } catch (err) {
      next(err);
    }
  });
}
