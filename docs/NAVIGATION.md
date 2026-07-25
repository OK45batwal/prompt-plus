# AI Prompt+ — Navigation Structure

## Navigation Overview

AI Prompt+ has three distinct navigation contexts:
1. **Public/Marketing** — for non-authenticated visitors
2. **Dashboard** — for authenticated users (desktop)
3. **Mobile** — for mobile devices

---

## 1. Public Navigation (Marketing)

### Top Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  [Logo]  Home  Features  How It Works  AI Models  FAQ  Docs  Blog  │
│                                                                     │
│                                    [Login]  [Get Started]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

```
PublicNavbar
├── Logo
│   └── Link to /
├── NavLinks (Desktop)
│   ├── Link: "/" → Home
│   ├── Link: "/features" → Features
│   ├── Link: "/how-it-works" → How It Works
│   ├── Link: "/ai-models" → AI Models
│   ├── Link: "/faq" → FAQ
│   ├── Link: "/docs" → Docs
│   ├── Link: "/blog" → Blog
│   └── Link: "/contact" → Contact
├── AuthButtons
│   ├── Button: "Login" → /login
│   └── Button: "Get Started" → /signup (primary)
└── MobileMenuButton (hamburger)
```

### Behavior

- **Scroll**: Background becomes opaque/blurred after 50px scroll
- **Active State**: Underline on current page link
- **Hover**: Subtle color change
- **Mobile**: Hamburger menu slides in from right
- **Sticky**: Navbar sticks to top on scroll
- **Transparent**: On landing page hero, becomes solid on scroll

### Mobile Menu (Slide-in)

```
┌─────────────────────────┐
│                    [X]  │
│                         │
│  Home                   │
│  Features               │
│  How It Works           │
│  AI Models              │
│  FAQ                    │
│  Docs                   │
│  Blog                   │
│  Contact                │
│                         │
│  ─────────────────────  │
│                         │
│  [Login]                │
│  [Get Started]          │
│                         │
└─────────────────────────┘
```

---

## 2. Dashboard Navigation

### Layout Structure

```
┌──────────┬─────────────────────────────────────────────────────────┐
│          │  Header                                                 │
│          │  ┌─────────────────────────────────────────────────┐   │
│ Sidebar  │  │ Search  │  Quick Actions  │  Notifications  │ Avatar│
│          │  └─────────────────────────────────────────────────┘   │
│ ┌──────┐ │                                                         │
│ │Logo  │ │  Main Content                                           │
│ │      │ │  ┌─────────────────────────────────────────────────┐   │
│ │ Nav  │ │  │                                                 │   │
│ │Items │ │  │           {children}                            │   │
│ │      │ │  │                                                 │   │
│ │      │ │  │                                                 │   │
│ │      │ │  └─────────────────────────────────────────────────┘   │
│ │      │ │                                                         │
│ │      │ │                                                         │
│ │      │ │                                                         │
│ │      │ │                                                         │
│ │Plan  │ │                                                         │
│ │Banner│ │                                                         │
│ └──────┘ │                                                         │
└──────────┴─────────────────────────────────────────────────────────┘
```

### Sidebar Navigation

```
DashboardSidebar
├── Logo
│   └── Link to /dashboard
├── Navigation Groups
│   │
│   ├── GROUP: Main
│   │   ├── NavItem
│   │   │   ├── Icon: Home
│   │   │   ├── Label: Dashboard
│   │   │   ├── Link: /dashboard
│   │   │   └── Badge: (none)
│   │   │
│   │   ├── NavItem (Highlighted/Primary)
│   │   │   ├── Icon: Plus
│   │   │   ├── Label: New Prompt
│   │   │   ├── Link: /dashboard/new
│   │   │   ├── Style: Primary color background
│   │   │   └── Shortcut: ⌘N
│   │   │
│   │   └── NavItem
│   │       ├── Icon: LayoutTemplate
│   │       ├── Label: Templates
│   │       ├── Link: /dashboard/templates
│   │       └── Badge: "New" (if new templates available)
│   │
│   ├── Divider
│   │
│   ├── GROUP: Content
│   │   ├── NavItem
│   │   │   ├── Icon: BookOpen
│   │   │   ├── Label: Library
│   │   │   ├── Link: /dashboard/library
│   │   │   └── Badge: prompt count
│   │   │
│   │   ├── NavItem
│   │   │   ├── Icon: Clock
│   │   │   ├── Label: History
│   │   │   ├── Link: /dashboard/history
│   │   │   └── Badge: (none)
│   │   │
│   │   ├── NavItem
│   │   │   ├── Icon: Folder
│   │   │   ├── Label: Collections
│   │   │   ├── Link: /dashboard/collections
│   │   │   └── Badge: collection count
│   │   │
│   │   └── NavItem
│   │       ├── Icon: GitCompare
│   │       ├── Label: Compare
│   │       └── Link: /dashboard/compare
│   │
│   ├── Divider
│   │
│   ├── GROUP: Insights
│   │   └── NavItem
│   │       ├── Icon: BarChart3
│   │       ├── Label: Analytics
│   │       └── Link: /dashboard/analytics
│   │
│   ├── Divider
│   │
│   └── GROUP: Account
│       ├── NavItem
│       │   ├── Icon: Key
│       │   ├── Label: API Keys
│       │   ├── Link: /dashboard/settings/api
│       │   └── Status: green dot (connected) / gray (disconnected)
│       │
│       ├── NavItem
│       │   ├── Icon: Settings
│       │   ├── Label: Settings
│       │   └── Link: /dashboard/settings
│       │
│       └── NavItem
│           ├── Icon: User
│           ├── Label: Profile
│           └── Link: /dashboard/settings/profile
│
├── UsageBanner
│   ├── Shows daily usage
│   ├── "5/20 enhancements used today"
│   └── [Connect API Key] for unlimited
│
└── CollapseButton
    └── Toggle sidebar collapsed/expanded
```

### Sidebar States

```
EXPANDED (Default - Desktop > 1024px)
┌──────────────┐
│  [Logo]      │
│              │
│  🏠 Dashboard│
│  ✨ New Prompt│
│  📋 Templates│
│  ──────────  │
│  📚 Library  │
│  🕐 History  │
│  📁 Collections│
│  ⚖️ Compare  │
│  ──────────  │
│  📊 Analytics│
│  ──────────  │
│  🔑 API Keys │
│  ⚙️ Settings │
│  👤 Profile  │
│              │
│ ┌──────────┐ │
│ │ Usage:   │ │
│ │ 5/20     │ │
│ │ [Add Key]│ │
│ └──────────┘ │
└──────────────┘

COLAPSED (Desktop < 1024px)
┌──────┐
│  [Logo]│
│      │
│  🏠  │
│  ✨  │
│  📋  │
│  ──  │
│  📚  │
│  🕐  │
│  📁  │
│  ⚖️  │
│  ──  │
│  📊  │
│  ──  │
│  🔑  │
│  ⚙️  │
│  👤  │
│      │
│  [▸] │
└──────┘
(Tooltips on hover)
```

### Header Bar

```
DashboardHeader
├── Left Section
│   ├── SidebarToggle (hamburger on mobile)
│   ├── Breadcrumb (optional)
│   │   └── e.g., Dashboard > Library > Prompt #123
│   └── SearchBar
│       ├── Search icon
│       ├── Input: "Search prompts, templates..."
│       ├── Keyboard shortcut: ⌘K
│       └── Dropdown: Recent searches, suggestions
│
├── Center Section
│   └── QuickActions
│       ├── Button: "New Prompt" (primary)
│       └── Button: "Import" (secondary)
│
├── Right Section
│   ├── ThemeToggle
│   │   ├── Sun icon (light mode)
│   │   └── Moon icon (dark mode)
│   │
│   ├── NotificationsBell
│   │   ├── Bell icon
│   │   ├── Badge: notification count
│   │   └── Dropdown: Recent notifications
│   │
│   └── UserMenu
│       ├── Avatar
│       ├── Name
│       └── Dropdown:
│           ├── Profile
│           ├── Settings
│           ├── API Keys
│           ├── Usage
│           ├── ──────
│           ├── Keyboard Shortcuts
│           ├── Help & Support
│           ├── ──────
│           └── Logout
```

### Command Palette (⌘K)

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search prompts, templates, settings...       │
├─────────────────────────────────────────────────┤
│                                                 │
│  RECENT                                         │
│  ┌───────────────────────────────────────────┐  │
│  │ 📝 "Blog post about AI"                   │  │
│  │ 📝 "Code review prompt"                   │  │
│  │ 📝 "Email template"                       │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  QUICK ACTIONS                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ ➕ Create new prompt                       │  │
│  │ 📋 Open templates                         │  │
│  │ ⚖️ Compare prompts                        │  │
│  │ 📊 View analytics                         │  │
│  │ ⚙️ Open settings                          │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  RESULTS                                        │
│  ┌───────────────────────────────────────────┐  │
│  │ (search results appear here)              │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 3. Mobile Navigation

### Bottom Tab Bar

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              (Main Content Area)                │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  🏠      📚      ➕      🕐      👤            │
│  Home  Library   New   History  Profile         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Component Breakdown

```
MobileTabBar
├── TabItem
│   ├── Icon: Home
│   ├── Label: Home
│   ├── Link: /dashboard
│   └── Active: current route
│
├── TabItem
│   ├── Icon: BookOpen
│   ├── Label: Library
│   ├── Link: /dashboard/library
│   └── Active: current route
│
├── TabItem (Center/Prominent)
│   ├── Icon: Plus (larger, in circle)
│   ├── Label: New
│   ├── Link: /dashboard/new
│   ├── Style: Primary color, elevated
│   └── Action: Opens prompt builder
│
├── TabItem
│   ├── Icon: Clock
│   ├── Label: History
│   ├── Link: /dashboard/history
│   └── Active: current route
│
└── TabItem
    ├── Icon: User
    ├── Label: Profile
    ├── Link: /dashboard/settings/profile
    └── Active: current route
```

### Mobile Menu (Swipe/Long Press)

```
Swipe up from bottom or long-press avatar:
┌─────────────────────────────────────────┐
│                                         │
│  [Avatar]  John Doe                    │
│            Free Plan                   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🏠 Dashboard                          │
│  ✨ New Prompt                         │
│  📋 Templates                          │
│  📚 Library                            │
│  🕐 History                            │
│  📁 Collections                        │
│  ⚖️ Compare                            │
│  📊 Analytics                          │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🔑 API Keys                           │
│  ⚙️ Settings                           │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🌙 Dark Mode [Toggle]                 │
│  🚪 Logout                             │
│                                         │
└─────────────────────────────────────────┘
```

### Mobile Search

```
Search in header:
┌─────────────────────────────────────────┐
│  [←] 🔍 Search prompts...        [🎤]  │
└─────────────────────────────────────────┘

Full-screen search:
┌─────────────────────────────────────────┐
│  [←] 🔍 Search prompts...        [🎤]  │
├─────────────────────────────────────────┤
│                                         │
│  RECENT                                 │
│  📝 "Blog post about AI"               │
│  📝 "Code review prompt"               │
│                                         │
│  SUGGESTIONS                            │
│  📝 "Generate Python function"         │
│  📝 "Write email sequence"             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. Navigation State Management

### Active State Logic

```typescript
// Route matching for active states
const isActive = (route: string, currentPath: string) => {
  if (route === '/dashboard') {
    return currentPath === '/dashboard';
  }
  return currentPath.startsWith(route);
};

// Example:
// /dashboard/library → Library is active
// /dashboard/library/123 → Library is active
// /dashboard/new → New Prompt is active
```

### Navigation State Persistence

```
├── Sidebar collapsed/expanded → localStorage
├── Last active route → session storage
├── Search history → localStorage (last 10)
├── Theme preference → localStorage
└── Mobile tab state → in-memory (resets on reload)
```

### Keyboard Shortcuts

```
Global:
├── ⌘K / Ctrl+K → Open command palette
├── ⌘N / Ctrl+N → New prompt
├── ⌘/ / Ctrl+/ → Show shortcuts
├── ⌘, / Ctrl+, → Open settings
└── Esc → Close modals/overlays

Dashboard:
├── 1-5 → Switch tabs (if tabbed view)
├── ← → → Navigate between panels
└── Enter → Select/open item

Prompt Builder:
├── ⌘Enter / Ctrl+Enter → Analyze
├── ⌘⇧Enter → Enhance
├── ⌘C / Ctrl+C → Copy (when result focused)
└── ⌘S / Ctrl+S → Save
```

---

## 5. Navigation Responsive Breakpoints

```
Desktop Large:  > 1280px
├── Expanded sidebar
├── Full header
└── Full tab labels

Desktop Medium: 1024px - 1280px
├── Collapsed sidebar (icons only)
├── Full header
└── Full tab labels

Tablet:         768px - 1024px
├── Hidden sidebar (hamburger toggle)
├── Compact header
└── Full tab labels

Mobile:         < 768px
├── Hidden sidebar
├── Compact header
├── Bottom tab bar
└── Tab labels (icons + text)
```

---

## 6. Navigation Accessibility

### ARIA Labels

```html
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/features" aria-current="page">
        Features
      </a>
    </li>
  </ul>
</nav>

<aside aria-label="Dashboard sidebar">
  <nav aria-label="Dashboard navigation">
    <ul role="menubar" aria-orientation="vertical">
      <li role="none">
        <a role="menuitem" href="/dashboard">
          <span class="sr-only">Dashboard</span>
        </a>
      </li>
    </ul>
  </nav>
</aside>
```

### Focus Management

```
├── Tab order follows visual order
├── Skip navigation link (skip to main content)
├── Focus trap in modals
├── Focus restoration on modal close
├── Active link announced to screen readers
└── Keyboard navigation for all interactive elements
```

### Screen Reader Support

```
├── Current page announced: "Dashboard, current page"
├── Sidebar state announced: "Sidebar expanded/collapsed"
├── Navigation landmark: "Main navigation"
├── Sidebar landmark: "Dashboard navigation"
└── Search landmark: "Search"
```
