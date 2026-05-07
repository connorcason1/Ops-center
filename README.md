# OPS CENTER — Setup Guide

## What you need accounts for (all free)
1. **Netlify** — netlify.com (you already have this for Monk Mode)
2. **Supabase** — supabase.com
3. **Google Cloud** — console.cloud.google.com
4. **Anthropic** — console.anthropic.com (tiny cost, ~$0.10/month)

---

## Step 1 — Supabase (5 min)

1. Go to supabase.com, sign in, create a new project
2. Once created, go to **Table Editor → New Table**
3. Name it `daily_data`, turn off Row Level Security for now
4. Add these columns:
   - `date` — type: text, primary key
   - `calendar_events` — type: jsonb
   - `suggestions` — type: jsonb
   - `eod_questions` — type: jsonb
   - `summary_items` — type: jsonb
   - `eod_responses` — type: jsonb
5. Go to **Settings → API**, copy:
   - Project URL → paste as `SUPABASE_URL` in index.html CONFIG
   - `anon` public key → paste as `SUPABASE_ANON_KEY` in index.html CONFIG

---

## Step 2 — Google Calendar (10 min)

1. Go to console.cloud.google.com
2. Create a new project (name it anything)
3. Go to **APIs & Services → Enable APIs** → enable **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add your Netlify URL to Authorized JavaScript Origins (e.g. `https://your-site.netlify.app`)
   Also add `http://localhost:8888` for local testing
7. Copy the **Client ID** → paste as `GOOGLE_CLIENT_ID` in index.html CONFIG
8. Also create an **API Key** on the same Credentials page → paste as `GOOGLE_API_KEY`

---

## Step 3 — Anthropic API Key (2 min)

1. Go to console.anthropic.com → API Keys → create one
2. Copy it — you'll add it to Netlify in Step 5 (NOT in the code)

---

## Step 4 — Deploy to Netlify

1. Push this whole folder to a GitHub repo
2. On netlify.com → Add new site → Import from GitHub → select the repo
3. Build settings: leave blank (no build command, publish directory is `.`)
4. Deploy

---

## Step 5 — Add Secret to Netlify (1 min)

1. In Netlify dashboard → your site → **Site configuration → Environment variables**
2. Add variable: `ANTHROPIC_API_KEY` = your key from Step 3
3. Trigger a redeploy

---

## Step 6 — Install on Phone

1. Open your Netlify URL in Safari (iPhone)
2. Tap the Share button → **Add to Home Screen**
3. It installs like an app

---

## Updating standing priorities

Just tell Claude in chat: "update my priorities — fitness: [new text]" and the CONFIG
block in index.html gets updated. Push to GitHub → auto-deploys in ~30 seconds.
