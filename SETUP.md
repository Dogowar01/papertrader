# Paper Trader — Deployment Guide
## Signal9 Apps

This guide gets Paper Trader running on GitHub Pages with full AI analysis on your iPhone.

---

## What's in this package

```
papertrader/
├── index.html              ← The app (mobile PWA)
├── manifest.json           ← PWA install config
├── sw.js                   ← Service worker (offline shell)
├── cloudflare-worker.js    ← Paste this into Cloudflare Workers
├── icons/                  ← Add your own icons (see below)
│   ├── icon-192.png
│   └── icon-512.png
└── SETUP.md                ← This file
```

---

## Step 1 — Create a GitHub repo

1. Go to github.com → New repository
2. Name it `papertrader` (or anything you like)
3. Set it to **Public**
4. Don't initialise with a README (you'll push your own files)

Upload all files from this package into the repo root.

---

## Step 2 — Enable GitHub Pages

1. In your repo → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main` / `root`
4. Save

Your app will be live at:
`https://yourusername.github.io/papertrader/`

---

## Step 3 — Set up the Cloudflare Worker (for AI analysis)

This keeps your Anthropic API key secure — it never touches the client.

### 3a. Get an Anthropic API key
1. Go to console.anthropic.com
2. Sign up / log in
3. API Keys → Create Key
4. Copy and save it somewhere safe

### 3b. Create the Worker
1. Go to workers.cloudflare.com (free account is fine)
2. Create Application → Create Worker
3. Name it `paper-trader-proxy`
4. Delete the default code
5. Paste the entire contents of `cloudflare-worker.js`
6. Click **Deploy**

### 3c. Add your API key as a secret
1. In your Worker → Settings → Variables
2. Under **Environment Variables** → Add variable
3. Name: `ANTHROPIC_API_KEY`
4. Value: your Anthropic API key (paste it in)
5. Click **Encrypt** (keeps it secret)
6. Save and Deploy

### 3d. Note your Worker URL
It will look like:
`https://paper-trader-proxy.yourusername.workers.dev`

---

## Step 4 — Update the app with your Worker URL

Open `index.html` and find this line near the top of the `<script>` block:

```javascript
const WORKER_URL = 'YOUR_CLOUDFLARE_WORKER_URL_HERE';
```

Replace it with your actual Worker URL:

```javascript
const WORKER_URL = 'https://paper-trader-proxy.yourusername.workers.dev';
```

Also update `cloudflare-worker.js` to restrict to your domain (optional but good practice):

```javascript
const ALLOWED_ORIGIN = 'https://yourusername.github.io';
```

Push the updated file to GitHub.

---

## Step 5 — Add app icons

The PWA needs two icon files. Create them however you like (Canva, Figma, etc.) — ideally dark background with a chart/graph symbol in Signal9 gold.

Save them as:
- `icons/icon-192.png` (192×192px)
- `icons/icon-512.png` (512×512px)

Push to your repo.

---

## Step 6 — Install on iPhone

1. Open Safari on your iPhone
2. Go to `https://yourusername.github.io/papertrader/`
3. Tap the **Share** button (box with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add**

It will appear on your home screen and launch full-screen like a native app.

---

## Cost notes

- **GitHub Pages**: Free
- **Cloudflare Workers**: Free tier covers 100,000 requests/day (more than enough)
- **CoinGecko**: Free (no key needed, rate limits apply — get a free key at coingecko.com/api to remove limits)
- **Anthropic API**: Each AI analysis call costs roughly $0.001–0.003 AUD. At 10 analyses per day that's under $1/month.

---

## Optional: Free CoinGecko API key

To remove rate limits on price data:
1. Sign up at coingecko.com/api
2. Get your free Demo API key
3. In `index.html`, find the CoinGecko fetch URL and add: `&x_cg_demo_api_key=YOUR_KEY`

---

## Troubleshooting

**AI analysis not loading**: Check your Worker URL is correct in index.html and your ANTHROPIC_API_KEY is set in the Worker settings.

**Prices not loading**: CoinGecko rate limit — wait 60 seconds and refresh. Add a free API key to fix permanently.

**PWA not installing**: Must be served over HTTPS (GitHub Pages handles this automatically).

**Charts blank**: Data loads after prices — wait a moment then switch chart tab to trigger a fresh fetch.
