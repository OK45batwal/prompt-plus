# AI Prompt+ — Complete Sitemap

## Visual Sitemap

```
ai-prompt+.com
│
├─── PUBLIC PAGES (Marketing)
│   │
│   ├── / (Landing Page)
│   │   ├── Hero Section
│   │   ├── Trusted By
│   │   ├── Features
│   │   ├── Supported Models
│   │   ├── How It Works
│   │   ├── Prompt Examples
│   │   ├── Why AI Prompt+
│   │   ├── Testimonials
│   │   ├── FAQ
│   │   ├── Newsletter
│   │   └── Footer
│   │
│   ├── /features
│   │   ├── Prompt Enhancement
│   │   ├── AI Analysis
│   │   ├── Prompt Scoring
│   │   ├── Templates
│   │   ├── Collections
│   │   ├── Comparison
│   │   ├── History & Versioning
│   │   └── API Access
│   │
│   ├── /how-it-works
│   │   ├── Step 1: Write
│   │   ├── Step 2: Analyze
│   │   ├── Step 3: Enhance
│   │   ├── Step 4: Score
│   │   └── Step 5: Deploy
│   │
│   ├── /ai-models
│   │   ├── ChatGPT (GPT-4, GPT-4o, GPT-4o-mini)
│   │   ├── Claude (3.5 Sonnet, 3 Opus, 3 Haiku)
│   │   ├── Gemini (1.5 Pro, 1.5 Flash)
│   │   ├── Grok (2, 2 Mini)
│   │   ├── DeepSeek (V3, R1)
│   │   ├── Ollama (Local models)
│   │   ├── LM Studio (Local models)
│   │   ├── Midjourney (v6, v6.1)
│   │   ├── Stable Diffusion (SDXL, SD3)
│   │   └── DALL-E 3
│   │
│   ├── /blog
│   │   ├── /blog/[slug] (Individual Post)
│   │   ├── Categories: AI Tips, Tutorials, News, Case Studies
│   │   └── Search & Filter
│   │
│   ├── /docs
│   │   ├── /docs/quickstart
│   │   ├── /docs/api-reference
│   │   ├── /docs/prompt-engineering
│   │   ├── /docs/integrations
│   │   └── /docs/faq
│   │
│   ├── /contact
│   │   ├── Contact Form
│   │   ├── Email
│   │   └── Social Links
│   │
│   ├── /about
│   │   ├── Team
│   │   ├── Mission
│   │   └── Careers
│   │
│   ├── /terms
│   ├── /privacy
│   ├── /security
│   └── /status (System Status)
│
├─── AUTH PAGES
│   │
│   ├── /login
│   │   ├── Email/Password
│   │   ├── Google OAuth
│   │   ├── GitHub OAuth
│   │   └── Forgot Password Link
│   │
│   ├── /signup
│   │   ├── Email/Password
│   │   ├── Google OAuth
│   │   ├── GitHub OAuth
│   │   └── Terms Agreement
│   │
│   ├── /auth/callback
│   │   ├── OAuth Success → Dashboard
│   │   └── OAuth Error → Login with Error
│   │
│   ├── /auth/forgot-password
│   │   └── Email Input → Success Message
│   │
│   ├── /auth/reset-password
│   │   ├── New Password Input
│   │   └── Success → Auto Login
│   │
│   └── /auth/verify-email
│       ├── Verifying...
│       ├── Success
│       └── Resend Email
│
├─── DASHBOARD (Authenticated)
│   │
│   ├── /dashboard (Home)
│   │   ├── Welcome Header
│   │   ├── Quick Actions (New Prompt, Templates)
│   │   ├── Stats Cards (Total Prompts, Enhanced, Avg Score)
│   │   ├── Recent Prompts (Last 5)
│   │   ├── Favorites (Quick Access)
│   │   ├── Recent Activity
│   │   └── Usage This Month
│   │
│   ├── /dashboard/new (Prompt Builder)
│   │   ├── Input Textarea
│   │   ├── Model Selector (Dropdown)
│   │   ├── Category Selector
│   │   ├── Tone Selector
│   │   ├── Length Control
│   │   ├── Advanced Options (Expandable)
│   │   ├── Analyze Button
│   │   ├── Analysis Results (Side Panel)
│   │   │   ├── Intent
│   │   │   ├── Category
│   │   │   ├── Complexity
│   │   │   └── Suggestions
│   │   ├── Enhance Button
│   │   ├── Enhanced Result (Side Panel)
│   │   │   ├── Enhanced Prompt
│   │   │   ├── Changes Made
│   │   │   └── Score
│   │   ├── Actions
│   │   │   ├── Copy to Clipboard
│   │   │   ├── Save to Library
│   │   │   ├── Add to Collection
│   │   │   ├── Export (TXT/JSON/PDF)
│   │   │   └── Share (Link)
│   │   └── Version History (Sidebar)
│   │
│   ├── /dashboard/new/[templateId] (Template Builder)
│   │   ├── Template Preview
│   │   ├── Variable Inputs (Dynamic)
│   │   └── Same flow as /new after fill
│   │
│   ├── /dashboard/library (Prompt Library)
│   │   ├── Search Bar
│   │   ├── Filters
│   │   │   ├── Category
│   │   │   ├── Model
│   │   │   ├── Score Range
│   │   │   ├── Date Range
│   │   │   └── Tags
│   │   ├── Sort (Date, Score, Name, Usage)
│   │   ├── View Toggle (Grid/List)
│   │   ├── Prompt Cards
│   │   │   ├── Preview
│   │   │   ├── Score Badge
│   │   │   ├── Model Badge
│   │   │   ├── Quick Actions (Copy, Edit, Delete)
│   │   │   └── Favorite Toggle
│   │   ├── Pagination / Infinite Scroll
│   │   └── Empty State
│   │
│   ├── /dashboard/library/[id] (Prompt Detail)
│   │   ├── Prompt Header (Title, Date, Score)
│   │   ├── Original Prompt
│   │   ├── Enhanced Prompt
│   │   ├── Analysis Breakdown
│   │   │   ├── Intent
│   │   │   ├── Category
│   │   │   ├── Complexity
│   │   │   ├── Keywords
│   │   │   └── Missing Info
│   │   ├── Score Breakdown
│   │   │   ├── Clarity
│   │   │   ├── Specificity
│   │   │   ├── Context
│   │   │   └── Overall
│   │   ├── Version History
│   │   │   └── Version Timeline
│   │   ├── Actions
│   │   │   ├── Edit
│   │   │   ├── Duplicate
│   │   │   ├── Enhance Again
│   │   │   ├── Export
│   │   │   ├── Share
│   │   │   └── Delete
│   │   └── Related Prompts (Suggestions)
│   │
│   ├── /dashboard/history (Prompt History)
│   │   ├── Timeline View
│   │   ├── Search
│   │   ├── Filters (Date, Action, Model)
│   │   ├── History Items
│   │   │   ├── Action Icon
│   │   │   ├── Timestamp
│   │   │   ├── Prompt Preview
│   │   │   └── Quick Actions
│   │   └── Clear History Option
│   │
│   ├── /dashboard/collections (Collections)
│   │   ├── Create Collection Button
│   │   ├── Collection Cards
│   │   │   ├── Name
│   │   │   ├── Prompt Count
│   │   │   ├── Cover Image
│   │   │   └── Quick Actions
│   │   └── Empty State
│   │
│   ├── /dashboard/collections/[id] (Collection Detail)
│   │   ├── Collection Header
│   │   │   ├── Name
│   │   │   ├── Description
│   │   │   ├── Edit/Delete
│   │   │   └── Add Prompts Button
│   │   ├── Prompts Grid
│   │   │   └── Prompt Cards (same as library)
│   │   ├── Bulk Actions
│   │   │   ├── Select All
│   │   │   ├── Export Collection
│   │   │   └── Remove Selected
│   │   └── Empty State
│   │
│   ├── /dashboard/compare (Compare Prompts)
│   │   ├── Prompt Selector A (Search/Select)
│   │   ├── Prompt Selector B (Search/Select)
│   │   ├── Comparison View
│   │   │   ├── Side-by-Side Display
│   │   │   ├── Highlighted Differences
│   │   │   ├── Score Comparison
│   │   │   ├── Word Count Comparison
│   │   │   └── Readability Comparison
│   │   ├── Improvement Summary
│   │   │   ├── Changes Made
│   │   │   ├── Quality Gain
│   │   │   └── Suggestions
│   │   └── Actions
│   │       ├── Export Comparison
│   │       ├── Save as Version
│   │       └── Share
│   │
│   ├── /dashboard/analytics (Analytics)
│   │   ├── Overview Cards
│   │   │   ├── Total Prompts
│   │   │   ├── Total Enhancements
│   │   │   ├── Average Score
│   │   │   └── Time Saved
│   │   ├── Charts
│   │   │   ├── Prompts Over Time (Line)
│   │   │   ├── Score Distribution (Bar)
│   │   │   ├── Model Usage (Pie)
│   │   │   ├── Category Breakdown (Donut)
│   │   │   └── Enhancement Impact (Before/After)
│   │   ├── Period Selector (7d, 30d, 90d, Custom)
│   │   └── Export Report
│   │
│   ├── /dashboard/templates (Templates)
│   │   ├── Search
│   │   ├── Categories Sidebar
│   │   │   ├── Code Generation
│   │   │   ├── Content Writing
│   │   │   ├── Image Generation
│   │   │   ├── Data Analysis
│   │   │   ├── Email/Copywriting
│   │   │   ├── Education
│   │   │   ├── Business
│   │   │   └── Creative
│   │   ├── Template Cards
│   │   │   ├── Title
│   │   │   ├── Description
│   │   │   ├── Model Compatibility
│   │   │   ├── Usage Count
│   │   │   └── "Use Template" Button
│   │   └── Empty State
│   │
│   ├── /dashboard/templates/[id] (Template Detail)
│   │   ├── Template Preview
│   │   ├── Variables Form
│   │   │   ├── Variable 1 (Input)
│   │   │   ├── Variable 2 (Input)
│   │   │   └── ...
│   │   ├── Preview (Live)
│   │   ├── Use Template Button
│   │   ├── Related Templates
│   │   └── Share Template
│   │
│   ├── /dashboard/settings (Settings)
│   │   ├── Settings Layout (Tab-based)
│   │   ├── Profile Tab
│   │   │   ├── Avatar Upload
│   │   │   ├── Name
│   │   │   ├── Email
│   │   │   ├── Bio
│   │   │   └── Save Button
│   │   ├── API Keys Tab
│   │   │   ├── Connected Providers
│   │   │   │   ├── Provider Card
│   │   │   │   │   ├── Logo
│   │   │   │   │   ├── Name
│   │   │   │   │   ├── Status (Connected/Disconnected)
│   │   │   │   │   ├── Test Connection Button
│   │   │   │   │   ├── Usage Info
│   │   │   │   │   └── Disconnect Button
│   │   │   │   └── ...
│   │   │   ├── Add Provider Button
│   │   │   └── Provider Selection Modal
│   │   ├── Usage Tab
│   │   │   ├── Daily Usage
│   │   │   │   ├── Prompts Created
│   │   │   │   ├── Enhancements
│   │   │   │   └── API Calls
│   │   │   └── Usage History
│   │   ├── Notifications Tab
│   │   │   ├── Email Notifications
│   │   │   │   ├── Marketing emails
│   │   │   │   ├── Product updates
│   │   │   │   └── Usage alerts
│   │   │   ├── In-App Notifications
│   │   │   │   ├── Prompt saved
│   │   │   │   ├── API connected
│   │   │   │   └── Errors
│   │   │   └── Digest Frequency
│   │   ├── Appearance Tab
│   │   │   ├── Theme (Light/Dark/System)
│   │   │   ├── Accent Color
│   │   │   ├── Font Size
│   │   │   └── Compact Mode
│   │   └── Danger Zone
│   │       ├── Export All Data
│   │       ├── Delete Account
│   │       └── Confirm Modal
│   │
│   └── /dashboard/settings/api (API Keys Detail)
│       ├── Provider Setup Wizard
│       │   ├── Step 1: Select Provider
│       │   ├── Step 2: Enter API Key
│       │   ├── Step 3: Test Connection
│       │   └── Step 4: Confirm
│       └── API Usage Dashboard
│           ├── Calls This Month
│           ├── Cost Estimate
│           └── Error Rate
│
├─── API ROUTES (Backend)
│   │
│   ├── /api/v1/auth/*
│   ├── /api/v1/prompts/*
│   ├── /api/v1/templates/*
│   ├── /api/v1/collections/*
│   ├── /api/v1/compare
│   ├── /api/v1/analytics/*
│   ├── /api/v1/api-keys/*
│   ├── /api/v1/user/*
│   ├── /api/v1/usage/*
│   └── /api/ws (WebSocket)
│
└─── SPECIAL PAGES
    │
    ├── /share/[token] (Shared Prompt View)
    │   ├── Prompt Preview
    │   ├── Copy Button
    │   ├── CTA (Sign Up)
    │   └── Not Found
    │
    ├── /embed/[id] (Embeddable Widget)
    │   └── Minimal Prompt Display
    │
    └── /maintenance (Maintenance Page)
```

---

## Route Priority

### High Priority (MVP)

1. `/` — Landing Page
2. `/login` — Login
3. `/signup` — Sign Up
4. `/dashboard` — Dashboard Home
5. `/dashboard/new` — Prompt Builder
6. `/dashboard/library` — Prompt Library
7. `/dashboard/library/[id]` — Prompt Detail
8. `/dashboard/history` — Prompt History
9. `/dashboard/templates` — Templates
10. `/dashboard/settings` — Settings
11. `/dashboard/settings/api` — API Keys
12. `/docs` — Documentation

### Medium Priority (V2)

13. `/dashboard/collections` — Collections
14. `/dashboard/collections/[id]` — Collection Detail
15. `/dashboard/compare` — Compare Prompts
16. `/dashboard/analytics` — Analytics
17. `/features` — Features Page
18. `/blog` — Blog
19. `/contact` — Contact

### Low Priority (V3+)

20. `/ai-models` — AI Models Page
21. `/how-it-works` — How It Works
22. `/dashboard/templates/[id]` — Template Detail
23. `/share/[token]` — Shared Prompt
24. `/about` — About
25. `/terms` — Terms
26. `/privacy` — Privacy

---

## Navigation Groups

### Public Navigation

```
Home | Features | How It Works | AI Models | FAQ | Docs | Blog | Login | Get Started
```

### Dashboard Navigation

```
MAIN
├── Dashboard (home)
├── New Prompt (plus icon, highlighted)
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

### Mobile Navigation

```
Bottom Tab Bar:
├── Home (house icon)
├── New (plus icon, center, prominent)
├── Library (grid icon)
├── History (clock icon)
└── Profile (user icon)
```

---

## URL Patterns

### Public Pages
```
/                          → Landing
/features                  → Features
/pricing                   → Pricing
/blog                      → Blog listing
/blog/[slug]               → Blog post
/docs                      → Docs home
/docs/[section]            → Docs section
/docs/[section]/[article]  → Docs article
/contact                   → Contact
/about                     → About
```

### Auth Pages
```
/login                     → Login
/signup                    → Sign Up
/auth/callback             → OAuth callback
/auth/forgot-password      → Forgot password
/auth/reset-password       → Reset password
/auth/verify-email         → Email verification
```

### Dashboard Pages
```
/dashboard                 → Home
/dashboard/new             → New prompt
/dashboard/new/[template]  → Template prompt
/dashboard/library         → Library
/dashboard/library/[id]    → Prompt detail
/dashboard/history         → History
/dashboard/collections     → Collections
/dashboard/collections/[id]→ Collection detail
/dashboard/compare         → Compare
/dashboard/analytics       → Analytics
/dashboard/templates       → Templates
/dashboard/templates/[id]  → Template detail
/dashboard/settings        → Settings
/dashboard/settings/api    → API keys
/dashboard/settings/profile→ Profile
```

### Special URLs
```
/share/[token]             → Shared prompt
/embed/[id]                → Embeddable widget
/status                    → System status
```
