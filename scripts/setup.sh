#!/bin/bash
# EVX Setup Script — run after cloning + filling in .env
set -e

echo ""
echo "🚀 EVX Setup Starting..."
echo ""

command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }

echo "📦 Installing dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  .env created from template."
  echo "    Fill in SUPABASE and OPENAI credentials, then re-run."
  exit 1
fi

echo "🔍 Type checking..."
npx tsc --noEmit && echo "✅ TypeScript: clean"

echo ""
echo "✅ Ready! Run: npm start"
echo ""
echo "📋 Remaining setup:"
echo "  1. Run SQL in Supabase Dashboard:"
echo "     supabase/migrations/001_initial_schema.sql"
echo "     supabase/migrations/002_storage_buckets.sql"
echo ""
echo "  2. Deploy AI Edge Function:"
echo "     supabase functions deploy ai-orchestrator"
echo "     supabase secrets set OPENAI_API_KEY=sk-..."
