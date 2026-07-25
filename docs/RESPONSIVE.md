# AI Prompt+ — Responsive Design Strategy

## Breakpoint System

```
Mobile:         < 640px    (sm)
Tablet:         640-1024px (md)
Desktop:        1024-1280px (lg)
Desktop Large:  > 1280px   (xl)
```

### CSS Variables for Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 1024px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1536px;
}
```

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '1024px',
      'lg': '1280px',
      'xl': '1536px',
    },
  },
}
```

---

## Navigation Responsive Behavior

### Desktop (> 1280px)

```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  Header                                             │
│          │  ┌─────────────────────────────────────────────┐   │
│ Sidebar  │  │ Search  │  Quick Actions  │  Notifications  │ Avatar│
│ (Full)   │  └─────────────────────────────────────────────┘   │
│          │                                                     │
│ ┌──────┐ │  Main Content                                       │
│ │Logo  │ │  ┌─────────────────────────────────────────────┐   │
│ │      │ │  │                                             │   │
│ │ Nav  │ │  │           {children}                        │   │
│ │Items │ │  │                                             │   │
│ │(text │ │  └─────────────────────────────────────────────┘   │
│ │+icon)│ │                                                     │
│ │      │ │                                                     │
│ │Plan  │ │                                                     │
│ │Banner│ │                                                     │
│ └──────┘ │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

**Characteristics:**
- Sidebar: 240px width, always visible
- Sidebar state: Expanded with text labels
- Header: Full height, all actions visible
- Content: Fluid, max-width 1400px

---

### Tablet (640-1024px)

```
┌──────┬─────────────────────────────────────────────────────────┐
│      │  Header                                                 │
│      │  ┌─────────────────────────────────────────────────┐   │
│ Side │  │ [☰]  Search  │  Quick Actions  │  🔔  👤       │   │
│ bar  │  └─────────────────────────────────────────────────┘   │
│(icons│                                                         │
│ only)│  Main Content                                           │
│      │  ┌─────────────────────────────────────────────────┐   │
│ ┌──┐ │  │                                                 │   │
│ │🏠│ │  │           {children}                            │   │
│ │✨│ │  │                                                 │   │
│ │📋│ │  └─────────────────────────────────────────────────┘   │
│ │📚│ │                                                         │
│ │🕐│ │                                                         │
│ │📁│ │                                                         │
│ │⚖️│ │                                                         │
│ │📊│ │                                                         │
│ │──│ │                                                         │
│ │🔑│ │                                                         │
│ │💳│ │                                                         │
│ │⚙️│ │                                                         │
│ │👤│ │                                                         │
│ └──┘ │                                                         │
└──────┴─────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Sidebar: 72px width, icons only (expandable on hover)
- Sidebar state: Collapsed by default
- Header: Compact, some labels hidden
- Content: Fluid, full width

---

### Mobile (< 640px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [☰]  AI Prompt+                        🔔  👤          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Main Content                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    {children}                           │   │
│  │                                                         │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Bottom Tab Bar                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  🏠      📚      ➕      🕐      👤                    │   │
│  │ Home  Library   New   History  Profile                  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Sidebar: Hidden (slide-in on hamburger)
- Bottom tab bar: Fixed, always visible
- Header: Minimal, logo + actions
- Content: Full width, padded

---

## Page-Specific Responsive Layouts

### Landing Page

#### Desktop
```
┌─────────────────────────────────────────────────────────────┐
│  Nav: Full horizontal navigation                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hero: 2-column layout                                      │
│  ┌─────────────────────┬─────────────────────┐             │
│  │  Headline + CTA     │  Interactive Demo    │             │
│  │  (50%)              │  (50%)               │             │
│  └─────────────────────┴─────────────────────┘             │
│                                                             │
│  Features: 3-column grid                                    │
│  ┌─────────┬─────────┬─────────┐                           │
│  │ Feature │ Feature │ Feature │                           │
│  │   1     │   2     │   3     │                           │
│  └─────────┴─────────┴─────────┘                           │
│  ┌─────────┬─────────┬─────────┐                           │
│  │ Feature │ Feature │ Feature │                           │
│  │   4     │   5     │   6     │                           │
│  └─────────┴─────────┴─────────┘                           │
│                                                             │
│  Pricing: 3-column comparison                               │
│  ┌─────────┬─────────┬─────────┐                           │
│  │  Free   │  Pro    │  Team   │                           │
│  │         │(Popular)│         │                           │
│  └─────────┴─────────┴─────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tablet
```
┌─────────────────────────────────────────────────────────────┐
│  Nav: Hamburger menu                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hero: Stacked layout                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Headline + CTA (100%)                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Interactive Demo (100%)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Features: 2-column grid                                    │
│  ┌─────────────┬─────────────┐                             │
│  │   Feature   │   Feature   │                             │
│  │     1       │     2       │                             │
│  └─────────────┴─────────────┘                             │
│  ┌─────────────┬─────────────┐                             │
│  │   Feature   │   Feature   │                             │
│  │     3       │     4       │                             │
│  └─────────────┴─────────────┘                             │
│  ┌─────────────┬─────────────┐                             │
│  │   Feature   │   Feature   │                             │
│  │     5       │     6       │                             │
│  └─────────────┴─────────────┘                             │
│                                                             │
│  Pricing: Scrollable horizontal                             │
│  ┌─────────┬─────────┬─────────┐                           │
│  │  Free   │  Pro    │  Team   │ ← Swipeable              │
│  └─────────┴─────────┴─────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────────────────────────────────────────────────┐
│  Nav: Hamburger menu                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Hero: Stacked, centered                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Headline (centered)                         │   │
│  │          CTA Button                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Interactive Demo                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Features: 1-column stack                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Feature 1                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Feature 2                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Pricing: Stacked cards                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Free Plan                        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Pro Plan (Highlighted)           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Team Plan                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Prompt Builder

#### Desktop
```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  Header                                             │
│ Sidebar  │  ┌─────────────────────────────────────────────┐   │
│          │  │                                             │   │
│          │  └─────────────────────────────────────────────┘   │
│ ┌──────┐ │                                                     │
│ │      │ │  Main Content                                       │
│ │      │ │  ┌─────────────────────────┬───────────────────┐   │
│ │      │ │  │                         │                   │   │
│ │      │ │  │   Input Panel           │  Results Panel    │   │
│ │      │ │  │   (50%)                 │  (50%)            │   │
│ │      │ │  │                         │                   │   │
│ │      │ │  │   - Textarea            │  - Analysis       │   │
│ │      │ │  │   - Model selector      │  - Enhanced       │   │
│ │      │ │  │   - Options             │  - Score          │   │
│ │      │ │  │   - Analyze button      │  - Actions        │   │
│ │      │ │  │                         │                   │   │
│ │      │ │  └─────────────────────────┴───────────────────┘   │
│ └──────┘ │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

#### Tablet
```
┌──────┬──────────────────────────────────────────────────────────┐
│      │  Header                                                  │
│      │  ┌──────────────────────────────────────────────────┐   │
│ Side │  │                                                  │   │
│ bar  │  └──────────────────────────────────────────────────┘   │
│(icons│                                                          │
│ only)│  Main Content                                            │
│      │  ┌──────────────────────────────────────────────────┐   │
│ ┌──┐ │  │                                                  │   │
│ │  │ │  │   Input Panel (100%)                             │   │
│ │  │ │  │                                                  │   │
│ │  │ │  │   - Textarea                                     │   │
│ │  │ │  │   - Options (collapsible)                        │   │
│ │  │ │  │   - [Analyze] button                             │   │
│ │  │ │  │                                                  │   │
│ │  │ │  └──────────────────────────────────────────────────┘   │
│ │  │ │  ┌──────────────────────────────────────────────────┐   │
│ │  │ │  │                                                  │   │
│ │  │ │  │   Results Panel (below, collapsible)             │   │
│ │  │ │  │                                                  │   │
│ └──┘ │  │   - Analysis / Enhanced / Score tabs             │   │
└──────┴──┴──────────────────────────────────────────────────┘──┘
```

#### Mobile
```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [←]  New Prompt                             [Save] [⋯]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  [Write your prompt here...]                            │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Model: [ChatGPT ▼]                                            │
│                                                                 │
│  ▶ Advanced Options                                             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              [ 🔍 Analyze Prompt ]                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Results (Full-screen modal or bottom sheet)                    │
│                                                                 │
│  [Analysis] [Enhanced] [Score] ← Tabs                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  (Selected tab content)                                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [📋 Copy] [💾 Save] [📤 Export] [🔗 Share]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🏠      📚      ➕      🕐      👤                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Library Page

#### Desktop
```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  Header                                             │
│ Sidebar  │  ┌─────────────────────────────────────────────┐   │
│          │  │ Search: [Search prompts...]    [Filters ▼]  │   │
│          │  └─────────────────────────────────────────────┘   │
│ ┌──────┐ │                                                     │
│ │      │ │  Main Content                                       │
│ │      │ │  ┌─────────────────────────────────────────────┐   │
│ │      │ │  │  [Grid] [List]  Sort: [Date ▼]             │   │
│ │      │ │  ├─────────────────────────────────────────────┤   │
│ │      │ │  │                                             │   │
│ │      │ │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │   │
│ │      │ │  │  │     │ │     │ │     │ │     │ │     │ │   │
│ │      │ │  │  │Card │ │Card │ │Card │ │Card │ │Card │ │   │
│ │      │ │  │  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │ │   │
│ │      │ │  │  │     │ │     │ │     │ │     │ │     │ │   │
│ │      │ │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │   │
│ │      │ │  │                                             │   │
│ │      │ │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │   │
│ │      │ │  │  │Card │ │Card │ │Card │ │Card │ │Card │ │   │
│ │      │ │  │  │  6  │ │  7  │ │  8  │ │  9  │ │ 10  │ │   │
│ │      │ │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │   │
│ │      │ │  │                                             │   │
│ │      │ │  └─────────────────────────────────────────────┘   │
│ └──────┘ │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [☰]  Library                       [🔍] [Grid] [⋯]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Filters: Category ▼] [Model ▼] [Score ▼] [Clear]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Prompt Card 1                                  │   │   │
│  │  │  Title | Model | Score | [⋯]                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Prompt Card 2                                  │   │   │
│  │  │  Title | Model | Score | [⋯]                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Prompt Card 3                                  │   │   │
│  │  │  Title | Model | Score | [⋯]                    │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Load More]                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🏠      📚      ➕      🕐      👤                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Compare Page

#### Desktop
```
┌──────────┬─────────────────────────────────────────────────────┐
│          │  Header                                             │
│ Sidebar  │  ┌─────────────────────────────────────────────┐   │
│          │  │ Select A: [Search ▼]    Select B: [Search ▼]│   │
│          │  └─────────────────────────────────────────────┘   │
│ ┌──────┐ │                                                     │
│ │      │ │  Main Content                                       │
│ │      │ │  ┌─────────────────────┬─────────────────────┐     │
│ │      │ │  │                     │                     │     │
│ │      │ │  │  Prompt A           │  Prompt B           │     │
│ │      │ │  │  (50%)              │  (50%)              │     │
│ │      │ │  │                     │                     │     │
│ │      │ │  └─────────────────────┴─────────────────────┘     │
│ │      │ │  ┌─────────────────────────────────────────────┐   │
│ │      │ │  │  Diff View / Changes Summary                │   │
│ │      │ │  └─────────────────────────────────────────────┘   │
│ └──────┘ │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

#### Mobile
```
┌─────────────────────────────────────────────────────────────────┐
│  Header                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [←]  Compare Prompts                       [Export] [⋯] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Original] [Enhanced] ← Tabs                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  (Selected prompt content)                              │   │
│  │                                                         │   │
│  │  Score: 45/100                                          │   │
│  │  Words: 8                                               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Changes Summary                                        │   │
│  │  ✅ Added role context                                  │   │
│  │  ✅ Added structure                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [📤 Export] [💾 Save as Version]                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  🏠      📚      ➕      🕐      👤                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Touch Interactions

### Mobile Gestures

```
Swipe Right:     Open sidebar (from left edge)
Swipe Left:      Close sidebar
Swipe Up:        Load more (infinite scroll)
Swipe Down:      Refresh (pull-to-refresh)
Long Press:      Context menu
Pinch:           Zoom (in image prompt builder)
Double Tap:      Quick action (copy/paste)
```

### Touch Targets

```css
/* Minimum touch target size */
.button, 
.link, 
.input {
  min-height: 44px;
  min-width: 44px;
}

/* Touch-friendly spacing */
.touch-target {
  padding: 12px;
  margin: 8px;
}
```

---

## Typography Scaling

### Desktop
```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

### Mobile
```css
@media (max-width: 640px) {
  :root {
    --text-xs: 0.625rem;    /* 10px */
    --text-sm: 0.75rem;     /* 12px */
    --text-base: 0.875rem;  /* 14px */
    --text-lg: 1rem;        /* 16px */
    --text-xl: 1.125rem;    /* 18px */
    --text-2xl: 1.25rem;    /* 20px */
    --text-3xl: 1.5rem;     /* 24px */
    --text-4xl: 1.875rem;   /* 30px */
  }
}
```

---

## Spacing System

### Desktop
```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
}
```

### Mobile
```css
@media (max-width: 640px) {
  :root {
    --space-1: 0.125rem;  /* 2px */
    --space-2: 0.25rem;   /* 4px */
    --space-3: 0.5rem;    /* 8px */
    --space-4: 0.75rem;   /* 12px */
    --space-5: 1rem;      /* 16px */
    --space-6: 1.25rem;   /* 20px */
    --space-8: 1.5rem;    /* 24px */
    --space-10: 2rem;     /* 32px */
    --space-12: 2.5rem;   /* 40px */
  }
}
```

---

## Container Widths

```css
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding-left: var(--space-6);
    padding-right: var(--space-6);
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

---

## Image Handling

### Responsive Images

```html
<picture>
  <!-- Mobile: smaller image -->
  <source 
    media="(max-width: 640px)" 
    srcset="hero-mobile.webp"
    type="image/webp"
  />
  
  <!-- Tablet: medium image -->
  <source 
    media="(max-width: 1024px)" 
    srcset="hero-tablet.webp"
    type="image/webp"
  />
  
  <!-- Desktop: full image -->
  <source 
    srcset="hero-desktop.webp"
    type="image/webp"
  />
  
  <!-- Fallback -->
  <img 
    src="hero-desktop.jpg" 
    alt="AI Prompt+ Demo"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Image Sizes

```css
/* Hero images */
.hero-image {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
}

@media (max-width: 640px) {
  .hero-image {
    max-height: 250px;
  }
}

/* Feature images */
.feature-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

@media (max-width: 640px) {
  .feature-image {
    height: 150px;
  }
}
```

---

## Performance Optimization

### Mobile Performance

```css
/* Reduce animations on mobile */
@media (max-width: 640px) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Reduce blur effects */
@media (max-width: 640px) {
  .backdrop-blur {
    backdrop-filter: none;
  }
}
```

### Lazy Loading

```javascript
// Intersection Observer for lazy loading
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
}, {
  rootMargin: '50px', // Load 50px before visible
  threshold: 0.1
});

// Observe all lazy images
document.querySelectorAll('[data-src]').forEach(img => {
  observer.observe(img);
});
```

---

## Accessibility on Mobile

### Focus Management

```javascript
// Trap focus in mobile menu
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });
}
```

### Screen Reader Announcements

```javascript
// Announce route changes
function announceRouteChange(routeName) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = `Navigated to ${routeName}`;
  document.body.appendChild(announcement);
  
  setTimeout(() => announcement.remove(), 1000);
}
```

---

## Responsive Components

### Modal/Dialog

```css
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

/* Desktop: centered modal */
@media (min-width: 1024px) {
  .modal-content {
    max-width: 480px;
    max-height: 90vh;
    border-radius: 12px;
  }
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .modal {
    align-items: flex-end;
  }
  
  .modal-content {
    width: 100%;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
  }
}
```

### Dropdown Menu

```css
.dropdown {
  position: absolute;
  z-index: 40;
  min-width: 200px;
}

/* Desktop: below trigger */
@media (min-width: 1024px) {
  .dropdown {
    top: 100%;
    left: 0;
    margin-top: 4px;
  }
}

/* Mobile: full-width bottom */
@media (max-width: 640px) {
  .dropdown {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 70vh;
    overflow-y: auto;
  }
}
```

### Toast Notifications

```css
.toast {
  position: fixed;
  z-index: 100;
  max-width: 400px;
}

/* Desktop: top-right */
@media (min-width: 1024px) {
  .toast {
    top: var(--space-4);
    right: var(--space-4);
  }
}

/* Mobile: top-center */
@media (max-width: 640px) {
  .toast {
    top: var(--space-4);
    left: var(--space-4);
    right: var(--space-4);
    max-width: none;
  }
}
```

---

## Testing Responsive Design

### Browser DevTools

```
Chrome DevTools:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device preset or custom size
4. Test interactions and layout

Key sizes to test:
- iPhone SE: 375px
- iPhone 14: 390px
- iPad Mini: 768px
- iPad Pro: 1024px
- Desktop: 1280px+
```

### Automated Testing

```javascript
// Playwright responsive tests
const viewports = [
  { name: 'Mobile', width: 375, height: 812 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
];

for (const viewport of viewports) {
  test(`Layout works on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    
    // Check navigation
    if (viewport.width < 640) {
      await expect(page.locator('.mobile-tab-bar')).toBeVisible();
      await expect(page.locator('.sidebar')).toBeHidden();
    } else {
      await expect(page.locator('.sidebar')).toBeVisible();
      await expect(page.locator('.mobile-tab-bar')).toBeHidden();
    }
    
    // Check content
    await expect(page.locator('.main-content')).toBeVisible();
  });
}
```
