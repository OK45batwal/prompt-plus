# AI Prompt+ — Notification System

## Notification Architecture

### Overview

AI Prompt+ uses a multi-channel notification system:
1. **In-App Notifications** — Bell icon in header
2. **Toast Notifications** — Temporary feedback messages
3. **Email Notifications** — Transactional and marketing
4. **Browser Notifications** — Push notifications (opt-in)

---

## 1. In-App Notifications

### Notification Bell Component

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│                                                             │
│  [Search]    [Quick Actions]    [🔔 3]    [Avatar]         │
│                          ▲                                  │
│                          │                                  │
│                    Badge count (max 99+)                     │
└─────────────────────────────────────────────────────────────┘
```

### Notification Dropdown

```
┌─────────────────────────────────────────────────────────────┐
│  Notifications                                    [Mark All Read] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  NEW                                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅  Prompt Enhanced Successfully            2m ago │   │
│  │      "Blog post about AI" was enhanced              │   │
│  │      [View]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔑  API Key Connected                       1h ago │   │
│  │      OpenAI connected successfully                  │   │
│  │      [View Settings]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💡  New Template Available                  3h ago │   │
│  │      "Code Review Assistant" template added         │   │
│  │      [View Template]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  EARLIER                                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊  Weekly Report Ready                    1d ago  │   │
│  │      Your usage report for last week is ready       │   │
│  │      [View Report]                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [View All Notifications]                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Notification Types

| Type | Icon | Color | Category |
|------|------|-------|----------|
| Success | ✅ | Green | Action completed |
| Info | ℹ️ | Blue | Informational |
| Warning | ⚠️ | Yellow | Attention needed |
| Error | ❌ | Red | Failure |
| Update | 🔄 | Purple | System update |
| Achievement | 🏆 | Gold | Milestone reached |

---

## 2. Toast Notifications

### Toast Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Prompt Saved Successfully                       [✕]   │
│      Your prompt has been saved to your library.            │
└─────────────────────────────────────────────────────────────┘
```

### Toast Variants

#### Success Toast
```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Prompt Copied!                                 [✕]   │
│      Copied to clipboard. Ready to paste.                  │
└─────────────────────────────────────────────────────────────┘
```

#### Error Toast
```
┌─────────────────────────────────────────────────────────────┐
│  ❌  Save Failed                                  [✕]   │
│      Unable to save prompt. Please try again.              │
│      [Retry]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Warning Toast
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Approaching Limit                            [✕]   │
│      You've used 45/50 prompts this month.                 │
│      [Upgrade for unlimited]                               │
└─────────────────────────────────────────────────────────────┘
```

#### Info Toast
```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️  Tip                                            [✕]   │
│      Press ⌘K to open the command palette.                 │
└─────────────────────────────────────────────────────────────┘
```

### Toast Positions

```
Desktop:     Top-right corner
Tablet:      Top-right corner
Mobile:      Top-center (full width)
```

### Toast Timing

| Type | Duration | Auto-dismiss | Manual dismiss |
|------|----------|--------------|----------------|
| Success | 3s | Yes | Yes |
| Error | 5s | No | Yes |
| Warning | 4s | Yes | Yes |
| Info | 3s | Yes | Yes |

---

## 3. Email Notifications

### Transactional Emails

#### Welcome Email
```
Subject: Welcome to AI Prompt+! 🎉

Hi [Name],

Welcome to AI Prompt+! We're excited to help you create 
amazing prompts.

Here's how to get started:
1. Create your first prompt
2. Connect your AI provider
3. Explore our templates

[Get Started →]

Best regards,
The AI Prompt+ Team
```

#### Password Reset Email
```
Subject: Reset Your Password

Hi [Name],

You requested to reset your password. Click the link below 
to create a new one:

[Reset Password →]

This link expires in 1 hour.

If you didn't request this, please ignore this email.
```

#### API Key Connected
```
Subject: API Key Connected Successfully

Hi [Name],

Your [Provider] API key has been connected successfully.

You can now use [Provider] models in the Prompt Builder.

View your API settings: [Settings →]

Best regards,
The AI Prompt+ Team
```

#### Weekly Digest
```
Subject: Your Weekly Prompt+ Report

Hi [Name],

Here's your activity for [Week]:

📊 Statistics:
• Prompts created: 12
• Enhancements: 8
• Average score: 78/100

🏆 Top Prompt:
"Blog post about AI" — Score: 87/100

💡 Tip of the Week:
Try using role assignment in your prompts for 
better results.

[View Full Report →]
```

### Marketing Emails

#### New Feature Announcement
```
Subject: New: Compare Prompts Side-by-Side

Hi [Name],

We just launched a new feature: Prompt Comparison!

Now you can:
• Compare original vs enhanced prompts
• See highlighted differences
• Track your improvement over time

[Try It Now →]
```

#### Upgrade Reminder
```
Subject: You're Almost at Your Limit

Hi [Name],

You've used 45/50 prompts this month on your Free plan.

Upgrade to Pro for:
• Unlimited prompts
• Unlimited enhancements
• Priority support
• All templates

[Upgrade to Pro →]
```

---

## 4. Browser Push Notifications

### Permission Request

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  🔔  Stay Updated                                   │   │
│  │                                                     │   │
│  │  Get notified when your prompts are enhanced        │   │
│  │  or when we release new features.                   │   │
│  │                                                     │   │
│  │  [Allow Notifications]    [Not Now]                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Push Notification Examples

```
┌─────────────────────────────────────────────────────────────┐
│  AI Prompt+                                                 │
│                                                             │
│  ✅ Your prompt "Blog post about AI" has been enhanced!     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│  AI Prompt+                                                 │
│                                                             │
│  📊 Your weekly report is ready!                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Notification Preferences

### Settings UI

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Notifications                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EMAIL NOTIFICATIONS                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Product updates                    [Toggle: ON]    │   │
│  │  New features and improvements                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Usage alerts                        [Toggle: ON]    │   │
│  │  When approaching plan limits                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Weekly digest                      [Toggle: ON]    │   │
│  │  Activity summary and insights                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Marketing emails                   [Toggle: OFF]   │   │
│  │  Tips, tutorials, and promotions                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  IN-APP NOTIFICATIONS                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Prompt saved                       [Toggle: ON]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Prompt enhanced                    [Toggle: ON]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API connected                      [Toggle: ON]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Errors                             [Toggle: ON]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PUSH NOTIFICATIONS                                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Browser notifications              [Toggle: OFF]   │   │
│  │  Enable push notifications in browser               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  DIGEST FREQUENCY                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Daily] [Weekly ✓] [Monthly] [Never]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Notification Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,       -- success, info, warning, error, update, achievement
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,                       -- URL to navigate to
  metadata    JSONB,                      -- Additional data
  expires_at  TIMESTAMP,                  -- Optional expiration
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

### User Notification Preferences

```sql
CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email preferences
  email_product   BOOLEAN DEFAULT TRUE,
  email_usage     BOOLEAN DEFAULT TRUE,
  email_digest    BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT FALSE,
  
  -- In-app preferences
  app_prompt_saved    BOOLEAN DEFAULT TRUE,
  app_prompt_enhanced BOOLEAN DEFAULT TRUE,
  app_api_connected   BOOLEAN DEFAULT TRUE,
  app_errors          BOOLEAN DEFAULT TRUE,
  
  -- Push preferences
  push_enabled    BOOLEAN DEFAULT FALSE,
  
  -- Digest frequency
  digest_frequency VARCHAR(20) DEFAULT 'weekly', -- daily, weekly, monthly, never
  
  updated_at      TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

---

## 7. Notification Triggers

### Trigger Events

```typescript
interface NotificationEvent {
  type: 'prompt_saved' | 'prompt_enhanced' | 'prompt_deleted' | 
        'api_connected' | 'api_disconnected' | 'export_complete' |
        'limit_approaching' | 'limit_reached' | 'new_template' |
        'weekly_report' | 'achievement';
  userId: string;
  data: Record<string, any>;
}

// Example triggers
const triggers = {
  prompt_saved: {
    title: 'Prompt Saved',
    message: '"{title}" has been saved to your library.',
    type: 'success',
    actionUrl: '/dashboard/library/{promptId}',
  },
  
  prompt_enhanced: {
    title: 'Prompt Enhanced',
    message: '"{title}" has been enhanced. Score: {score}/100',
    type: 'success',
    actionUrl: '/dashboard/library/{promptId}',
  },
  
  api_connected: {
    title: 'API Connected',
    message: '{provider} connected successfully.',
    type: 'success',
    actionUrl: '/dashboard/settings/api',
  },
  
  limit_approaching: {
    title: 'Approaching Limit',
    message: "You've used {used}/{limit} prompts this month.",
    type: 'warning',
    actionUrl: '/dashboard/settings/billing',
  },
  
  new_template: {
    title: 'New Template Available',
    message: '"{templateName}" template has been added.',
    type: 'info',
    actionUrl: '/dashboard/templates/{templateId}',
  },
};
```

---

## 8. Notification API Endpoints

```
GET    /api/v1/notifications              - List notifications
GET    /api/v1/notifications/unread       - Get unread count
POST   /api/v1/notifications/:id/read     - Mark as read
POST   /api/v1/notifications/read-all     - Mark all as read
DELETE /api/v1/notifications/:id          - Delete notification
DELETE /api/v1/notifications              - Clear all

GET    /api/v1/notification-preferences   - Get preferences
PUT    /api/v1/notification-preferences   - Update preferences
```

---

## 9. Real-Time Updates

### WebSocket Events

```typescript
// Server → Client
socket.on('notification', (notification: Notification) => {
  // Update notification count
  setUnreadCount(prev => prev + 1);
  
  // Add to notifications list
  addNotification(notification);
  
  // Show toast if enabled
  if (shouldShowToast(notification.type)) {
    showToast(notification);
  }
  
  // Show browser notification if permitted
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/icon.png',
    });
  }
});
```

### Polling Fallback

```typescript
// For environments without WebSocket
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/v1/notifications/unread');
    const { count } = await response.json();
    setUnreadCount(count);
  }, 30000); // Poll every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

---

## 10. Notification Queue

### Server-Side Queue

```typescript
// BullMQ job queue for notifications
const notificationQueue = new Queue('notifications', {
  connection: redis,
});

// Add notification job
async function queueNotification(event: NotificationEvent) {
  const notification = await createNotification(event);
  
  await notificationQueue.add('send', {
    notificationId: notification.id,
    userId: event.userId,
    channels: ['in_app', 'email', 'push'],
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

// Process notification jobs
notificationQueue.process('send', async (job) => {
  const { notificationId, userId, channels } = job.data;
  
  for (const channel of channels) {
    try {
      switch (channel) {
        case 'in_app':
          await sendInAppNotification(notificationId, userId);
          break;
        case 'email':
          await sendEmailNotification(notificationId, userId);
          break;
        case 'push':
          await sendPushNotification(notificationId, userId);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error);
    }
  }
});
```

---

## 11. Achievement System

### Achievement Notifications

```
┌─────────────────────────────────────────────────────────────┐
│  🏆  Achievement Unlocked!                                  │
│                                                             │
│  First Prompt                                               │
│  Created your first prompt. Keep going!                     │
│                                                             │
│  +50 points                                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Achievement List

| Achievement | Condition | Points |
|-------------|-----------|--------|
| First Prompt | Create first prompt | 50 |
| Prompt Master | Create 100 prompts | 500 |
| Enhancement Pro | Enhance 50 prompts | 250 |
| Score Champion | Get 10 prompts scored 90+ | 100 |
| Collector | Create 10 collections | 100 |
| Sharer | Share 10 prompts | 50 |
| API Pioneer | Connect first API key | 100 |
| Multi-Model | Use 5 different models | 200 |
| Template Wizard | Use 20 templates | 150 |
| Early Bird | Use app before 7am | 25 |
| Night Owl | Use app after 11pm | 25 |
| Weekend Warrior | Use app on weekend | 50 |

---

## 12. Notification Rendering

### Component Hierarchy

```
NotificationProvider
├── NotificationBell
│   ├── Badge (unread count)
│   └── Dropdown
│       ├── NotificationList
│       │   ├── NotificationGroup (New)
│       │   │   └── NotificationItem (x N)
│       │   └── NotificationGroup (Earlier)
│       │       └── NotificationItem (x N)
│       └── ViewAllLink
├── ToastContainer
│   └── Toast (x N)
│       ├── Icon
│       ├── Content
│       │   ├── Title
│       │   └── Message
│       ├── ActionButton (optional)
│       └── CloseButton
└── NotificationPage (optional)
    ├── Filters
    └── NotificationList
```

### NotificationItem Component

```tsx
const NotificationItem = ({ notification }) => {
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  
  return (
    <div className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}>
      <div className={`notification-icon ${color}`}>
        {icon}
      </div>
      <div className="notification-content">
        <p className="notification-title">{notification.title}</p>
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">{formatTime(notification.createdAt)}</span>
      </div>
      {notification.actionUrl && (
        <Link href={notification.actionUrl} className="notification-action">
          View
        </Link>
      )}
    </div>
  );
};
```
