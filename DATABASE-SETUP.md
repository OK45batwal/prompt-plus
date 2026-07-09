# Database Setup Guide

## Option 1: Supabase (Recommended - Free Tier)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free
3. Create a new project

### Step 2: Get Connection String
1. In your project, go to **Settings** → **Database**
2. Copy the **Connection string** → **URI**
3. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres`

### Step 3: Update .env
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

### Step 4: Push Schema to Database
```bash
npx prisma db push
```

### Step 5: Generate Prisma Client
```bash
npx prisma generate
```

---

## Option 2: Neon (Alternative - Free Tier)

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up for free
3. Create a new project

### Step 2: Get Connection String
1. In your project dashboard, copy the **Connection string**
2. It will look like: `postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Step 3: Update .env
```bash
DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Step 4: Push Schema to Database
```bash
npx prisma db push
```

---

## Option 3: Local PostgreSQL

### Step 1: Install PostgreSQL
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb ai_prompt_plus
```

### Step 2: Update .env
```bash
DATABASE_URL="postgresql://localhost:5432/ai_prompt_plus"
```

### Step 3: Push Schema
```bash
npx prisma db push
```

---

## After Database Setup

Run these commands:
```bash
npx prisma db push
npx prisma generate
npm run build
```

## Verify Setup
```bash
npx prisma studio
```
This opens a web interface to view your database tables.
