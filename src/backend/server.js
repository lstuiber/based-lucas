import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
dotenv.config({ path: '../../.env' });

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
const PORT = 3000;

// --- logger ---------------------------------------------------------------
function log(level, tag, message, data = {}) {
  const ts = new Date().toISOString();
  const dataStr = Object.keys(data).length
    ? '  ' + Object.entries(data).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(' ')
    : '';
  const fn = level === 'error' ? console.error : console.log;
  fn(`${ts}  ${level.toUpperCase().padEnd(5)}  [${tag}]  ${message}${dataStr}`);
}

// --- request logger middleware --------------------------------------------
app.use((req, _res, next) => {
  log('info', 'request', `${req.method} ${req.path}`);
  next();
});

// --- shared Oura daily score fetcher --------------------------------------
// All three daily score endpoints (sleep, readiness, activity) follow the
// same pattern: fetch yesterday→today, return the most recent record.
async function fetchLatestScore(accessToken, ouraEndpoint, tag, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    log('info', tag, 'fetch_start', { start: yesterday, end: today });

    const response = await fetch(
      `https://api.ouraring.com/v2/usercollection/${ouraEndpoint}?start_date=${yesterday}&end_date=${today}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const body = await response.json();
    if (!response.ok) {
      log('error', tag, 'fetch_failed', { status: response.status, detail: body.detail });
      return res.status(response.status).json(body);
    }

    const latest = body.data?.at(-1) ?? null;
    if (!latest) {
      log('warn', tag, 'no_data', { start: yesterday, end: today, recordCount: body.data?.length ?? 0 });
    } else {
      log('info', tag, 'fetch_success', { day: latest.day, score: latest.score, recordCount: body.data.length });
    }

    res.json(latest);
  } catch (err) {
    log('error', tag, 'fetch_error', { message: err.message });
    next(err);
  }
}

// --------------------------------------------------------------------------

app.get('/api/auth/status', (req, res) => {
  const loggedIn = !!req.cookies.refreshToken;
  log('info', 'auth', 'status_check', { loggedIn });
  res.json({ loggedIn });
});

app.get('/', async (req, res) => {
  res.json(['Shirt', 'Pants', 'Shoes']);
});

app.post('/api/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    log('warn', 'auth', 'token_refresh_failed', { reason: 'no_cookie' });
    return res.status(401).json({ error: 'No refresh token' });
  }

  log('info', 'auth', 'token_refresh_start');
  const response = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.oura_client_id,
      client_secret: process.env.oura_secret,
    })
  });

  const data = await response.json();
  if (!response.ok) {
    log('error', 'auth', 'token_refresh_failed', { status: response.status, error: data.error });
    return res.status(response.status).json(data);
  }

  log('info', 'auth', 'token_refresh_success', { expiresIn: data.expires_in, tokenType: data.token_type });
  res.cookie('refreshToken', data.refresh_token, { httpOnly: true, sameSite: 'lax', path: '/' });
  const { refresh_token, ...rest } = data;
  res.json(rest);
});

app.post('/api/oura/token', async (req, res, next) => {
  try {
    const { code } = req.body;
    log('info', 'auth', 'token_exchange_start', { hasCode: !!code });

    const apiRes = await fetch('https://api.ouraring.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.oura_client_id,
        client_secret: process.env.oura_secret,
        redirect_uri: 'http://localhost:5173/dashboard'
      })
    });

    const data = await apiRes.json();
    if (!apiRes.ok) {
      log('error', 'auth', 'token_exchange_failed', { status: apiRes.status, error: data.error });
      return res.status(apiRes.status).json(data);
    }

    log('info', 'auth', 'token_exchange_success', { status: apiRes.status, expiresIn: data.expires_in, tokenType: data.token_type });
    res.cookie('refreshToken', data.refresh_token, { httpOnly: true, sameSite: 'lax', path: '/' });
    const { refresh_token, ...rest } = data;
    res.status(apiRes.status).json(rest);
  } catch (err) {
    log('error', 'auth', 'token_exchange_error', { message: err.message });
    next(err);
  }
});

app.post('/api/sleep', (req, res, next) => {
  fetchLatestScore(req.body.accessToken, 'daily_sleep', 'sleep', res, next);
});

app.post('/api/readiness', (req, res, next) => {
  fetchLatestScore(req.body.accessToken, 'daily_readiness', 'readiness', res, next);
});

app.post('/api/activity', (req, res, next) => {
  fetchLatestScore(req.body.accessToken, 'daily_activity', 'activity', res, next);
});

// --- shared averages fetcher ----------------------------------------------
// Fetches 90 days of data and computes avg scores for 7, 30, and 90-day windows.
async function fetchAverages(accessToken, ouraEndpoint, tag, res, next) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

    log('info', tag, 'averages_fetch_start', { start: ninetyDaysAgo, end: today });

    const response = await fetch(
      `https://api.ouraring.com/v2/usercollection/${ouraEndpoint}?start_date=${ninetyDaysAgo}&end_date=${today}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const body = await response.json();
    if (!response.ok) {
      log('error', tag, 'averages_fetch_failed', { status: response.status });
      return res.status(response.status).json(body);
    }

    const records = body.data ?? [];

    const avg = (days) => {
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const subset = records.filter(r => r.day >= cutoff && r.score != null);
      if (!subset.length) return null;
      return Math.round(subset.reduce((sum, r) => sum + r.score, 0) / subset.length);
    };

    const result = { avg7: avg(7), avg30: avg(30), avg90: avg(90) };
    log('info', tag, 'averages_fetch_success', { recordCount: records.length, ...result });
    res.json(result);
  } catch (err) {
    log('error', tag, 'averages_fetch_error', { message: err.message });
    next(err);
  }
}

app.post('/api/sleep/averages', (req, res, next) => {
  fetchAverages(req.body.accessToken, 'daily_sleep', 'sleep', res, next);
});

app.post('/api/readiness/averages', (req, res, next) => {
  fetchAverages(req.body.accessToken, 'daily_readiness', 'readiness', res, next);
});

app.post('/api/activity/averages', (req, res, next) => {
  fetchAverages(req.body.accessToken, 'daily_activity', 'activity', res, next);
});

// --- Withings OAuth2 -------------------------------------------------------

app.get('/api/withings/auth/status', (req, res) => {
  const loggedIn = !!req.cookies.withingsRefreshToken;
  log('info', 'withings-auth', 'status_check', { loggedIn });
  res.json({ loggedIn });
});

app.post('/api/withings/token', async (req, res, next) => {
  try {
    const { code } = req.body;
    log('info', 'withings-auth', 'token_exchange_start', { hasCode: !!code });

    const apiRes = await fetch('https://wbsapi.withings.net/v2/oauth2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'requesttoken',
        grant_type: 'authorization_code',
        client_id: process.env.withings_client_id,
        client_secret: process.env.withings_secret,
        code,
        redirect_uri: 'http://localhost:5173/',
      }),
    });

    const data = await apiRes.json();
    if (!apiRes.ok || data.status !== 0) {
      log('error', 'withings-auth', 'token_exchange_failed', { httpStatus: apiRes.status, withingsStatus: data.status });
      return res.status(apiRes.ok ? 400 : apiRes.status).json(data);
    }

    const { refresh_token, ...rest } = data.body;
    log('info', 'withings-auth', 'token_exchange_success', { expiresIn: data.body.expires_in });
    res.cookie('withingsRefreshToken', refresh_token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json(rest);
  } catch (err) {
    log('error', 'withings-auth', 'token_exchange_error', { message: err.message });
    next(err);
  }
});

app.post('/api/withings/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.withingsRefreshToken;
    if (!refreshToken) {
      log('warn', 'withings-auth', 'token_refresh_failed', { reason: 'no_cookie' });
      return res.status(401).json({ error: 'No Withings refresh token' });
    }

    log('info', 'withings-auth', 'token_refresh_start');
    const response = await fetch('https://wbsapi.withings.net/v2/oauth2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'requesttoken',
        grant_type: 'refresh_token',
        client_id: process.env.withings_client_id,
        client_secret: process.env.withings_secret,
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.status !== 0) {
      log('error', 'withings-auth', 'token_refresh_failed', { httpStatus: response.status, withingsStatus: data.status });
      return res.status(response.ok ? 401 : response.status).json(data);
    }

    const { refresh_token, ...rest } = data.body;
    log('info', 'withings-auth', 'token_refresh_success', { expiresIn: data.body.expires_in });
    res.cookie('withingsRefreshToken', refresh_token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json(rest);
  } catch (err) {
    log('error', 'withings-auth', 'token_refresh_error', { message: err.message });
    next(err);
  }
});

// --- Withings body composition measures ------------------------------------

app.post('/api/withings/measures', async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 86400000) / 1000);

    log('info', 'withings-measures', 'fetch_start');

    const url = new URL('https://wbsapi.withings.net/measure');
    url.searchParams.set('action', 'getmeas');
    url.searchParams.set('meastypes', '1,76,8,77');
    url.searchParams.set('category', '1');
    url.searchParams.set('lastupdate', String(thirtyDaysAgo));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok || data.status !== 0) {
      log('error', 'withings-measures', 'fetch_failed', { httpStatus: response.status, withingsStatus: data.status });
      if (data.status === 401 || response.status === 401) return res.status(401).json(data);
      return res.status(response.ok ? 400 : response.status).json(data);
    }

    const groups = data.body?.measuregrps ?? [];
    if (!groups.length) {
      log('warn', 'withings-measures', 'no_data');
      return res.json(null);
    }

    groups.sort((a, b) => b.date - a.date);
    const latest = groups[0];

    function decodeKg(measures, type) {
      const m = measures.find(m => m.type === type);
      if (!m) return null;
      return m.value * Math.pow(10, m.unit);
    }

    function decodeLbs(measures, type) {
      const kg = decodeKg(measures, type);
      if (kg === null) return null;
      return Math.round(kg * 2.20462 * 10) / 10;
    }

    const weightKg = decodeKg(latest.measures, 1);
    const waterKg = decodeKg(latest.measures, 77);
    const waterPct = (weightKg && waterKg !== null)
      ? Math.round((waterKg / weightKg) * 100 * 10) / 10
      : null;

    const result = {
      date: latest.date,
      weight: decodeLbs(latest.measures, 1),
      muscle: decodeLbs(latest.measures, 76),
      fat: decodeLbs(latest.measures, 8),
      water: waterPct,
    };

    log('info', 'withings-measures', 'fetch_success', { weight: result.weight, date: result.date });
    res.json(result);
  } catch (err) {
    log('error', 'withings-measures', 'fetch_error', { message: err.message });
    next(err);
  }
});

app.listen(PORT, () => {
  log('info', 'server', 'started', { port: PORT });
});
