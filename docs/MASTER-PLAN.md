# AI Prompt+ — Master Plan (Free App)

## Product Vision

AI Prompt+ is a **completely free** AI SaaS platform that helps users convert simple prompts into detailed, professional, AI-optimized prompts. Users pay nothing — they bring their own AI API keys for unlimited usage, or use the app's built-in limited free tier.

---

## Key Decisions

### 1. Pricing Model: 100% Free

| Aspect | Decision |
|--------|----------|
| Subscription | ❌ None |
| Pricing page | ❌ Removed |
| Billing settings | ❌ Removed |
| Usage limits | Soft limits (generous, not restrictive) |
| Revenue model | Open source / community-driven |

### 2. AI Access: Hybrid Model

```
┌─────────────────────────────────────────────────────────────┐
│                    AI ACCESS MODEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OPTION A: Built-in Free Tier (No API key needed)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • 20 prompt enhancements/day                       │   │
│  │  • 50 prompt analyses/day                           │   │
│  │  • Basic models only (GPT-4o-mini, Claude Haiku)    │   │
│  │  • Powered by app's API keys                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPTION B: User's Own API Keys (Unlimited)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Unlimited enhancements                           │   │
│  │  • All models (GPT-4o, Claude Sonnet, Gemini, etc.) │   │
│  │  • User pays AI provider directly                   │   │
│  │  • Optional — app works without it                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPTION C: Local AI (Ollama/LM Studio)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Completely free and private                      │   │
│  │  • Requires local setup                             │   │
│  │  • Quality depends on local model                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Tech Stack

```
Frontend:
├── Framework: Next.js 14+ (App Router)
├── Language: TypeScript 5+
├── Styling: Tailwind CSS + shadcn/ui
├── State: Zustand + React Query
├── Forms: React Hook Form + Zod
└── Animation: Framer Motion

Backend:
├── Runtime: Node.js 20+
├── API: Next.js API Routes (Route Handlers)
├── ORM: Prisma
├── Database: PostgreSQL (Supabase free tier / Neon)
├── Auth: NextAuth.js v5
└── Cache: Upstash Redis (free tier)

AI:
├── Built-in: OpenAI API (app's key, rate-limited)
├── User keys: OpenAI, Anthropic, Google, Grok, DeepSeek
├── Local: Ollama, LM Studio
└── Fallback: No AI = basic prompt templates

Infrastructure:
├── Hosting: Vercel (free tier)
├── Database: Supabase (free tier) or Neon (free tier)
├── Cache: Upstash Redis (free tier)
├── Storage: Cloudflare R2 (free tier)
├── CDN: Vercel Edge Network
└── Monitoring: Sentry (free tier)
```

---

## Simplified Architecture

### What's Removed (vs. Paid SaaS)

```
❌ Pricing page
❌ Subscription plans
❌ Billing settings
❌ Payment processing (Stripe)
❌ Usage metering per plan
❌ Plan-gated features
❌ Upgrade prompts/banners
❌ Invoice management
❌ Trial period logic
```

### What's Simplified

```
✅ No plan field on User model
✅ No billing API endpoints
✅ No checkout flow
✅ No subscription webhook handling
✅ No usage-based restrictions (soft limits only)
✅ No plan comparison tables
✅ No upgrade/downgrade flows
```

### What's Added (Hybrid AI)

```
🔑 API Key Management (optional)
   ├── Connect OpenAI, Anthropic, Google, etc.
   ├── Test connection
   ├── Usage tracking
   └── Encrypted storage

🆓 Free Tier System
   ├── Daily limits (20 enhancements, 50 analyses)
   ├── Basic models only
   ├── No API key required
   └── Usage counter in UI

🏠 Local AI Support
   ├── Ollama integration
   ├── LM Studio integration
   └── Auto-detect local server
```

---

## Database Schema (Simplified)

### Core Tables

```
users
├── id (UUID, PK)
├── email (unique)
├── name
├── avatar
├── password_hash (nullable for OAuth)
├── provider (email/google/github)
├── provider_id
├── api_key (optional, for external access)
├── created_at
├── updated_at
└── last_login_at

prompts
├── id (UUID, PK)
├── user_id (FK → users)
├── title
├── original_text
├── enhanced_text
├── model
├── category
├── tone
├── length
├── score (JSONB)
├── tags (TEXT[])
├── is_saved
├── is_favorite
├── collection_id (FK → collections, nullable)
├── shared_token (unique, nullable)
├── created_at
├── updated_at
└── enhanced_at

versions
├── id (UUID, PK)
├── prompt_id (FK → prompts)
├── version (integer)
├── text
├── score (JSONB)
├── changes (JSONB)
└── created_at

analyses
├── id (UUID, PK)
├── prompt_id (FK → prompts)
├── intent
├── category
├── complexity
├── confidence
├── entities (JSONB)
├── context (JSONB)
├── keywords (TEXT[])
├── missing (JSONB)
├── suggestions (JSONB)
└── created_at

collections
├── id (UUID, PK)
├── user_id (FK → users)
├── name
├── description
├── color
├── icon
├── created_at
└── updated_at

templates
├── id (UUID, PK)
├── title
├── description
├── category
├── prompt (with {{variables}})
├── variables (JSONB)
├── model
├── usage_count
├── is_official
├── created_at
└── updated_at

api_keys (USER's keys, optional)
├── id (UUID, PK)
├── user_id (FK → users)
├── provider
├── api_key_enc (encrypted)
├── is_active
├── last_used_at
├── usage_count
├── created_at
└── updated_at

analytics
├── id (UUID, PK)
├── user_id (FK → users)
├── prompt_id (FK → prompts, nullable)
├── action
├── metadata (JSONB)
└── created_at

usage_logs
├── id (UUID, PK)
├── user_id (FK → users)
├── action
├── model
├── provider
├── tokens_in
├── tokens_out
├── cost
├── latency_ms
├── success
├── created_at

notifications
├── id (UUID, PK)
├── user_id (FK → users)
├── type
├── title
├── message
├── is_read
├── action_url
├── created_at
```

### Removed Tables (vs. Paid SaaS)

```
❌ subscriptions
❌ invoices
❌ payments
❌ plans
❌ features
❌ coupons
❌ webhooks (billing)
```

---

## API Endpoints (Simplified)

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /signup
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /forgot-password
│   └── POST /reset-password
│
├── prompts/
│   ├── GET /                    (list)
│   ├── POST /                   (create)
│   ├── GET /:id                 (read)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   ├── POST /analyze            (analyze)
│   ├── POST /enhance            (enhance)
│   ├── POST /:id/duplicate      (clone)
│   ├── POST /:id/export         (export)
│   └── GET /search              (search)
│
├── templates/
│   ├── GET /                    (list)
│   ├── GET /:id                 (get)
│   └── POST /:id/use            (use template)
│
├── collections/
│   ├── GET /                    (list)
│   ├── POST /                   (create)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   ├── POST /:id/prompts       (add prompts)
│   └── DELETE /:id/prompts/:pid (remove prompt)
│
├── compare/
│   └── POST /                   (compare two prompts)
│
├── analytics/
│   ├── GET /overview            (dashboard stats)
│   └── GET /usage               (usage stats)
│
├── api-keys/
│   ├── GET /                    (list providers)
│   ├── POST /                   (add provider)
│   ├── PUT /:id                 (update)
│   ├── DELETE /:id              (delete)
│   └── POST /:id/test           (test connection)
│
├── user/
│   ├── GET /profile             (get profile)
│   ├── PUT /profile             (update profile)
│   └── DELETE /account          (delete account)
│
└── usage/
    ├── GET /                    (get usage stats)
    └── GET /limits              (get remaining limits)
```

### Removed Endpoints (vs. Paid SaaS)

```
❌ /api/v1/billing/*
❌ /api/v1/subscriptions/*
❌ /api/v1/invoices/*
❌ /api/v1/checkout/*
❌ /api/v1/webhooks/stripe
```

---

## Frontend Pages (Simplified)

### Public Pages

```
/                           → Landing Page
/features                   → Features
/how-it-works               → How It Works
/ai-models                  → AI Models
/faq                        → FAQ
/blog                       → Blog
/contact                    → Contact
/about                      → About
/docs                       → Documentation
```

### Removed Public Pages

```
❌ /pricing                  → No pricing needed
```

### Auth Pages

```
/login                      → Login
/signup                     → Sign Up
/auth/callback              → OAuth callback
/auth/forgot-password       → Forgot password
/auth/reset-password        → Reset password
```

### Dashboard Pages

```
/dashboard                  → Home
/dashboard/new              → New Prompt
/dashboard/library          → Prompt Library
/dashboard/library/:id      → Prompt Detail
/dashboard/history          → Prompt History
/dashboard/collections      → Collections
/dashboard/collections/:id  → Collection Detail
/dashboard/compare          → Compare Prompts
/dashboard/analytics        → Analytics
/dashboard/templates        → Templates
/dashboard/templates/:id    → Template Detail
/dashboard/settings         → Settings
/dashboard/settings/api     → API Keys
/dashboard/settings/profile → Profile
/dashboard/settings/notifications → Notifications
```

### Removed Dashboard Pages

```
❌ /dashboard/settings/billing → No billing
```

---

## Navigation (Simplified)

### Public Navigation

```
Home | Features | How It Works | AI Models | FAQ | Docs | Blog | Login | Get Started
```

### Dashboard Sidebar

```
MAIN
├── Dashboard
├── New Prompt
└── Templates

CONTENT
├── Library
├── History
├── Collections
└── Compare

INSIGHTS
├── Analytics

ACCOUNT
├── API Keys
├── Settings
└── Profile
```

### Removed Sidebar Items

```
❌ Billing
```

---

## User Flow (Simplified)

### New User Onboarding

```
Landing Page
    │
    ▼
Click "Get Started"
    │
    ▼
Signup (Email/Google/GitHub)
    │
    ▼
Welcome Screen
    │
    ├── Option A: Start with Free Tier (no setup)
    │   └── 20 free enhancements/day
    │
    ├── Option B: Connect API Key (optional)
    │   └── Unlimited usage
    │
    └── Option C: Connect Local AI (optional)
        └── Ollama/LM Studio
    │
    ▼
Dashboard (Getting Started checklist)
```

### Prompt Enhancement Flow

```
New Prompt
    │
    ▼
User types prompt
    │
    ▼
Click "Analyze"
    │
    ├── Has API key? → Use user's key
    ├── Has local AI? → Use Ollama
    └── No key? → Use free tier (rate-limited)
    │
    ▼
Analysis Results
    │
    ▼
Click "Enhance"
    │
    ├── Has API key? → Use user's key
    ├── Has local AI? → Use Ollama
    └── No key? → Use free tier (rate-limited)
    │
    ▼
Enhanced Prompt + Score
    │
    ▼
Copy / Save / Export / Share
```

---

## Rate Limiting (Free Tier)

| Action | Free Tier Limit | With API Key |
|--------|-----------------|--------------|
| Prompt Analysis | 50/day | Unlimited |
| Prompt Enhancement | 20/day | Unlimited |
| Template Usage | Unlimited | Unlimited |
| Library Storage | 100 prompts | Unlimited |
| Collections | 10 | Unlimited |
| History | 30 days | Unlimited |
| Export | Unlimited | Unlimited |
| Share | Unlimited | Unlimited |

---

## File Structure

```
ai-prompt-plus/
├── app/
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── features/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── ai-models/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── contact/page.tsx
│   │   └── about/page.tsx
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── auth/callback/page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── library/[id]/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── collections/page.tsx
│   │   │   ├── collections/[id]/page.tsx
│   │   │   ├── compare/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── templates/page.tsx
│   │   │   ├── templates/[id]/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── api/page.tsx
│   │   │       ├── profile/page.tsx
│   │   │       └── notifications/page.tsx
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── prompts/route.ts
│   │       ├── prompts/[id]/route.ts
│   │       ├── prompts/analyze/route.ts
│   │       ├── prompts/enhance/route.ts
│   │       ├── templates/route.ts
│   │       ├── collections/route.ts
│   │       ├── analytics/route.ts
│   │       ├── api-keys/route.ts
│   │       ├── user/profile/route.ts
│   │       └── usage/route.ts
│   │
│   ├── layout.tsx
│   └── page.tsx (redirect to /)
│
├── components/
│   ├── ui/ (shadcn)
│   ├── landing/
│   │   ├── navbar.tsx
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── models.tsx
│   │   ├── workflow.tsx
│   │   ├── examples.tsx
│   │   ├── testimonials.tsx
│   │   ├── faq.tsx
│   │   ├── newsletter.tsx
│   │   └── footer.tsx
│   ├── dashboard/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── home/
│   │   │   ├── welcome-banner.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   ├── recent-prompts.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── library/
│   │   │   ├── prompt-grid.tsx
│   │   │   ├── prompt-card.tsx
│   │   │   └── search-filters.tsx
│   │   └── settings/
│   │       ├── api-keys.tsx
│   │       ├── profile.tsx
│   │       └── notifications.tsx
│   ├── prompt-builder/
│   │   ├── prompt-builder.tsx
│   │   ├── input-panel.tsx
│   │   ├── analysis-panel.tsx
│   │   ├── enhancement-panel.tsx
│   │   └── action-buttons.tsx
│   └── shared/
│       ├── empty-state.tsx
│       ├── loading-spinner.tsx
│       ├── toast.tsx
│       └── score-display.tsx
│
├── lib/
│   ├── db/
│   │   └── prisma.ts
│   ├── ai/
│   │   ├── analyzer.ts
│   │   ├── enhancer.ts
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── google.ts
│   │   └── ollama.ts
│   ├── auth/
│   │   └── next-auth.ts
│   ├── utils.ts
│   └── validators.ts
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-prompt.ts
│   ├── use-analysis.ts
│   ├── use-enhancement.ts
│   └── use-usage.ts
│
├── stores/
│   ├── auth-store.ts
│   ├── prompt-store.ts
│   └── ui-store.ts
│
├── types/
│   ├── user.ts
│   ├── prompt.ts
│   ├── analysis.ts
│   └── api.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── docs/
│   ├── MASTER-PLAN.md
│   ├── ARCHITECTURE.md
│   ├── SITEMAP.md
│   ├── USER-JOURNEY.md
│   ├── NAVIGATION.md
│   ├── WORKFLOWS.md
│   ├── DATABASE.md
│   ├── RESPONSIVE.md
│   ├── ERROR-HANDLING.md
│   ├── NOTIFICATIONS.md
│   ├── FUTURE-EXPANSION.md
│   └── COMPONENT-HIERARCHY.md
│
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Build Phases

### Phase 1: Foundation (Days 1-3)
- [ ] Project setup (Next.js, TypeScript, Tailwind, shadcn)
- [ ] Prisma schema + database setup
- [ ] Authentication (NextAuth.js - Email, Google, GitHub)
- [ ] Dashboard layout (sidebar, header, mobile nav)
- [ ] Basic routing

### Phase 2: Core Features (Days 4-7)
- [ ] Prompt Builder UI
- [ ] Prompt Analysis (AI integration)
- [ ] Prompt Enhancement (AI integration)
- [ ] Prompt Scoring
- [ ] Copy/Save/Export actions

### Phase 3: Content Management (Days 8-10)
- [ ] Prompt Library (CRUD, search, filters)
- [ ] Prompt History
- [ ] Collections (CRUD)
- [ ] Templates (browse, use)
- [ ] Prompt Comparison

### Phase 4: AI Integration (Days 11-14)
- [ ] Free tier system (rate limiting)
- [ ] User API key management
- [ ] Ollama/LM Studio integration
- [ ] Multiple provider support
- [ ] Usage tracking

### Phase 5: Polish & Launch (Days 15-18)
- [ ] Landing page
- [ ] Analytics dashboard
- [ ] Notifications system
- [ ] Error handling
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Deployment

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# AI (Free Tier - App's Keys)
OPENAI_API_KEY="..."  # For built-in free tier
FREE_TIER_DAILY_LIMIT=20

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Storage (Optional)
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to first prompt | < 30 seconds |
| Enhancement speed | < 5 seconds |
| Free tier daily limit | 20 enhancements |
| Library storage | 100 prompts/user |
| Page load time | < 2 seconds |
| Lighthouse score | > 90 |
| Mobile responsive | 100% |
| Browser support | Chrome, Firefox, Safari, Edge |
