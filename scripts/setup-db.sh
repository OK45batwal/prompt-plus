#!/bin/bash

# AI Prompt+ Database Setup Script
# This script helps set up the database connection

echo "🔧 AI Prompt+ Database Setup"
echo "============================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Creating from template..."
  cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_prompt_plus"

# NextAuth
NEXTAUTH_SECRET="your-secret-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OAuth - Google
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OAuth - GitHub
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AI - App's Keys
OPENAI_API_KEY=""

# Rate Limiting (abuse protection)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
EOF
fi

echo "📋 Current DATABASE_URL:"
grep "DATABASE_URL" .env | head -1
echo ""

echo "Choose database option:"
echo "1) Supabase (Recommended - Free)"
echo "2) Neon (Alternative - Free)"
echo "3) Local PostgreSQL"
echo "4) Skip (use mock data)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📌 Supabase Setup:"
    echo "1. Go to https://supabase.com and create a project"
    echo "2. Go to Settings → Database → Connection string → URI"
    echo "3. Copy the connection string"
    echo ""
    read -p "Paste your Supabase connection string: " db_url
    
    if [ -n "$db_url" ]; then
      # Update .env with new DATABASE_URL
      sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$db_url\"|" .env
      rm -f .env.bak
      echo "✅ DATABASE_URL updated!"
    fi
    ;;
  2)
    echo ""
    echo "📌 Neon Setup:"
    echo "1. Go to https://neon.tech and create a project"
    echo "2. Copy the connection string from dashboard"
    echo ""
    read -p "Paste your Neon connection string: " db_url
    
    if [ -n "$db_url" ]; then
      sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$db_url\"|" .env
      rm -f .env.bak
      echo "✅ DATABASE_URL updated!"
    fi
    ;;
  3)
    echo ""
    echo "📌 Local PostgreSQL:"
    echo "Make sure PostgreSQL is running on localhost:5432"
    echo "DATABASE_URL already set to: postgresql://localhost:5432/ai_prompt_plus"
    ;;
  4)
    echo ""
    echo "⏭️  Skipping database setup. Using mock data."
    echo "You can set up the database later."
    exit 0
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🚀 Pushing schema to database..."
npx prisma db push

echo ""
echo "📦 Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Run 'npm run dev' to start the app."
