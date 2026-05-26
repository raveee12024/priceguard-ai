# PriceGuard AI — Vercel Deployment Guide

A 4-agent inflation-aware budget intelligence app. Real CPI data for 10 countries.

---

## Deploy to Vercel in 5 steps

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Click **API Keys** → **Create Key**
3. Copy the key (starts with `sk-ant-...`)

### Step 2 — Put this folder on GitHub
1. Go to https://github.com → **New repository** → name it `priceguard-ai`
2. Make it **Private** (so your code isn't public)
3. Upload this entire folder (drag and drop works on GitHub)

### Step 3 — Connect to Vercel
1. Go to https://vercel.com → **Sign up / Log in** (free)
2. Click **Add New → Project**
3. Click **Import** next to your `priceguard-ai` GitHub repo
4. Vercel auto-detects Next.js — click **Deploy** (don't change any settings)

### Step 4 — Add your API key
1. After deploy, go to your project in Vercel dashboard
2. Click **Settings → Environment Variables**
3. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-your-key-here`
   - **Environment:** Production + Preview + Development
4. Click **Save**

### Step 5 — Redeploy
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment → **Redeploy**
3. Done — your private URL is `https://priceguard-ai-xxxx.vercel.app`

---

## How it works (privacy)
- Your API key is stored only in Vercel's environment — never in the browser
- The app calls `/api/claude` (your own server), which calls Anthropic
- Users cannot see your API key even by inspecting the page source
- Only people with your Vercel URL can access it (share selectively)

## To make it password-protected
In Vercel dashboard → Settings → **Deployment Protection** → Enable **Password Protection**
Set a password — anyone visiting needs to enter it first.

## Local development
```bash
npm install
# Create .env.local with:
# ANTHROPIC_API_KEY=sk-ant-your-key-here
npm run dev
# Open http://localhost:3000
```

## Project structure
```
priceguard-ai/
├── pages/
│   ├── index.js        # Main app (all screens + pipeline)
│   ├── _app.js         # Next.js wrapper
│   └── api/
│       └── claude.js   # Server-side API route (keeps key private)
├── styles/
│   └── globals.css
├── package.json
├── next.config.js
└── README.md
```
