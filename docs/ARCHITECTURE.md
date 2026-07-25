# AI Prompt+ — Complete Information Architecture

## Project Overview

**AI Prompt+** is a **completely free** AI platform that converts simple prompts into detailed, professional, AI-optimized prompts for multiple AI models (ChatGPT, Claude, Gemini, Grok, DeepSeek, Ollama, LM Studio, Midjourney, Stable Diffusion, and more).

### Core Value Proposition

Users write a basic idea → AI Prompt+ analyzes it → enhances it into a production-ready prompt → scores it → saves/exports/shares it. **No subscription required.**

### Key Differentiators

- **100% Free** — No hidden costs, no premium tiers
- Hybrid AI access — Free tier + optional user API keys for unlimited usage
- Multi-model optimization (not just OpenAI)
- Prompt scoring and quality metrics
- Version history and comparison
- Team collaboration (future)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Web App │  │ Mobile   │  │ Browser  │  │ API Client  │  │
│  │ (Next.js)│  │ (Future) │  │ Ext (F) │  │ (SDK)       │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│       └─────────────┴─────────────┴───────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS / WebSocket
┌─────────────────────────┴───────────────────────────────────┐
│                        API LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ REST API │  │ WebSocket│  │ GraphQL  │  │ Rate       │  │
│  │ (Next.js)│  │ (Live)   │  │ (Future) │  │ Limiter    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └─────────────┴─────────────┴───────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     SERVICE LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Prompt   │  │ AI       │  │ User     │  │ Analytics  │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └─────────────┴─────────────┴───────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │PostgreSQL│  │ Redis    │  │ S3/R2    │  │ Vector DB  │  │
│  │ (Primary)│  │ (Cache)  │  │ (Files)  │  │ (Future)   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Application Routes

### Public Routes (Marketing)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Landing Page | Conversion-optimized homepage |
| `/features` | Features | Detailed feature breakdown |
| `/how-it-works` | How It Works | Step-by-step workflow |
| `/ai-models` | AI Models | Supported models showcase |
| `/faq` | FAQ | Common questions |
| `/blog` | Blog | Content marketing |
| `/blog/[slug]` | Blog Post | Individual article |
| `/contact` | Contact | Contact form |
| `/about` | About | Company info |
| `/docs` | Documentation | API & usage docs |
| `/docs/[section]` | Doc Section | Specific documentation |

### Authentication Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/login` | Login | Email/Google/GitHub login |
| `/signup` | Sign Up | Account creation |
| `/auth/callback` | OAuth Callback | Handle OAuth redirects |
| `/auth/reset-password` | Reset Password | Password recovery |
| `/auth/verify-email` | Email Verify | Email confirmation |

### Dashboard Routes (Authenticated)

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard Home | Overview & stats |
| `/dashboard/new` | New Prompt | Prompt builder |
| `/dashboard/new/[templateId]` | Template Prompt | Builder with template |
| `/dashboard/library` | Prompt Library | All saved prompts |
| `/dashboard/library/[id]` | Prompt Detail | View/edit single prompt |
| `/dashboard/history` | Prompt History | All prompts with filters |
| `/dashboard/collections` | Collections | Grouped prompts |
| `/dashboard/collections/[id]` | Collection Detail | Prompts in collection |
| `/dashboard/compare` | Compare Prompts | Side-by-side comparison |
| `/dashboard/analytics` | Analytics | Usage statistics |
| `/dashboard/templates` | Templates | Prompt templates |
| `/dashboard/templates/[id]` | Template Detail | Template preview |
| `/dashboard/settings` | Settings | Account settings |
| `/dashboard/settings/api` | API Keys | Manage API providers (optional) |
| `/dashboard/settings/profile` | Profile | User profile |
| `/dashboard/settings/notifications` | Notifications | Notification preferences |

---

## Page Component Hierarchy

### Landing Page Tree

```
LandingPage
├── Navbar
│   ├── Logo
│   ├── NavLinks (Features, Pricing, Docs, Blog)
│   └── AuthButtons (Login, Get Started)
├── HeroSection
│   ├── Headline
│   ├── Subheadline
│   ├── CTAButton
│   ├── PromptDemo (Interactive)
│   └── TrustBadges
├── TrustedBySection
│   └── LogoCloud (6-8 logos)
├── FeaturesSection
│   ├── SectionHeader
│   └── FeatureGrid
│       └── FeatureCard (x6)
├── SupportedModelsSection
│   ├── SectionHeader
│   └── ModelCarousel
│       └── ModelCard (x10+)
├── WorkflowSection
│   ├── SectionHeader
│   └── AnimatedDemo (Lottie/Rive)
├── ExamplesSection
│   ├── SectionHeader
│   └── PromptExampleTabs
│       └── BeforeAfterComparison (x4)
├── WhyUsSection
│   ├── SectionHeader
│   └── ComparisonTable
├── TestimonialsSection
│   ├── SectionHeader
│   └── TestimonialCarousel
│       └── TestimonialCard (x6)
├── FAQSection
│   ├── SectionHeader
│   └── AccordionList
│       └── AccordionItem (x8)
├── NewsletterSection
│   └── EmailCaptureForm
└── Footer
    ├── FooterLogo
    ├── FooterLinks (4 columns)
    ├── SocialLinks
    └── Copyright
```

### Dashboard Layout Tree

```
DashboardLayout
├── Sidebar
│   ├── Logo
│   ├── NavigationItems
│   │   ├── NavItem (Dashboard)
│   │   ├── NavItem (New Prompt)
│   │   ├── NavItem (Templates)
│   │   ├── NavItem (Library)
│   │   ├── NavItem (History)
│   │   ├── NavItem (Collections)
│   │   ├── NavItem (Compare)
│   │   ├── NavItem (Analytics)
│   │   └── Divider
│   │   ├── NavItem (API Keys)
│   │   ├── NavItem (Settings)
│   │   └── NavItem (Profile)
│   └── UsageBanner (Free tier usage display)
├── Header
│   ├── SearchBar (Global search)
│   ├── QuickActions (New Prompt, Import)
│   ├── NotificationsBell
│   └── UserMenu
│       ├── Avatar
│       ├── Dropdown
│       │   ├── Profile
│       │   ├── Settings
│       │   ├── Billing
│       │   └── Logout
│       └── PlanBadge
└── MainContent
    └── {children} (Route content)
```

---

## Data Flow Architecture

### Prompt Creation Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  Client-Side     │ ← Basic validation, character count
│  Validation      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway     │ ← Rate limiting, auth check
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prompt Service  │ ← Business logic, sanitization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Analyzer     │ ← Intent, category, complexity
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Enhancer     │ ← Template selection, enhancement
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Scoring Engine  │ ← Quality metrics, suggestions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database        │ ← Save prompt + analytics
└─────────────────┘
```

### Authentication Flow

```
User Action (Login/Signup)
    │
    ├── Email/Password ──→ Auth Service ──→ JWT Token
    │
    ├── Google OAuth ──→ Google API ──→ Auth Service ──→ JWT Token
    │
    ├── GitHub OAuth ──→ GitHub API ──→ Auth Service ──→ JWT Token
    │
    └── Guest Mode ──→ Temporary Token (24h expiry)
```

---

## API Architecture

### REST API Endpoints

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /signup
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /forgot-password
│   ├── POST /reset-password
│   └── POST /verify-email
├── prompts/
│   ├── GET /                    (list, with pagination)
│   ├── POST /                   (create)
│   ├── GET /:id                 (read)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   ├── POST /analyze           (analyze prompt)
│   ├── POST /enhance           (AI enhancement)
│   ├── POST /score             (get score)
│   ├── POST /:id/duplicate     (clone)
│   ├── POST /:id/export        (export as file)
│   └── GET /search             (full-text search)
├── templates/
│   ├── GET /                    (list categories)
│   ├── GET /:category           (list by category)
│   └── GET /:id                 (get template)
├── collections/
│   ├── GET /                    (list)
│   ├── POST /                   (create)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   ├── POST /:id/prompts       (add prompts)
│   └── DELETE /:id/prompts/:pid (remove prompt)
├── compare/
│   └── POST /                   (compare two prompts)
├── analytics/
│   ├── GET /overview            (dashboard stats)
│   ├── GET /prompts             (prompt analytics)
│   └── GET /usage               (API usage)
├── api-keys/
│   ├── GET /                    (list providers)
│   ├── POST /                   (add provider)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   └── POST /:id/test           (test connection)
├── user/
│   ├── GET /profile             (get profile)
│   ├── PUT /profile             (update profile)
│   ├── PUT /settings            (update settings)
│   └── DELETE /account          (delete account)
└── usage/
    ├── GET /                    (get usage stats)
    └── GET /limits              (get remaining limits)
```

### WebSocket Events

```
Connection: ws://api.ai-prompt+.com/ws

Client → Server:
├── prompt:analyze      (start analysis)
├── prompt:enhance      (start enhancement)
├── prompt:stream       (stream AI response)
└── ping

Server → Client:
├── prompt:analyzing    (analysis started)
├── prompt:progress     (progress update)
├── prompt:complete     (analysis done)
├── prompt:enhanced     (enhancement done)
├── prompt:stream       (streaming tokens)
├── prompt:error        (error occurred)
└── pong
```

---

## State Management

### Client-Side State

```
├── Auth State
│   ├── user (profile, plan, settings)
│   ├── token (JWT)
│   └── isAuthenticated
├── Prompt State
│   ├── currentPrompt (builder input)
│   ├── analysisResult (analyzer output)
│   ├── enhancedPrompt (enhancer output)
│   ├── score (quality metrics)
│   └── versions (history)
├── UI State
│   ├── sidebar (collapsed/expanded)
│   ├── theme (light/dark)
│   ├── modal (open/close)
│   └── notifications (queue)
└── Cache State
    ├── templates
    ├── collections
    └── recentPrompts
```

### Server-Side State

```
├── Session
│   ├── user session data
│   └── rate limit counters
├── Cache (Redis)
│   ├── user preferences
│   ├── template cache
│   └── API response cache
└── Queue (Bull/BullMQ)
    ├── prompt enhancement jobs
    ├── analytics aggregation
    └── email sending
```

---

## Security Architecture

### Authentication & Authorization

```
├── JWT Tokens
│   ├── Access Token (15min expiry)
│   └── Refresh Token (7d expiry, httpOnly cookie)
├── OAuth Providers
│   ├── Google (OpenID Connect)
│   └── GitHub (OAuth 2.0)
├── API Key Authentication
│   ├── HMAC-SHA256 signatures
│   └── Rate limiting per key
└── Free Tier Access
    ├── All features available
    ├── Daily usage limits (soft)
    └── Optional user API keys for unlimited
```

### Data Protection

```
├── Encryption
│   ├── HTTPS (TLS 1.3)
│   ├── Database (AES-256)
│   └── API keys (encrypted at rest)
├── Input Validation
│   ├── Zod schemas (client)
│   ├── Joi schemas (server)
│   └── SQL injection prevention (Prisma)
└── Rate Limiting
    ├── Global (100 req/min)
    ├── Per user (60 req/min)
    └── Per endpoint (varies)
```

---

## Scalability Considerations

### Horizontal Scaling

```
├── Load Balancer (Cloudflare/ALB)
├── Multiple API instances
├── Read replicas (PostgreSQL)
├── Redis cluster (cache)
└── CDN (static assets)
```

### Vertical Scaling

```
├── Connection pooling (PgBouncer)
├── Query optimization (Prisma)
├── Index optimization
└── Background job processing
```

### Cost Optimization (Free App)

```
├── Free tier: App's API keys (rate-limited)
├── User keys: Unlimited (user pays provider)
├── Local AI: Ollama/LM Studio (no cost)
├── Response caching (Redis)
├── Lazy loading (client)
├── Image optimization (Next.js Image)
└── Edge functions (Vercel/Cloudflare)
```

---

## Technology Stack

### Frontend

```
├── Framework: Next.js 14+ (App Router)
├── Language: TypeScript 5+
├── Styling: Tailwind CSS + shadcn/ui
├── State: Zustand + React Query
├── Forms: React Hook Form + Zod
├── Charts: Recharts or D3.js
├── Animation: Framer Motion + Lottie
└── Testing: Vitest + React Testing Library
```

### Backend

```
├── Runtime: Node.js 20+
├── Framework: Next.js API Routes
├── ORM: Prisma
├── Database: PostgreSQL 16+
├── Cache: Redis 7+
├── Queue: BullMQ
├── Auth: NextAuth.js or custom
└── Testing: Vitest + Supertest
```

### Infrastructure

```
├── Hosting: Vercel (Next.js) + Railway/Render
├── Database: Supabase / Neon / Aiven
├── Cache: Upstash Redis
├── Storage: Cloudflare R2 / AWS S3
├── CDN: Cloudflare
├── Monitoring: Sentry + PostHog
├── CI/CD: GitHub Actions
└── DNS: Cloudflare
```

---

## Content Strategy

### SEO Structure

```
├── Static Pages (pre-rendered)
│   ├── Landing page
│   ├── Features
│   ├── How It Works
│   └── About
├── Dynamic Pages (SSG/ISR)
│   ├── Blog posts
│   ├── Documentation
│   └── Model pages
└── Dynamic Pages (SSR)
    ├── Dashboard
    └── API responses
```

### Metadata

```
├── Title tags (primary + brand)
├── Meta descriptions (150-160 chars)
├── Open Graph tags (social sharing)
├── Twitter Card tags
├── Canonical URLs
├── Schema.org structured data
└── Sitemap.xml + robots.txt
```

---

## File Structure

```
ai-prompt-plus/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── features/
│   │   ├── how-it-works/
│   │   ├── ai-models/
│   │   ├── faq/
│   │   ├── blog/
│   │   └── contact/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── auth/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   ├── library/
│   │   │   ├── history/
│   │   │   ├── collections/
│   │   │   ├── compare/
│   │   │   ├── analytics/
│   │   │   ├── templates/
│   │   │   └── settings/
│   │   └── api/
│   └── api/
│       ├── v1/
│       │   ├── auth/
│       │   ├── prompts/
│       │   ├── templates/
│       │   ├── collections/
│       │   ├── analytics/
│       │   ├── api-keys/
│       │   └── usage/
│       └── ws/ (WebSocket)
├── components/
│   ├── ui/ (shadcn)
│   ├── landing/
│   ├── dashboard/
│   ├── prompt-builder/
│   └── shared/
├── lib/
│   ├── db/ (Prisma)
│   ├── ai/ (AI integrations)
│   ├── auth/
│   ├── utils/
│   └── validators/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
└── docs/
    ├── MASTER-PLAN.md
    ├── ARCHITECTURE.md
    ├── SITEMAP.md
    ├── USER-JOURNEY.md
    ├── WORKFLOWS.md
    └── ...
```
