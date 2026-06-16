/**
 * Paper Trader — Cloudflare Worker
 * Signal9 Apps
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   — your Anthropic key
 *   COINGECKO_API_KEY   — free CoinGecko demo key
 *   FINNHUB_API_KEY     — free Finnhub key (for stocks)
 *
 * Routes:
 *   GET  /coingecko/*  → api.coingecko.com/api/v3/*
 *   GET  /stocks/*     → finnhub.io/api/v1/*
 *   POST /  or  /ai   → Anthropic /v1/messages
 */

const ALLOWED_ORIGIN = 'https://dogowar01.github.io';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // ── CoinGecko proxy ──────────────────────────────────────
    if (request.method === 'GET' && url.pathname.startsWith('/coingecko/')) {
      const cgPath = url.pathname.slice('/coingecko/'.length);
      const cgUrl  = `https://api.coingecko.com/api/v3/${cgPath}${url.search}`;
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'PaperTrader/1.0 (Signal9 paper trading app)',
      };
      if (env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;
      const cgRes = await fetch(cgUrl, { headers });
      return new Response(await cgRes.text(), {
        status: cgRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      });
    }

    // ── Finnhub quote proxy ──────────────────────────────────
    if (request.method === 'GET' && url.pathname.startsWith('/stocks/quote')) {
      const sep   = url.search ? '&' : '?';
      const fhUrl = `https://finnhub.io/api/v1/quote${url.search}${sep}token=${env.FINNHUB_API_KEY}`;
      const fhRes = await fetch(fhUrl, { headers: { 'Accept': 'application/json' } });
      return new Response(await fhRes.text(), {
        status: fhRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      });
    }

    // ── Yahoo Finance history proxy (stock charts) ───────────
    if (request.method === 'GET' && url.pathname.startsWith('/stocks/history/')) {
      const symbol   = url.pathname.slice('/stocks/history/'.length);
      const range    = url.searchParams.get('range')    || '3mo';
      const interval = url.searchParams.get('interval') || '1d';
      const yhUrl    = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
      const yhRes    = await fetch(yhUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PaperTrader/1.0)',
          'Accept': 'application/json',
        }
      });
      return new Response(await yhRes.text(), {
        status: yhRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
      });
    }

    // ── Anthropic proxy ──────────────────────────────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    if (url.pathname !== '/' && url.pathname !== '/ai') {
      return new Response('Not found', { status: 404 });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response('Invalid JSON', { status: 400 }); }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      body.model      || 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 1000,
        messages:   body.messages,
      }),
    });

    return new Response(JSON.stringify(await anthropicRes.json()), {
      status: anthropicRes.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': ALLOWED_ORIGIN },
    });
  },
};
