#!/usr/bin/env bash
# .devcontainer/post-create.sh
# Runs once when a Codespace is created. Idempotent — safe to re-run.

set -euo pipefail

echo "── Se'kret Bip Codespace setup ──────────────────────────────────"

# 1. Install JS deps (legacy-peer-deps avoids Expo SDK 56 peer-resolution churn)
echo "▶ Installing npm dependencies…"
npm install --no-audit --no-fund --legacy-peer-deps

# 2. Seed a local .env file from the example if one doesn't exist.
#    NEVER commit .env.local — it's in .gitignore.
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "▶ Created .env.local from .env.example — fill in your keys before using Supabase."
  fi
fi

# 3. Make sure the Codespace gets a friendly default scripts hint
cat <<'EOF'

────────────────────────────────────────────────────────────────────
✅ Codespace ready.

  npm start              → Expo dev menu (pick web / iOS / Android)
  npx expo start --web   → open the web preview (port 8081 auto-forwards)
  npx tsc --noEmit       → type-check the project

Polish phase first → Supabase wiring second.
See README.md ("Roadmap") for the order.
────────────────────────────────────────────────────────────────────
EOF
