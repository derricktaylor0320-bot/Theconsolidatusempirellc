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
import { createSsoToken, verifySsoToken } from "./sso";
import { RateLimiter } from "./rateLimit";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type PublicUser,
  type User,
} from "@shared/schema";
import { resolvePublicSiteUrl } from "@shared/site";

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

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    location: user.location,
  };
}

// Throttle password-reset requests to stop inbox spam and runaway email costs.
// Two independent windows: per normalized email (so one address can't be
// flooded) and per client IP (so one source can't blast many addresses).
const ONE_HOUR_MS = 1000 * 60 * 60;
const forgotPasswordEmailLimiter = new RateLimiter(3, ONE_HOUR_MS);
const forgotPasswordIpLimiter = new RateLimiter(10, ONE_HOUR_MS);

// SHA-256 of the raw reset token. Only this hash is stored in the database,
// so even a DB leak can't be used to reset accounts.
function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Resolve the public origin so emailed reset links point at the right host.
// Prefer APP_URL/PUBLIC_URL / production custom domain (tceholdings.org), then
// the incoming request's host as a last resort.
function getPublicBaseUrl(req: { headers: Record<string, any>; protocol: string }): string {
  const configured = resolvePublicSiteUrl();
  if (configured) return configured;

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

// Guards owner-only admin endpoints (e.g. the orders dashboard, which exposes
// customer contact details and shipping addresses). The allowlist is the
// comma-separated OWNER_EMAILS env var. If it's unset we fall back to "any
// signed-in user" — the pre-existing behavior — so the owner is never locked
// out of their own store, but we warn once so they know to lock it down.
let warnedOwnerAllowlistMissing = false;
export const requireOwner: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const allowlist = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    if (!warnedOwnerAllowlistMissing) {
      console.warn(
        "[auth] OWNER_EMAILS is not set — order admin endpoints (customer PII) are open to any signed-in account. Set OWNER_EMAILS to restrict access.",
      );
      warnedOwnerAllowlistMissing = true;
    }
    return next();
  }

  const email = (req.user as User | undefined)?.email?.toLowerCase();
  if (email && allowlist.includes(email)) {
    return next();
  }
  return res.status(403).json({ error: "Not authorized" });
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

  // --- Cross-app SSO handoff ------------------------------------------------
  // The hub owns login; embedded apps are separate deployments that can't read
  // the hub session cookie. These two endpoints let the hub hand the identity
  // to those apps: the hub mints a short-lived signed token, the embedded app
  // verifies it (here, or locally with the shared secret) and bootstraps its
  // own session — no second login.

  // Mint a short-lived SSO handoff token for the signed-in hub user.
  // The hub frontend fetches this and passes it to an embedded app.
  app.get("/api/auth/sso/token", requireAuth, (req, res) => {
    const { token, expiresIn } = createSsoToken(toPublicUser(req.user as User));
    res.json({ token, expiresIn });
  });

  // Verify an SSO handoff token. Embedded apps (any origin) call this to turn a
  // handoff token into the hub identity. Returns only the public identity, and
  // only for an unexpired, correctly-signed token, so it's safe to expose.
  const ssoVerifyHandler = (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    const token =
      (req.body && (req.body.token as string)) ||
      (req.query.token as string | undefined);

    const result = verifySsoToken(token || "");
    if (!result.valid) {
      return res.status(401).json({ valid: false, error: result.reason });
    }

    return res.json({
      valid: true,
      user: {
        id: result.payload.sub,
        email: result.payload.email,
        displayName: result.payload.name,
      },
    });
  };

  app.options("/api/auth/sso/verify", ssoVerifyHandler);
  app.post("/api/auth/sso/verify", ssoVerifyHandler);

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

    // Throttle before doing any account lookup or email send. We always return
    // the same generic response (even when limited), so the endpoint still can't
    // be used to discover which emails have accounts. The email window is keyed
    // on the normalized address so casing/whitespace can't bypass it.
    // Use Express's req.ip, which resolves the client IP from the proxy chain
    // per the app's `trust proxy` setting. We deliberately do NOT read
    // X-Forwarded-For directly, since an attacker could spoof that header to
    // rotate "IPs" and evade the per-IP limit.
    const normalizedEmail = result.data.email.trim().toLowerCase();
    const emailLimited = forgotPasswordEmailLimiter.hit(`email:${normalizedEmail}`).limited;
    const ipLimited = forgotPasswordIpLimiter.hit(`ip:${req.ip || "unknown"}`).limited;
    if (emailLimited || ipLimited) {
      return res.json(genericResponse);
    }

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
