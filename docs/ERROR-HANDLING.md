# AI Prompt+ — Error Handling & Empty States

## Error Handling Philosophy

### Principles

1. **User-First**: Errors should help users recover, not confuse them
2. **Actionable**: Every error should suggest a next step
3. **Non-Technical**: Hide implementation details from users
4. **Consistent**: Same error types show same UI patterns
5. **Graceful**: Degrade functionality when possible, don't break

---

## Error Categories

### 1. Client-Side Errors

#### Validation Errors

```
┌─────────────────────────────────────────────────────────────┐
│  Validation Error                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Prompt                                             │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │                                             │   │   │
│  │  │  (empty input)                              │   │   │
│  │  │                                             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ⚠️ Please enter a prompt (minimum 10 characters)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Analyze Prompt] (disabled)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- Empty input: "Please enter a prompt"
- Too short: "Prompt must be at least 10 characters"
- Too long: "Prompt must be under 2,000 characters"
- Invalid characters: "Prompt contains invalid characters"
- Profanity: "Prompt contains inappropriate language"

**Implementation:**
```typescript
// Client-side validation with Zod
const promptSchema = z.object({
  text: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(2000, 'Prompt must be under 2,000 characters')
    .regex(/^[a-zA-Z0-9\s.,!?'"-]+$/, 'Prompt contains invalid characters'),
  model: z.enum(['chatgpt', 'claude', 'gemini', 'grok', 'deepseek']),
  category: z.string().optional(),
  tone: z.string().optional(),
});

// Real-time validation
const [error, setError] = useState<string | null>(null);

const handleChange = (value: string) => {
  const result = promptSchema.shape.text.safeParse(value);
  if (!result.success) {
    setError(result.error.errors[0].message);
  } else {
    setError(null);
  }
};
```

---

#### Form Errors

```
┌─────────────────────────────────────────────────────────────┐
│  Sign Up                                                    │
│                                                             │
│  Name: [John Doe_______________]                           │
│                                                             │
│  Email: [john@example.com_______]                           │
│        ⚠️ Email already exists                              │
│                                                             │
│  Password: [••••••••••_________]                            │
│            ⚠️ Password must contain uppercase, lowercase,   │
│              number, and special character                  │
│                                                             │
│  Confirm: [••••••••••_________]                             │
│           ⚠️ Passwords do not match                         │
│                                                             │
│  [Sign Up] (disabled)                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Error Types:**
| Field | Error | Message |
|-------|-------|---------|
| Email | Already exists | "An account with this email already exists" |
| Email | Invalid format | "Please enter a valid email address" |
| Password | Too weak | "Password must be at least 8 characters" |
| Password | No uppercase | "Password must contain an uppercase letter" |
| Password | No number | "Password must contain a number" |
| Password | No special | "Password must contain a special character" |
| Confirm | Mismatch | "Passwords do not match" |

---

### 2. Network Errors

#### Connection Lost

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📡]                             │   │
│  │                                                     │   │
│  │            Connection Lost                          │   │
│  │                                                     │   │
│  │    Unable to connect to the server.                 │   │
│  │    Please check your internet connection.           │   │
│  │                                                     │   │
│  │    [🔄 Retry]                                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Auto-retry every 5 seconds (with exponential backoff)
- Show connection status indicator
- Queue user actions for retry
- Show pending actions count

**Implementation:**
```typescript
// Network status detection
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
      // Retry pending actions
      retryPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, retryCount };
};
```

---

#### Request Timeout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [⏱️]                             │   │
│  │                                                     │   │
│  │              Request Timed Out                      │   │
│  │                                                     │   │
│  │    The request took too long to complete.           │   │
│  │    This might be due to high server load.           │   │
│  │                                                     │   │
│  │    [🔄 Try Again]    [💾 Save Draft]                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Timeout Thresholds:**
| Operation | Timeout | Retry |
|-----------|---------|-------|
| API call | 30s | 2x |
| File upload | 60s | 1x |
| AI enhancement | 60s | 1x |
| Authentication | 10s | 3x |

---

#### Server Error (500)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🔥]                             │   │
│  │                                                     │   │
│  │              Something Went Wrong                   │   │
│  │                                                     │   │
│  │    We're sorry, something went wrong on our end.    │   │
│  │    Our team has been notified.                      │   │
│  │                                                     │   │
│  │    Error ID: ERR-2024-001                           │   │
│  │                                                     │   │
│  │    [🔄 Try Again]    [📧 Contact Support]           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### Rate Limited (429)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🚫]                             │   │
│  │                                                     │   │
│  │              Rate Limit Exceeded                    │   │
│  │                                                     │   │
│  │    You've made too many requests.                   │   │
│  │    Please wait before trying again.                 │   │
│  │                                                     │   │
│  │    ⏳ Retry in: 30 seconds                          │   │
│  │                                                     │   │
│  │    [Upgrade to Pro] for higher limits               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Rate Limits:**
| Plan | Requests/Min | Enhancements/Day |
|------|--------------|------------------|
| Free | 10 | 20 |
| Pro | 60 | Unlimited |
| Team | 120 | Unlimited |

---

### 3. Authentication Errors

#### Session Expired

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🔒]                             │   │
│  │                                                     │   │
│  │              Session Expired                        │   │
│  │                                                     │   │
│  │    Your session has expired.                        │   │
│  │    Please log in again to continue.                 │   │
│  │                                                     │   │
│  │    [Log In]                                         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Auto-redirect to login after 5 seconds
- Save current page URL for redirect after login
- Show "Return to previous page" option

---

#### Invalid API Key

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  API Keys > OpenAI                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ❌ Connection Failed                               │   │
│  │                                                     │   │
│  │  The API key you provided is invalid or has been    │   │
│  │  revoked. Please check your key and try again.      │   │
│  │                                                     │   │
│  │  Common issues:                                     │   │
│  │  • Key was copied incorrectly                       │   │
│  │  • Key has been revoked in OpenAI dashboard         │   │
│  │  • Key doesn't have required permissions            │   │
│  │                                                     │   │
│  │  API Key: [sk-••••••••••••••••••••••••••••________]  │   │
│  │                                                     │   │
│  │  [🔄 Test Again]    [📖 View Documentation]         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. AI Service Errors

#### AI Service Unavailable

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Prompt Builder                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⚠️ AI Service Temporarily Unavailable              │   │
│  │                                                     │   │
│  │  The AI enhancement service is currently            │   │
│  │  experiencing issues. Your prompt has been saved.   │   │
│  │                                                     │   │
│  │  What you can do:                                   │   │
│  │  • Try again in a few minutes                       │   │
│  │  • Use a different AI model                         │   │
│  │  • Contact support if issue persists                │   │
│  │                                                     │   │
│  │  [🔄 Retry]    [💾 Save Draft]    [📧 Support]      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### AI Response Error

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Prompt Builder                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ❌ Enhancement Failed                              │   │
│  │                                                     │   │
│  │  The AI was unable to enhance your prompt.          │   │
│  │  This might be due to:                              │   │
│  │                                                     │   │
│  │  • Prompt contains content that cannot be processed │   │
│  │  • AI model is experiencing high load               │   │
│  │  • Temporary service interruption                   │   │
│  │                                                     │   │
│  │  Your original prompt is safe and unchanged.        │   │
│  │                                                     │   │
│  │  [🔄 Try Again]    [📝 Edit Prompt]    [💾 Save]    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. File/Export Errors

#### Export Failed

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ❌ Export Failed                                   │   │
│  │                                                     │   │
│  │  Unable to export your prompt.                      │   │
│  │                                                     │   │
│  │  Please try:                                        │   │
│  │  • A different format (TXT, JSON, MD)               │   │
│  │  • Copy to clipboard instead                        │   │
│  │  • Try again later                                  │   │
│  │                                                     │   │
│  │  [📋 Copy to Clipboard]    [🔄 Retry]               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Empty States

### No Prompt History

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Prompt History                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📝]                             │   │
│  │                                                     │   │
│  │            No Prompt History Yet                    │   │
│  │                                                     │   │
│  │    When you create or enhance prompts,              │   │
│  │    they'll appear here.                             │   │
│  │                                                     │   │
│  │    [✨ Create Your First Prompt]                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### No Prompts in Library

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Prompt Library                                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📚]                             │   │
│  │                                                     │   │
│  │              Your Library is Empty                   │   │
│  │                                                     │   │
│  │    Save your best prompts to access them            │   │
│  │    quickly and build your collection.               │   │
│  │                                                     │   │
│  │    [✨ Create New Prompt]    [📋 Browse Templates]   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### No Collections

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Collections                                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📁]                             │   │
│  │                                                     │   │
│  │            No Collections Yet                       │   │
│  │                                                     │   │
│  │    Organize your prompts into collections           │   │
│  │    for easy access and management.                  │   │
│  │                                                     │   │
│  │    [➕ Create Your First Collection]                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### No API Keys Connected

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  API Keys                                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🔑]                             │   │
│  │                                                     │   │
│  │           No API Keys Connected                     │   │
│  │                                                     │   │
│  │    Connect your AI provider to start enhancing      │   │
│  │    prompts with AI.                                 │   │
│  │                                                     │   │
│  │    Supported providers:                             │   │
│  │    • OpenAI (ChatGPT)                               │   │
│  │    • Anthropic (Claude)                             │   │
│  │    • Google (Gemini)                                │   │
│  │    • And more...                                    │   │
│  │                                                     │   │
│  │    [➕ Add Your First API Key]                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### No Templates Available

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Templates > Code Generation                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📋]                             │   │
│  │                                                     │   │
│  │          No Templates in This Category              │   │
│  │                                                     │   │
│  │    We're working on adding more templates           │   │
│  │    for this category. Check back soon!              │   │
│  │                                                     │   │
│  │    [🔍 Browse All Templates]    [💡 Suggest One]    │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### No Search Results

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Library                                                    │
│                                                             │
│  Search: [python function_____________]                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🔍]                             │   │
│  │                                                     │   │
│  │             No Results Found                        │   │
│  │                                                     │   │
│  │    No prompts match "python function".              │   │
│  │                                                     │   │
│  │    Try:                                             │   │
│  │    • Different keywords                             │   │
│  │    • Check spelling                                 │   │
│  │    • Remove filters                                 │   │
│  │                                                     │   │
│  │    [✕ Clear Search]                                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Empty Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Analytics                                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [📊]                             │   │
│  │                                                     │   │
│  │           No Analytics Data Yet                     │   │
│  │                                                     │   │
│  │    Start creating and enhancing prompts to          │   │
│  │    see your usage statistics here.                  │   │
│  │                                                     │   │
│  │    [✨ Create Your First Prompt]                     │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Empty Notifications

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Notifications                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    [🔔]                             │   │
│  │                                                     │   │
│  │            All Caught Up!                           │   │
│  │                                                     │   │
│  │    No new notifications.                            │   │
│  │    We'll let you know when something happens.       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Recovery Flows

### Flow 1: Prompt Enhancement Failure

```
User clicks "Enhance"
    │
    ▼
Loading state...
    │
    ├─── Success ──▶ Show enhanced prompt
    │
    └─── Failure
         │
         ▼
    ┌─────────────────────────────────┐
    │  Enhancement Failed             │
    │                                 │
    │  [Retry] [Save Draft] [Cancel]  │
    └─────────────────────────────────┘
         │
         ├─── Retry ──▶ Try again (max 3x)
         │
         ├─── Save Draft ──▶ Save original prompt
         │                   Show success toast
         │
         └─── Cancel ──▶ Return to editor
```

---

### Flow 2: API Key Validation Failure

```
User enters API key
    │
    ▼
Click "Test Connection"
    │
    ▼
Loading...
    │
    ├─── Success ──▶ Show connected status
    │                 Enable models
    │
    └─── Failure
         │
         ▼
    ┌─────────────────────────────────┐
    │  ❌ Invalid API Key             │
    │                                 │
    │  Possible reasons:              │
    │  • Key copied incorrectly       │
    │  • Key revoked                   │
    │  • Insufficient permissions     │
    │                                 │
    │  [Try Again] [View Docs]        │
    └─────────────────────────────────┘
         │
         ├─── Try Again ──▶ Return to input
         │
         └─── View Docs ──▶ Open documentation
```

---

### Flow 3: Save Failure

```
User clicks "Save"
    │
    ▼
Loading...
    │
    ├─── Success ──▶ Toast: "Saved!"
    │                 Redirect to library
    │
    └─── Failure
         │
         ▼
    ┌─────────────────────────────────┐
    │  ❌ Save Failed                 │
    │                                 │
    │  Your prompt is still in the    │
    │  editor. You can:               │
    │                                 │
    │  [Retry] [Copy Instead] [✕]     │
    └─────────────────────────────────┘
         │
         ├─── Retry ──▶ Try save again
         │
         ├─── Copy Instead ──▶ Copy to clipboard
         │                     Toast: "Copied!"
         │
         └─── Dismiss ──▶ Close error
```

---

## Error Toast Notifications

### Error Toast Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ❌  Error Title                                     [✕]   │
│      Error description text goes here.                      │
│      [Action Button]                                        │
└─────────────────────────────────────────────────────────────┘
```

### Error Toast Types

| Type | Icon | Color | Duration |
|------|------|-------|----------|
| Error | ❌ | Red | 5s (manual dismiss) |
| Warning | ⚠️ | Yellow | 4s |
| Info | ℹ️ | Blue | 3s |
| Success | ✅ | Green | 3s |

### Implementation

```typescript
interface Toast {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

const showErrorToast = (title: string, message?: string, action?: Toast['action']) => {
  toast({
    type: 'error',
    title,
    message,
    action,
    duration: 5000, // Longer for errors
  });
};
```

---

## Error Logging

### Client-Side Error Tracking

```typescript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error boundary component
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Error Context

```typescript
// Add context to errors
Sentry.withScope((scope) => {
  scope.setUser({ id: userId, email: user.email });
  scope.setTag('feature', 'prompt-builder');
  scope.setExtra('promptId', promptId);
  scope.setExtra('model', selectedModel);
  Sentry.captureException(error);
});
```

---

## Retry Logic

### Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### Retry Conditions

| Error Code | Retry? | Max Retries | Delay |
|------------|--------|-------------|-------|
| 408 (Timeout) | Yes | 3 | 1s, 2s, 4s |
| 429 (Rate Limit) | Yes | 5 | 30s, 60s, 120s |
| 500 (Server Error) | Yes | 2 | 5s, 10s |
| 502 (Bad Gateway) | Yes | 3 | 2s, 4s, 8s |
| 503 (Unavailable) | Yes | 3 | 5s, 10s, 20s |
| 400 (Bad Request) | No | - | - |
| 401 (Unauthorized) | No | - | - |
| 403 (Forbidden) | No | - | - |
| 404 (Not Found) | No | - | - |
