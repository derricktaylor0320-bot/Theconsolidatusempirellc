# Khomplete Khemistri Apparel & Accessories - E-Commerce Platform

## Overview

The Consolidatus Empire LLC is a premium e-commerce platform featuring multiple brand divisions, including Khomplete Khemistri Apparel, accessories, creative studios, and integrated services. The platform is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence and Stripe for payment processing.

## Live Deployment

- **Host:** Railway — project "The Consolidatus Empire", environment `production`
- **Custom domain:** https://tceholdings.org — **TCE Holdings** = The Consolidatus Empire Holdings (Railway DNS/SSL validation may take up to ~48 hours after purchase/attach)
- **Interim Railway URL:** https://khomplete-khemistri-apparel.up.railway.app (works until the custom domain verifies)
- **Env:** Set `APP_URL=https://tceholdings.org` (or `PUBLIC_URL`) on Railway once the domain is live so checkout redirects, password-reset emails, review links, and Open Graph tags use the custom domain
- **Services:**
  - `poetic-balance` — the web app, deployed from GitHub repo `derricktaylor0320-bot/Theconsolidatusempirellc` (branch `main`)
  - `Postgres` — database holding all migrated store data (Stripe-synced catalog + app tables)
- **Deploys:** Railway auto-deploys from GitHub when `main` updates. A push to `main` triggers a new production deploy (no manual Railway "Deploy" click and no pull-request merge required for those direct `main` updates).
- See `.agents/memory/railway-portability.md` for full setup steps and gotchas.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **UI Framework:** Shadcn UI components built on Radix UI primitives
- **Styling:** Tailwind CSS v4 with custom design tokens
- **State Management:** TanStack Query (React Query) for server state
- **Build Tool:** Vite with custom plugins
- **Animation:** Framer Motion

**Design System:**
- Custom color scheme featuring burgundy background (#345 50% 8%) and metallic gold accents (#45 80% 55%)
- Typography: Oswald for display/headings, Inter for body text
- Component library using Shadcn UI "new-york" style with CSS variables
- Responsive design with mobile-first approach

**Key Frontend Components:**
- `ProductCard`: Displays products with images, pricing, and Stripe checkout integration
- `Navbar`: Sticky navigation with mobile sheet menu
- `Hero`: Animated landing section with Framer Motion
- `Footer`: Multi-column footer with brand links and social media

**Page Structure:**
- Home: Hero section with featured products
- Apparel/Accessories: Product listing pages filtered by type
- Canvas: Brand logo and badge showcase gallery
- Studio: Coming soon placeholder for recording studio
- FR2P/GuardConnect: Embedded iframes to external Replit apps
- Checkout Success/Cancel: Post-payment confirmation pages

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript (compiled via esbuild)
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM with Neon serverless PostgreSQL
- **Payment Processing:** Stripe with stripe-replit-sync for webhook management
- **Session Management:** Express-session with connect-pg-simple store

**API Design:**
- RESTful endpoints under `/api` prefix
- Stripe configuration endpoint (`/api/stripe/config`)
- Product listing endpoints with type filtering
- Checkout session creation endpoint
- Webhook handler for Stripe events

**Database Schema:**
The application uses two database schemas:

1. **Application Schema (public):**
   - `products` table with fields: id, title, price, category, description, imageUrl, productType

2. **Stripe Schema (managed by stripe-replit-sync):**
   - Automatically synced tables for Stripe resources (products, prices, customers, etc.)
   - Webhook tracking and event processing

**Data Flow:**
- Products are managed in Stripe as the source of truth
- stripe-replit-sync automatically mirrors Stripe data to PostgreSQL
- Frontend queries joined product+price data via custom storage layer
- Checkout sessions redirect to Stripe Checkout, then return to success/cancel pages

**Build Process:**
- Custom build script (`script/build.ts`) using esbuild for server bundling
- Vite handles client bundling with React optimization
- Selective dependency bundling to reduce cold start times
- Static file serving from `dist/public` in production

### Data Storage

**Primary Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- WebSocket-based connection pooling
- Environment-based connection string (`DATABASE_URL`)

**ORM Strategy:**
- Drizzle ORM with schema-first approach
- Type-safe queries with TypeScript inference
- Migration management via drizzle-kit
- Schema definition in `shared/schema.ts` for code sharing between client/server

**Storage Abstraction:**
- `DatabaseStorage` class implements `IStorage` interface
- CRUD operations for products (though Stripe is source of truth)
- `StripeStorage` class queries the synced Stripe schema with SQL

### Authentication & Authorization

**Current Implementation:**
- Shared hub sign-in (single sign-in across the whole hub site)
- Self-contained, host-agnostic session auth (no Replit Auth coupling) so it runs on Replit, Railway, or anywhere
- Email/password accounts with scrypt-hashed passwords (Node crypto), passport-local strategy
- Auth endpoints under `/api/auth` (register, login, logout, user); `server/auth.ts` holds setup + a `requireAuth` middleware
- Public e-commerce storefront still works without login; Stripe handles payment security and PCI compliance

**Session Management:**
- Express-session with PostgreSQL store (connect-pg-simple, `session` table auto-created)
- 30-day rolling cookie; secret from `SESSION_SECRET` env (dev fallback present — set in production)

**Cross-app note:**
- The embedded apps (Pocket Booster, Prospect Identity, FR2P Club, GuardConnect) are separate Replit deployments and cannot share this session. The hub shows clear login status on each embedded-app page (EmbedAuthBanner), but true SSO into those apps requires them to adopt a shared auth provider.

**Frontend auth:**
- `client/src/hooks/useAuth.ts` (TanStack Query against `/api/auth/user`)
- `/auth` page (login/signup), Navbar account menu + sign-in button, Hub signed-in/out status banner

### External Dependencies

**Payment Processing:**
- **Stripe:** Payment gateway and product catalog
  - Uses Replit Connectors for credential management
  - Environment-based configuration (development vs. production)
  - stripe-replit-sync library for automatic data synchronization
  - Managed webhooks for event processing

**Database Services:**
- **Neon:** Serverless PostgreSQL hosting
  - WebSocket connections for serverless compatibility
  - Connection pooling via @neondatabase/serverless

**Replit Platform Integration:**
- **Connectors API:** Fetches Stripe credentials dynamically
- **Environment Detection:** Differentiates between dev and production deployments
- **Vite Plugins:**
  - `@replit/vite-plugin-runtime-error-modal`: Development error overlay
  - `@replit/vite-plugin-cartographer`: Code navigation
  - `@replit/vite-plugin-dev-banner`: Development mode indicator
  - Custom `metaImagesPlugin`: Updates OpenGraph meta tags for Replit domains

**Embedded Applications:**
- FR2P Club: External Replit app embedded via iframe
- GuardConnect: External Replit app embedded via iframe

**Third-Party Libraries:**
- **UI Components:** Radix UI primitives (@radix-ui/*)
- **Forms:** React Hook Form with Zod validation
- **Dates:** date-fns for date formatting
- **Icons:** Lucide React icon library
- **Image Assets:** Static images in `attached_assets/` directory

**Fonts:**
- Google Fonts (Oswald, Inter) loaded via CDN in index.html