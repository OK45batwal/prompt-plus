# AI Prompt+ — Database Design

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI PROMPT+ DATABASE SCHEMA                                  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐                    │
│  │    users     │         │   prompts    │         │   versions   │                    │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤                    │
│  │ id (PK)      │───1:N──▶│ id (PK)      │───1:N──▶│ id (PK)      │                    │
│  │ email        │         │ userId (FK)  │         │ promptId (FK)│                    │
│  │ name         │         │ title        │         │ version      │                    │
│  │ avatar       │         │ originalText │         │ text         │                    │
│  │ passwordHash │         │ enhancedText │         │ score        │                    │
│  │ provider     │         │ model        │         │ changes      │                    │
│  │ providerId   │         │ category     │         │ createdAt    │                    │
│  │ apiKey       │         │ tone         │         └──────────────┘                    │
│  │ createdAt    │         │ length       │                                              │
│  │ createdAt    │         │ score        │         ┌──────────────┐                    │
│  │ updatedAt    │         │ tags         │         │  analyses    │                    │
│  │ lastLoginAt  │         │ isSaved      │         ├──────────────┤                    │
│  └──────────────┘         │ isFavorite   │         │ id (PK)      │                    │
│         │                 │ collectionId │         │ promptId (FK)│                    │
│         │                 │ sharedToken  │         │ intent       │                    │
│         │                 │ createdAt    │         │ category     │                    │
│         │                 │ updatedAt    │         │ complexity   │                    │
│         │                 └──────┬───────┘         │ confidence   │                    │
│         │                        │                 │ entities     │                    │
│         │                        │                 │ context      │                    │
│         │                        │                 │ missing      │                    │
│         │                        │                 │ suggestions  │                    │
│         │                        │                 │ keywords     │                    │
│         │                        │                 │ createdAt    │                    │
│         │                        │                 └──────────────┘                    │
│         │                        │                                                      │
│         │                        │                 ┌──────────────┐                    │
│         │                        │                 │ collections  │                    │
│         │                        │                 ├──────────────┤                    │
│         │                        └────────────────▶│ id (PK)      │                    │
│         │                                          │ userId (FK)  │                    │
│         │         ┌──────────────┐                 │ name         │                    │
│         │         │  api_keys    │                 │ description  │                    │
│         │         ├──────────────┤                 │ color        │                    │
│         └────────▶│ id (PK)      │                 │ icon         │                    │
│                   │ userId (FK)  │                 │ createdAt    │                    │
│                   │ provider     │                 └──────────────┘                    │
│                   │ apiKey       │                                                      │
│                   │ isActive     │                 ┌──────────────┐                    │
│                   │ lastUsedAt   │                 │  templates   │                    │
│                   │ usageCount   │                 ├──────────────┤                    │
│                   │ createdAt    │                 │ id (PK)      │                    │
│                   └──────────────┘                 │ title        │                    │
│                                                    │ description  │                    │
│         ┌──────────────┐                           │ category     │                    │
│         │  analytics   │                           │ prompt       │                    │
│         ├──────────────┤                           │ variables    │                    │
│         │ id (PK)      │                           │ model        │                    │
│         │ userId (FK)  │                           │ usageCount   │                    │
│         │ promptId(FK) │                           │ createdAt    │                    │
│         │ action       │                           └──────────────┘                    │
│         │ metadata     │                                                              │
│         │ createdAt    │                           ┌──────────────┐                    │
│         └──────────────┘                           │  usage_logs  │                    │
│                                                    ├──────────────┤                    │
│         ┌──────────────┐                           │ id (PK)      │                    │
│         │ notifications│                           │ userId (FK)  │                    │
│         ├──────────────┤                           │ action       │                    │
│         │ id (PK)      │                           │ promptId(FK) │                    │
│         │ userId (FK)  │                           │ model        │                    │
│         │ type         │                           │ tokens       │                    │
│         │ title        │                           │ cost         │                    │
│         │ message      │                           │ createdAt    │                    │
│         │ isRead       │                           └──────────────┘                    │
│         │ createdAt    │                                                              │
│         └──────────────┘                                                              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Entity Definitions

### 1. Users Table

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  avatar        TEXT,
  password_hash VARCHAR(255),           -- NULL for OAuth users
  provider      VARCHAR(50) DEFAULT 'email',  -- email, google, github
  provider_id   VARCHAR(255),           -- OAuth provider ID
  api_key       VARCHAR(255),           -- User's API key for external access (optional)
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
```

**Relationships:**
- `users` 1:N `prompts`
- `users` 1:N `collections`
- `users` 1:N `api_keys`
- `users` 1:N `analytics`
- `users` 1:N `notifications`
- `users` 1:N `usage_logs`

---

### 2. Prompts Table

```sql
CREATE TABLE prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(500),
  original_text TEXT NOT NULL,
  enhanced_text TEXT,
  model         VARCHAR(50) NOT NULL,       -- chatgpt, claude, gemini, etc.
  category      VARCHAR(50),                -- code, content, image, etc.
  tone          VARCHAR(50),                -- professional, casual, etc.
  length        VARCHAR(20),                -- short, medium, long
  score         JSONB,                      -- { clarity, specificity, context, completeness, overall }
  tags          TEXT[],                     -- Array of tags
  is_saved      BOOLEAN DEFAULT FALSE,
  is_favorite   BOOLEAN DEFAULT FALSE,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  shared_token  VARCHAR(255) UNIQUE,        -- For sharing prompts
  last_action   VARCHAR(50),                -- created, enhanced, saved, etc.
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  enhanced_at   TIMESTAMP,
  saved_at      TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_collection_id ON prompts(collection_id);
CREATE INDEX idx_prompts_model ON prompts(model);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_is_saved ON prompts(is_saved);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_shared_token ON prompts(shared_token);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
CREATE INDEX idx_prompts_search ON prompts USING GIN(
  to_tsvector('english', original_text || ' ' || COALESCE(title, ''))
);
```

**Relationships:**
- `prompts` N:1 `users`
- `prompts` N:1 `collections` (optional)
- `prompts` 1:N `versions`
- `prompts` 1:N `analyses`
- `prompts` 1:N `analytics`
- `prompts` 1:N `usage_logs`

---

### 3. Versions Table

```sql
CREATE TABLE versions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id  UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  version    INTEGER NOT NULL,
  text       TEXT NOT NULL,
  score      JSONB,
  changes    JSONB,                        -- Array of changes made
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(prompt_id, version)
);

-- Indexes
CREATE INDEX idx_versions_prompt_id ON versions(prompt_id);
CREATE INDEX idx_versions_version ON versions(prompt_id, version DESC);
```

**Score Schema:**
```json
{
  "clarity": 92,
  "specificity": 85,
  "context": 88,
  "completeness": 83,
  "overall": 87
}
```

**Changes Schema:**
```json
[
  { "type": "role", "description": "Added expert role", "impact": 0.15 },
  { "type": "structure", "description": "Added outline", "impact": 0.20 },
  { "type": "formatting", "description": "Added markdown rules", "impact": 0.10 }
]
```

---

### 4. Analyses Table

```sql
CREATE TABLE analyses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id   UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  intent      VARCHAR(50) NOT NULL,        -- content_generation, code_generation, etc.
  category    VARCHAR(50) NOT NULL,        -- blog_post, email, function, etc.
  complexity  INTEGER CHECK (complexity BETWEEN 1 AND 5),
  confidence  DECIMAL(3,2),                -- 0.00 to 1.00
  entities    JSONB,                       -- Extracted entities
  context     JSONB,                       -- Detected context
  keywords    TEXT[],                      -- Extracted keywords
  missing     JSONB,                       -- Missing requirements
  suggestions JSONB,                       -- Improvement suggestions
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analyses_prompt_id ON analyses(prompt_id);
CREATE INDEX idx_analyses_intent ON analyses(intent);
CREATE INDEX idx_analyses_category ON analyses(category);
```

**Intent Types:**
```typescript
type IntentType = 
  | 'content_generation'
  | 'code_generation'
  | 'image_generation'
  | 'data_analysis'
  | 'email'
  | 'education'
  | 'business'
  | 'creative';
```

**Category Types:**
```typescript
type CategoryType = 
  | 'blog_post'
  | 'article'
  | 'tutorial'
  | 'documentation'
  | 'email'
  | 'social_media'
  | 'function'
  | 'class'
  | 'api_endpoint'
  | 'unit_test'
  | 'code_review'
  | 'debugging'
  | 'image'
  | 'logo'
  | 'illustration'
  | 'data_visualization'
  | 'report'
  | 'presentation'
  | 'other';
```

---

### 5. Collections Table

```sql
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  color       VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  icon        VARCHAR(50) DEFAULT 'folder',
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
```

**Relationships:**
- `collections` N:1 `users`
- `collections` 1:N `prompts`

---

### 6. Templates Table

```sql
CREATE TABLE templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(50) NOT NULL,
  prompt      TEXT NOT NULL,                -- Template with {{variables}}
  variables   JSONB NOT NULL,              -- Variable definitions
  model       VARCHAR(50),                 -- Compatible models
  usage_count INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT FALSE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);
```

**Variables Schema:**
```json
[
  {
    "name": "function_name",
    "type": "text",
    "label": "Function Name",
    "placeholder": "calculate_distance",
    "required": true
  },
  {
    "name": "description",
    "type": "textarea",
    "label": "Description",
    "placeholder": "What should the function do?",
    "required": true
  },
  {
    "name": "return_type",
    "type": "select",
    "label": "Return Type",
    "options": ["str", "int", "float", "bool", "None"],
    "required": true
  }
]
```

---

### 7. API Keys Table

```sql
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      VARCHAR(50) NOT NULL,     -- openai, anthropic, google, etc.
  api_key_enc   TEXT NOT NULL,            -- Encrypted API key
  is_active     BOOLEAN DEFAULT TRUE,
  last_used_at  TIMESTAMP,
  usage_count   INTEGER DEFAULT 0,
  rate_limit    INTEGER DEFAULT 100,      -- Requests per minute
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON api_keys(provider);
```

**Supported Providers:**
```typescript
type Provider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'           // Grok
  | 'deepseek'
  | 'ollama'        // Local
  | 'lmstudio'      // Local
  | 'stability'     // Stable Diffusion
  | 'midjourney';
```

---

### 8. Analytics Table

```sql
CREATE TABLE analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id   UUID REFERENCES prompts(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,       -- created, enhanced, saved, exported, shared
  metadata    JSONB,                      -- Additional data
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_action ON analytics(action);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX idx_analytics_prompt_id ON analytics(prompt_id);
```

**Action Types:**
```typescript
type AnalyticsAction = 
  | 'prompt_created'
  | 'prompt_analyzed'
  | 'prompt_enhanced'
  | 'prompt_saved'
  | 'prompt_copied'
  | 'prompt_exported'
  | 'prompt_shared'
  | 'prompt_deleted'
  | 'template_used'
  | 'collection_created'
  | 'api_key_added'
  | 'api_key_removed';
```

---

### 9. Usage Logs Table

```sql
CREATE TABLE usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id   UUID REFERENCES prompts(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,       -- api_call, enhancement, analysis
  model       VARCHAR(50),                -- Model used
  provider    VARCHAR(50),                -- Provider used
  tokens_in   INTEGER,                    -- Input tokens
  tokens_out  INTEGER,                    -- Output tokens
  cost        DECIMAL(10,6),              -- Cost in USD
  latency_ms  INTEGER,                    -- Response time
  success     BOOLEAN DEFAULT TRUE,
  error       TEXT,                       -- Error message if failed
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_model ON usage_logs(model);
```

---

### 10. Notifications Table

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,       -- info, success, warning, error
  title       VARCHAR(255) NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,                       -- URL to navigate to
  metadata    JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## Relationship Summary

```
users ──────────────┬──────────────────┬──────────────────┬──────────────────┐
  │                 │                  │                  │                  │
  │ 1:N             │ 1:N              │ 1:N              │ 1:N              │ 1:N
  ▼                 ▼                  ▼                  ▼                  ▼
prompts          collections       api_keys          analytics        usage_logs
  │                                                          │
  │ 1:N                                                      │ 1:N
  ├──────────────┬──────────────────┐                        │
  │              │                  │                        │
  ▼              ▼                  ▼                        │
versions      analyses          templates                   │
                                          (author_id) ◀──────┘
```

---

## Query Examples

### Get User's Prompts with Stats
```sql
SELECT 
  p.*,
  COUNT(DISTINCT v.id) as version_count,
  MAX(v.score->>'overall')::int as best_score,
  COUNT(DISTINCT a.id) as analysis_count
FROM prompts p
LEFT JOIN versions v ON v.prompt_id = p.id
LEFT JOIN analyses a ON a.prompt_id = p.id
WHERE p.user_id = $1
GROUP BY p.id
ORDER BY p.created_at DESC;
```

### Get Prompt History with Filters
```sql
SELECT 
  p.id,
  p.original_text,
  p.model,
  p.last_action,
  p.created_at,
  v.score
FROM prompts p
LEFT JOIN versions v ON v.prompt_id = p.id AND v.version = (
  SELECT MAX(version) FROM versions WHERE prompt_id = p.id
)
WHERE p.user_id = $1
  AND ($2::timestamp IS NULL OR p.created_at >= $2)
  AND ($3::timestamp IS NULL OR p.created_at <= $3)
  AND ($4::text IS NULL OR p.model = $4)
  AND ($5::text IS NULL OR p.last_action = $5)
ORDER BY p.created_at DESC
LIMIT $6 OFFSET $7;
```

### Get Analytics Overview
```sql
SELECT 
  COUNT(DISTINCT p.id) as total_prompts,
  COUNT(DISTINCT CASE WHEN a.action = 'prompt_enhanced' THEN a.id END) as enhancements,
  AVG((v.score->>'overall')::int) as avg_score,
  SUM(CASE WHEN a.action = 'prompt_copied' THEN 1 ELSE 0 END) as copies
FROM prompts p
LEFT JOIN versions v ON v.prompt_id = p.id
LEFT JOIN analytics a ON a.prompt_id = p.id
WHERE p.user_id = $1
  AND p.created_at >= NOW() - INTERVAL '30 days';
```

### Get Model Usage Distribution
```sql
SELECT 
  model,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM prompts
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY model
ORDER BY count DESC;
```

### Full-Text Search
```sql
SELECT 
  id,
  title,
  original_text,
  enhanced_text,
  ts_rank(
    to_tsvector('english', original_text || ' ' || COALESCE(title, '')),
    plainto_tsquery('english', $1)
  ) as rank
FROM prompts
WHERE user_id = $2
  AND to_tsvector('english', original_text || ' ' || COALESCE(title, '')) 
      @@ plainto_tsquery('english', $1)
ORDER BY rank DESC
LIMIT 20;
```

---

## Data Retention

| Data Type | Retention Period | Action |
|-----------|------------------|--------|
| User accounts | Until deleted | User-initiated |
| Prompts | Until deleted | User-initiated |
| Versions | 90 days | Archive |
| Analyses | 90 days | Archive |
| Analytics | 1 year | Archive |
| Usage logs | 6 months | Archive |
| Notifications | 30 days | Delete |
| API keys | Until removed | User-initiated |

---

## Indexing Strategy

### Primary Indexes (B-tree)
- All foreign keys
- Timestamp columns for sorting
- Status columns for filtering

### Full-Text Search Indexes (GIN)
- `prompts.original_text`
- `prompts.enhanced_text`
- `prompts.title`

### Partial Indexes
```sql
-- Only saved prompts
CREATE INDEX idx_prompts_saved ON prompts(user_id, created_at DESC) 
WHERE is_saved = TRUE;

-- Only favorites
CREATE INDEX idx_prompts_favorites ON prompts(user_id, created_at DESC) 
WHERE is_favorite = TRUE;

-- Active API keys
CREATE INDEX idx_api_keys_active ON api_keys(user_id, provider) 
WHERE is_active = TRUE;

-- Unread notifications
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) 
WHERE is_read = FALSE;
```

---

## Migration Strategy

### Version Control
- All migrations in `prisma/migrations/`
- Named: `YYYYMMDDHHMMSS_description`
- Never modify applied migrations

### Rollback Strategy
```bash
# Rollback last migration
npx prisma migrate reset

# Rollback specific migration
npx prisma migrate resolve --rolled-back <migration_id>
```

### Data Migration
```typescript
// For data migrations, use scripts
async function migrateData() {
  // 1. Backup current data
  // 2. Run migration
  // 3. Verify data integrity
  // 4. Update indexes
}
```

---

## Backup Strategy

### Automated Backups
- **Daily**: Full database backup
- **Hourly**: Incremental backup
- **Real-time**: WAL archiving (PostgreSQL)

### Backup Storage
- Primary: Cloud storage (S3/R2)
- Secondary: Different region
- Encryption: AES-256

### Recovery Time Objective (RTO)
- Database restore: < 1 hour
- Point-in-time recovery: < 15 minutes

### Recovery Point Objective (RPO)
- Maximum data loss: 1 hour
