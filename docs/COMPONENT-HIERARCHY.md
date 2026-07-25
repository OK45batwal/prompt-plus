# AI Prompt+ — Component Hierarchy

## Component Architecture Overview

```
ai-prompt-plus/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Public marketing pages
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Dashboard pages
│   └── api/                      # API routes
├── components/                   # React components
│   ├── ui/                       # Base UI components (shadcn)
│   ├── landing/                  # Landing page components
│   ├── dashboard/                # Dashboard components
│   ├── prompt-builder/           # Prompt builder components
│   ├── shared/                   # Shared components
│   └── providers/                # Context providers
├── lib/                          # Utility functions
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
└── types/                        # TypeScript types
```

---

## Base UI Components (shadcn/ui)

```
components/ui/
├── accordion.tsx
├── alert.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── checkbox.tsx
├── command.tsx
├── context-menu.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── hover-card.tsx
├── input.tsx
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── skeleton.tsx
├── slider.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toast.tsx
├── toaster.tsx
├── tooltip.tsx
└── toggle.tsx
```

---

## Landing Page Components

```
components/landing/
│
├── Navbar/
│   ├── Navbar.tsx                    # Main navigation container
│   ├── Logo.tsx                      # AI Prompt+ logo
│   ├── NavLinks.tsx                  # Navigation links
│   ├── AuthButtons.tsx               # Login/Get Started buttons
│   └── MobileMenu.tsx                # Mobile hamburger menu
│
├── Hero/
│   ├── HeroSection.tsx               # Hero container
│   ├── HeroHeadline.tsx              # Main headline
│   ├── HeroSubheadline.tsx           # Supporting text
│   ├── HeroCTA.tsx                   # Call-to-action buttons
│   ├── HeroDemo.tsx                  # Interactive demo
│   └── HeroTrustBadges.tsx           # Trust indicators
│
├── Features/
│   ├── FeaturesSection.tsx           # Features container
│   ├── FeatureGrid.tsx               # Grid layout
│   └── FeatureCard.tsx               # Individual feature card
│
├── Models/
│   ├── ModelsSection.tsx             # Supported models container
│   ├── ModelCarousel.tsx             # Carousel of models
│   └── ModelCard.tsx                 # Individual model card
│
├── Workflow/
│   ├── WorkflowSection.tsx           # How it works container
│   ├── WorkflowSteps.tsx             # Step-by-step display
│   └── WorkflowAnimation.tsx         # Animated demo
│
├── Examples/
│   ├── ExamplesSection.tsx           # Examples container
│   ├── ExampleTabs.tsx               # Tabbed examples
│   └── BeforeAfter.tsx               # Before/after comparison
│
├── Testimonials/
│   ├── TestimonialsSection.tsx       # Testimonials container
│   ├── TestimonialCarousel.tsx       # Carousel of testimonials
│   └── TestimonialCard.tsx           # Individual testimonial
│
├── Pricing/
│   ├── PricingSection.tsx            # Pricing container
│   ├── PricingToggle.tsx             # Monthly/Yearly toggle
│   ├── PricingCards.tsx              # Pricing cards container
│   └── PricingCard.tsx               # Individual pricing card
│
├── FAQ/
│   ├── FAQSection.tsx                # FAQ container
│   ├── FAQAccordion.tsx              # Accordion component
│   └── FAQItem.tsx                   # Individual FAQ item
│
├── Newsletter/
│   ├── NewsletterSection.tsx         # Newsletter container
│   └── EmailCaptureForm.tsx          # Email capture form
│
└── Footer/
    ├── Footer.tsx                    # Footer container
    ├── FooterLogo.tsx                # Footer logo
    ├── FooterLinks.tsx               # Footer link columns
    ├── SocialLinks.tsx               # Social media links
    └── Copyright.tsx                 # Copyright notice
```

### Landing Page Component Tree

```
LandingPage
├── Navbar
│   ├── Logo
│   ├── NavLinks
│   │   ├── Link (Home)
│   │   ├── Link (Features)
│   │   ├── Link (Pricing)
│   │   ├── Link (Docs)
│   │   └── Link (Blog)
│   ├── AuthButtons
│   │   ├── Button (Login)
│   │   └── Button (Get Started)
│   └── MobileMenu
│       ├── Button (Close)
│       └── NavLinks (mobile)
│
├── HeroSection
│   ├── HeroHeadline
│   ├── HeroSubheadline
│   ├── HeroCTA
│   │   ├── Button (Get Started)
│   │   └── Button (Watch Demo)
│   ├── HeroDemo
│   │   ├── PromptInput
│   │   ├── AnalysisPreview
│   │   └── EnhancedPreview
│   └── HeroTrustBadges
│       └── Badge (x3)
│
├── FeaturesSection
│   ├── SectionHeader
│   │   ├── Title
│   │   └── Subtitle
│   └── FeatureGrid
│       ├── FeatureCard
│       │   ├── Icon
│       │   ├── Title
│       │   └── Description
│       └── FeatureCard (x5 more)
│
├── ModelsSection
│   ├── SectionHeader
│   └── ModelCarousel
│       ├── ModelCard
│       │   ├── Logo
│       │   └── Name
│       └── ModelCard (x9 more)
│
├── WorkflowSection
│   ├── SectionHeader
│   └── WorkflowSteps
│       ├── Step (Write)
│       ├── Step (Analyze)
│       ├── Step (Enhance)
│       ├── Step (Score)
│       └── Step (Deploy)
│
├── ExamplesSection
│   ├── SectionHeader
│   └── ExampleTabs
│       ├── Tab (Content)
│       │   └── BeforeAfter
│       ├── Tab (Code)
│       │   └── BeforeAfter
│       ├── Tab (Image)
│       │   └── BeforeAfter
│       └── Tab (Email)
│           └── BeforeAfter
│
├── TestimonialsSection
│   ├── SectionHeader
│   └── TestimonialCarousel
│       ├── TestimonialCard
│       │   ├── Avatar
│       │   ├── Quote
│       │   ├── Author
│       │   └── Role
│       └── TestimonialCard (x5 more)
│
├── PricingSection
│   ├── SectionHeader
│   ├── PricingToggle
│   └── PricingCards
│       ├── PricingCard (Free)
│       │   ├── PlanName
│       │   ├── Price
│       │   ├── Features
│       │   └── Button
│       ├── PricingCard (Pro)
│       │   └── ... (with "Popular" badge)
│       └── PricingCard (Team)
│           └── ...
│
├── FAQSection
│   ├── SectionHeader
│   └── FAQAccordion
│       ├── FAQItem
│       │   ├── Question
│       │   └── Answer
│       └── FAQItem (x7 more)
│
├── NewsletterSection
│   └── EmailCaptureForm
│       ├── Input (Email)
│       └── Button (Subscribe)
│
└── Footer
    ├── FooterLogo
    ├── FooterLinks
    │   ├── LinkGroup (Product)
    │   ├── LinkGroup (Company)
    │   ├── LinkGroup (Resources)
    │   └── LinkGroup (Legal)
    ├── SocialLinks
    │   ├── Link (Twitter)
    │   ├── Link (GitHub)
    │   └── Link (Discord)
    └── Copyright
```

---

## Dashboard Components

```
components/dashboard/
│
├── Layout/
│   ├── DashboardLayout.tsx           # Main dashboard layout
│   ├── Sidebar.tsx                   # Sidebar container
│   ├── SidebarItem.tsx               # Individual sidebar item
│   ├── SidebarGroup.tsx              # Group of sidebar items
│   ├── Header.tsx                    # Top header bar
│   ├── SearchBar.tsx                 # Global search
│   ├── QuickActions.tsx              # Quick action buttons
│   ├── NotificationsBell.tsx         # Notification bell
│   └── UserMenu.tsx                  # User dropdown menu
│
├── Home/
│   ├── DashboardHome.tsx             # Dashboard home page
│   ├── WelcomeBanner.tsx             # Welcome message
│   ├── QuickActionsCard.tsx          # Quick actions widget
│   ├── StatsCards.tsx                # Statistics cards
│   ├── RecentPrompts.tsx             # Recent prompts list
│   ├── Favorites.tsx                 # Favorites widget
│   ├── RecentActivity.tsx            # Activity feed
│   └── UsageWidget.tsx               # Usage statistics
│
├── Library/
│   ├── LibraryPage.tsx               # Library page
│   ├── SearchFilters.tsx             # Search and filters
│   ├── ViewToggle.tsx                # Grid/List toggle
│   ├── PromptGrid.tsx                # Grid of prompts
│   ├── PromptList.tsx                # List of prompts
│   ├── PromptCard.tsx                # Individual prompt card
│   ├── PromptListItem.tsx            # List item variant
│   └── EmptyLibrary.tsx              # Empty state
│
├── History/
│   ├── HistoryPage.tsx               # History page
│   ├── HistoryTimeline.tsx           # Timeline view
│   ├── HistoryItem.tsx               # Individual history item
│   └── HistoryFilters.tsx            # Filter controls
│
├── Collections/
│   ├── CollectionsPage.tsx           # Collections page
│   ├── CollectionGrid.tsx            # Grid of collections
│   ├── CollectionCard.tsx            # Individual collection card
│   ├── CollectionDetail.tsx          # Collection detail page
│   ├── CollectionPrompts.tsx         # Prompts in collection
│   └── CreateCollectionModal.tsx     # Create collection modal
│
├── Compare/
│   ├── ComparePage.tsx               # Compare page
│   ├── PromptSelector.tsx            # Prompt selection
│   ├── ComparisonView.tsx            # Side-by-side view
│   ├── DiffHighlight.tsx             # Diff highlighting
│   ├── ScoreComparison.tsx           # Score comparison
│   └── ChangesSummary.tsx            # Changes summary
│
├── Analytics/
│   ├── AnalyticsPage.tsx             # Analytics page
│   ├── StatsOverview.tsx             # Overview stats
│   ├── ChartGrid.tsx                 # Charts container
│   ├── LineChart.tsx                 # Line chart
│   ├── BarChart.tsx                  # Bar chart
│   ├── PieChart.tsx                  # Pie chart
│   ├── DateRangePicker.tsx           # Date range selector
│   └── ExportReport.tsx              # Export button
│
├── Templates/
│   ├── TemplatesPage.tsx             # Templates page
│   ├── CategorySidebar.tsx           # Categories sidebar
│   ├── TemplateGrid.tsx              # Grid of templates
│   ├── TemplateCard.tsx              # Individual template card
│   ├── TemplateDetail.tsx            # Template detail page
│   ├── TemplatePreview.tsx           # Template preview
│   ├── VariableForm.tsx              # Variable input form
│   └── LivePreview.tsx               # Live preview
│
└── Settings/
    ├── SettingsPage.tsx              # Settings page
    ├── SettingsTabs.tsx              # Tab navigation
    ├── ProfileTab.tsx                # Profile settings
    ├── APIKeysTab.tsx                # API keys management
    ├── BillingTab.tsx                # Billing settings
    ├── NotificationsTab.tsx          # Notification preferences
    ├── AppearanceTab.tsx             # Appearance settings
    ├── DangerZone.tsx                # Danger zone (delete account)
    ├── AddProviderModal.tsx          # Add API provider modal
    └── ProviderCard.tsx              # Provider connection card
```

### Dashboard Layout Component Tree

```
DashboardLayout
├── Sidebar
│   ├── Logo
│   ├── SidebarGroup (Main)
│   │   ├── SidebarItem (Dashboard)
│   │   ├── SidebarItem (New Prompt)
│   │   └── SidebarItem (Templates)
│   ├── Divider
│   ├── SidebarGroup (Content)
│   │   ├── SidebarItem (Library)
│   │   ├── SidebarItem (History)
│   │   ├── SidebarItem (Collections)
│   │   └── SidebarItem (Compare)
│   ├── Divider
│   ├── SidebarGroup (Insights)
│   │   └── SidebarItem (Analytics)
│   ├── Divider
│   ├── SidebarGroup (Account)
│   │   ├── SidebarItem (API Keys)
│   │   ├── SidebarItem (Billing)
│   │   ├── SidebarItem (Settings)
│   │   └── SidebarItem (Profile)
│   ├── UpgradeBanner (conditional)
│   └── CollapseButton
│
├── Header
│   ├── SidebarToggle
│   ├── SearchBar
│   ├── QuickActions
│   ├── ThemeToggle
│   ├── NotificationsBell
│   │   ├── BellIcon
│   │   └── Badge
│   └── UserMenu
│       ├── Avatar
│       ├── Name
│       ├── PlanBadge
│       └── Dropdown
│           ├── Link (Profile)
│           ├── Link (Settings)
│           ├── Link (Billing)
│           ├── Divider
│           ├── Link (Help)
│           └── Button (Logout)
│
└── MainContent
    └── {children}
```

---

## Prompt Builder Components

```
components/prompt-builder/
│
├── PromptBuilder/
│   ├── PromptBuilder.tsx             # Main builder container
│   ├── InputPanel.tsx                # Left panel (input)
│   ├── ResultsPanel.tsx              # Right panel (results)
│   └── MobilePromptSheet.tsx         # Mobile bottom sheet
│
├── Input/
│   ├── PromptInput.tsx               # Main textarea
│   ├── CharacterCount.tsx            # Character counter
│   ├── ModelSelector.tsx             # Model dropdown
│   ├── CategorySelector.tsx          # Category chips
│   ├── ToneSelector.tsx              # Tone dropdown
│   ├── LengthControl.tsx             # Length options
│   ├── AdvancedOptions.tsx           # Collapsible options
│   └── AnalyzeButton.tsx             # Analyze CTA
│
├── Analysis/
│   ├── AnalysisResults.tsx           # Analysis container
│   ├── IntentDisplay.tsx             # Intent result
│   ├── CategoryDisplay.tsx           # Category result
│   ├── ComplexityDisplay.tsx         # Complexity result
│   ├── ConfidenceScore.tsx           # Confidence percentage
│   ├── MissingInfo.tsx               # Missing requirements
│   ├── SuggestionsList.tsx           # Suggestions list
│   └── EnhanceButton.tsx             # Enhance CTA
│
├── Enhancement/
│   ├── EnhancementResults.tsx        # Enhancement container
│   ├── OriginalPrompt.tsx            # Original prompt display
│   ├── EnhancedPrompt.tsx            # Enhanced prompt display
│   ├── ChangesList.tsx               # Changes made list
│   ├── ScoreDisplay.tsx              # Score display
│   ├── ScoreBreakdown.tsx            # Detailed score
│   └── ActionButtons.tsx             # Copy/Save/Export/Share
│
├── Comparison/
│   ├── SideBySide.tsx                # Side-by-side view
│   ├── DiffView.tsx                  # Diff highlighting
│   └── MetricsComparison.tsx         # Metrics comparison
│
└── Actions/
    ├── CopyButton.tsx                # Copy to clipboard
    ├── SaveButton.tsx                # Save to library
    ├── ExportButton.tsx              # Export dropdown
    ├── ShareButton.tsx               # Share modal
    └── VersionHistory.tsx            # Version history sidebar
```

### Prompt Builder Component Tree

```
PromptBuilder
├── InputPanel
│   ├── PromptInput
│   │   ├── Textarea
│   │   └── CharacterCount
│   ├── ModelSelector
│   │   └── Select (with model logos)
│   ├── CategorySelector
│   │   └── Chip (x6)
│   ├── ToneSelector
│   │   └── Select
│   ├── LengthControl
│   │   └── RadioGroup
│   ├── AdvancedOptions
│   │   ├── TemperatureSlider
│   │   ├── ExamplesToggle
│   │   ├── FormatSelect
│   │   └── LanguageSelect
│   └── AnalyzeButton
│
├── ResultsPanel
│   ├── Tabs (Analysis | Enhanced | Score)
│   │
│   ├── AnalysisResults
│   │   ├── ConfidenceScore
│   │   ├── IntentDisplay
│   │   ├── CategoryDisplay
│   │   ├── ComplexityDisplay
│   │   ├── MissingInfo
│   │   │   └── MissingItem (x N)
│   │   ├── SuggestionsList
│   │   │   └── SuggestionItem (x N)
│   │   └── EnhanceButton
│   │
│   ├── EnhancementResults
│   │   ├── OriginalPrompt
│   │   ├── EnhancedPrompt
│   │   ├── ChangesList
│   │   │   └── ChangeItem (x N)
│   │   ├── ScoreDisplay
│   │   │   └── ScoreBar (x4)
│   │   └── ActionButtons
│   │       ├── CopyButton
│   │       ├── SaveButton
│   │       ├── ExportButton
│   │       └── ShareButton
│   │
│   └── ScoreDisplay
│       ├── OverallScore
│       ├── ClarityScore
│       ├── SpecificityScore
│       ├── ContextScore
│       └── CompletenessScore
│
└── MobilePromptSheet
    ├── DragHandle
    ├── Tabs
    └── {content}
```

---

## Shared Components

```
components/shared/
│
├── Layout/
│   ├── PageHeader.tsx                # Page header with title
│   ├── PageContainer.tsx             # Page container
│   ├── Sidebar.tsx                   # Reusable sidebar
│   └── EmptyState.tsx                # Empty state component
│
├── Feedback/
│   ├── Toast.tsx                     # Toast notification
│   ├── Alert.tsx                     # Alert component
│   ├── LoadingSpinner.tsx            # Loading spinner
│   ├── LoadingSkeleton.tsx           # Skeleton loader
│   ├── ErrorBoundary.tsx             # Error boundary
│   └── ConfirmationDialog.tsx        # Confirmation modal
│
├── DataDisplay/
│   ├── Badge.tsx                     # Status badge
│   ├── Avatar.tsx                    # User avatar
│   ├── Timestamp.tsx                 # Relative time
│   ├── Score.tsx                     # Score display
│   ├── ModelBadge.tsx                # AI model badge
│   └── CategoryBadge.tsx             # Category badge
│
├── Forms/
│   ├── FormField.tsx                 # Form field wrapper
│   ├── Input.tsx                     # Text input
│   ├── Textarea.tsx                  # Textarea
│   ├── Select.tsx                    # Select dropdown
│   ├── Checkbox.tsx                  # Checkbox
│   ├── RadioGroup.tsx                # Radio group
│   └── DatePicker.tsx                # Date picker
│
├── Navigation/
│   ├── Breadcrumb.tsx                # Breadcrumb
│   ├── Pagination.tsx                # Pagination
│   ├── Tabs.tsx                      # Tab navigation
│   └── CommandPalette.tsx            # Command palette (⌘K)
│
├── Media/
│   ├── Icon.tsx                      # Icon component
│   ├── Logo.tsx                      # Logo component
│   ├── Image.tsx                     # Optimized image
│   └── Lottie.tsx                    # Lottie animation
│
└── Utilities/
    ├── CopyToClipboard.tsx           # Copy to clipboard
    ├── ShareMenu.tsx                 # Share dropdown
    ├── ConfirmAction.tsx             # Confirm before action
    └── KeyboardShortcut.tsx          # Keyboard shortcut handler
```

---

## Provider Components

```
components/providers/
│
├── ThemeProvider.tsx                 # Theme context provider
├── AuthProvider.tsx                  # Authentication provider
├── QueryProvider.tsx                 # React Query provider
├── ToastProvider.tsx                 # Toast notifications provider
├── CommandProvider.tsx               # Command palette provider
└── AnalyticsProvider.tsx             # Analytics provider
```

### Provider Tree

```
<App>
  <ThemeProvider>
    <AuthProvider>
      <QueryProvider>
        <ToastProvider>
          <CommandProvider>
            <AnalyticsProvider>
              {children}
            </AnalyticsProvider>
          </CommandProvider>
        </ToastProvider>
      </QueryProvider>
    </AuthProvider>
  </ThemeProvider>
</App>
```

---

## Hook Definitions

```
hooks/
│
├── useAuth.ts                        # Authentication state
├── usePrompt.ts                      # Prompt operations
├── useAnalysis.ts                    # Analysis operations
├── useEnhancement.ts                 # Enhancement operations
├── useLibrary.ts                     # Library operations
├── useCollections.ts                 # Collection operations
├── useTemplates.ts                   # Template operations
├── useAnalytics.ts                   # Analytics data
├── useNotifications.ts               # Notification state
├── useTheme.ts                       # Theme state
├── useKeyboard.ts                    # Keyboard shortcuts
├── useMediaQuery.ts                  # Responsive breakpoints
├── useDebounce.ts                    # Debounced values
├── useLocalStorage.ts                # Local storage state
├── useCopyToClipboard.ts            # Copy functionality
└── usePagination.ts                  # Pagination state
```

---

## Store Definitions

```
stores/
│
├── authStore.ts                      # Authentication state
│   ├── user
│   ├── token
│   ├── isAuthenticated
│   ├── login()
│   ├── logout()
│   └── refreshUser()
│
├── promptStore.ts                    # Prompt builder state
│   ├── currentPrompt
│   ├── analysisResult
│   ├── enhancedPrompt
│   ├── score
│   ├── model
│   ├── category
│   ├── tone
│   └── length
│
├── uiStore.ts                        # UI state
│   ├── sidebarCollapsed
│   ├── theme
│   ├── commandPaletteOpen
│   ├── modalOpen
│   └── notifications
│
└── cacheStore.ts                     # Cache state
    ├── templates
    ├── collections
    └── recentPrompts
```

---

## Type Definitions

```
types/
│
├── user.ts                           # User types
├── prompt.ts                         # Prompt types
├── analysis.ts                       # Analysis types
├── enhancement.ts                    # Enhancement types
├── template.ts                       # Template types
├── collection.ts                     # Collection types
├── api-key.ts                        # API key types
├── analytics.ts                      # Analytics types
├── notification.ts                   # Notification types
└── api.ts                            # API response types
```

### Core Type Definitions

```typescript
// types/user.ts
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  createdAt: Date;
  lastLoginAt?: Date;
}

// types/prompt.ts
interface Prompt {
  id: string;
  userId: string;
  title?: string;
  originalText: string;
  enhancedText?: string;
  model: string;
  category?: string;
  tone?: string;
  length?: string;
  score?: Score;
  tags: string[];
  isSaved: boolean;
  isFavorite: boolean;
  collectionId?: string;
  versions: Version[];
  analyses: Analysis[];
  createdAt: Date;
  updatedAt: Date;
  enhancedAt?: Date;
}

interface Score {
  clarity: number;
  specificity: number;
  context: number;
  completeness: number;
  overall: number;
}

// types/analysis.ts
interface Analysis {
  id: string;
  promptId: string;
  intent: IntentType;
  category: CategoryType;
  complexity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  entities: string[];
  context: string[];
  keywords: string[];
  missing: MissingRequirement[];
  suggestions: Suggestion[];
  createdAt: Date;
}

type IntentType = 
  | 'content_generation'
  | 'code_generation'
  | 'image_generation'
  | 'data_analysis'
  | 'email'
  | 'education'
  | 'business'
  | 'creative';

// types/template.ts
interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  variables: TemplateVariable[];
  model?: string;
  usageCount: number;
  isOfficial: boolean;
  authorId?: string;
  createdAt: Date;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
}
```
