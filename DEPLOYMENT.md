# Se'kret Bip — Deployment Guide

> Environment configuration, secrets management, and deployment steps.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Expo / React Native App                                        │
│  Deployed on Vercel (web) + EAS (native)                        │
│  Uses: EXPO_PUBLIC_SUPABASE_URL                                 │
│        EXPO_PUBLIC_SUPABASE_ANON_KEY                            │
│        EXPO_PUBLIC_BACKEND_URL                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST /api/sekret/reply
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker (worker/sekret-reply.ts)                     │
│  Secret: OPENAI_API_KEY  ← set via `wrangler secret put` ONLY  │
│  Never exposed to Expo, Vercel, GitHub, or any client code      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase                                                       │
│  Project ref: tbsevonvegdnlyjgplmm                              │
│  URL: https://tbsevonvegdnlyjgplmm.supabase.co                 │
│  Anon key: safe to expose (RLS enforced)                        │
│  service_role key: server-side ONLY, never in client code       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Frontend (Expo / Vercel)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (safe to expose — RLS enforced) |
| `EXPO_PUBLIC_BACKEND_URL` | No | Cloudflare Worker URL. Blank = Se'kret AI runs in fallback mode |

### Backend (Cloudflare Worker — secrets only)

| Variable | How to set | Description |
|---|---|---|
| `OPENAI_API_KEY` | `wrangler secret put OPENAI_API_KEY` | OpenAI API key. **Never** in any file or Expo env |

### Forbidden

These must **never** appear in any Expo file, `.env.local`, Vercel env, or GitHub:
- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Any `SERVICE_ROLE` value

---

## Local Development Setup

```bash
# 1. Copy env template
cp .env.example .env.local

# 2. Fill in .env.local:
#    EXPO_PUBLIC_SUPABASE_URL=https://tbsevonvegdnlyjgplmm.supabase.co
#    EXPO_PUBLIC_SUPABASE_ANON_KEY=<from Supabase → Project Settings → API>
#    EXPO_PUBLIC_BACKEND_URL=   (blank until Worker is deployed)

# 3. Install dependencies
npm install

# 4. Start Expo
npx expo start
```

Values for `EXPO_PUBLIC_SUPABASE_ANON_KEY` are in your Supabase dashboard:
**Project Settings → API → Project API Keys → anon / public**

---

## Supabase Setup

```bash
# Run the full bootstrap SQL once on a fresh project:
# 1. Open Supabase dashboard → SQL Editor
# 2. Open the Raw view of: supabase/migrations/sekret_bip_full_bootstrap.sql
#    (GitHub → file → Raw button → Select All → Copy)
# 3. Paste into SQL Editor → Run
```

The bootstrap creates all tables, enums, RLS policies, triggers, functions,
and storage buckets in a single idempotent script.

---

## Cloudflare Worker Deployment

```bash
# 1. Set the OpenAI secret (one-time per account)
wrangler secret put OPENAI_API_KEY
# Paste your key when prompted — it is never written to disk

# 2. Deploy the worker
wrangler deploy

# 3. Copy the deployed URL (e.g. https://bip-worker.<account>.workers.dev)
#    and set it in .env.local:
#    EXPO_PUBLIC_BACKEND_URL=https://bip-worker.<account>.workers.dev

# 4. (Optional) Set a custom domain in Cloudflare dashboard
```

The worker route is `POST /api/sekret/reply`.

---

## Vercel (Web) Deployment

```bash
# Deploy
vercel --prod
```

In the Vercel dashboard → Project Settings → Environment Variables, add:

| Name | Value | Environment |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://tbsevonvegdnlyjgplmm.supabase.co` | Production, Preview, Development |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `<anon key>` | Production, Preview, Development |
| `EXPO_PUBLIC_BACKEND_URL` | `<worker URL>` | Production, Preview, Development |

**Do not add `OPENAI_API_KEY` to Vercel.** It belongs only in the Worker secret store.

---

## EAS (Native Build) Deployment

```bash
# Configure EAS secrets (replaces .env.local for CI builds)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://tbsevonvegdnlyjgplmm.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon key>"
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value "<worker URL>"

# Build
eas build --platform all
```

**Do not add `OPENAI_API_KEY` as an EAS secret.** Client builds must never contain it.

---

## Startup Validation

`utils/env.ts` runs at app boot and logs:

- `⚠️ warning` if `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` is missing → cloud sync disabled, app runs on local AsyncStorage
- `ℹ️ info` if `EXPO_PUBLIC_BACKEND_URL` is missing → Se'kret AI uses pre-written fallback replies
- `🚨 SECURITY error` if `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SERVICE_ROLE` is found in client env → rotate immediately

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (already configured)
- [ ] `OPENAI_API_KEY` set via `wrangler secret put` only
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never in any client file
- [ ] Supabase RLS policies active (verified via `sekret_bip_full_bootstrap.sql`)
- [ ] Worker CORS origin restricted to production domain before public launch
- [ ] No secrets in GitHub Actions (use EAS secrets for builds)
