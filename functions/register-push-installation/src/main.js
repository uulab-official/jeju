const DEFAULT_ENDPOINT = 'https://appwrite.uulab.co.kr/v1';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jeju';
const TABLE_ID = process.env.APPWRITE_PUSH_TABLE_ID || 'push_installations';
const EXPECTED_PROJECT_ID = '6a615d4e00392e50bbd8';
const FETCH_TIMEOUT_MS = 8_000;
const EXPO_TOKEN_PATTERN = /^(?:Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/;
const INSTALLATION_PATTERN = /^install-[a-z0-9-]{8,48}$/;

export default async function registerPushInstallation({ req, res, error }) {
  try {
    const config = appwriteConfig(req);
    if (!config.apiKey) return res.json({ ok: false, error: 'Appwrite function API key is missing.' }, 500);

    const body = parseBody(req.body);
    const installationId = clean(body.installationId);
    const active = body.active === true;
    const expoPushToken = clean(body.expoPushToken);
    const projectId = clean(body.projectId);
    const platform = ['ios', 'android'].includes(body.platform) ? body.platform : 'unknown';
    const appVersion = clean(body.appVersion).slice(0, 32);

    if (!INSTALLATION_PATTERN.test(installationId)) return res.json({ ok: false, error: 'Invalid installation ID.' }, 400);
    if (projectId !== EXPECTED_PROJECT_ID) return res.json({ ok: false, error: 'Invalid project ID.' }, 400);
    if (active && !EXPO_TOKEN_PATTERN.test(expoPushToken)) return res.json({ ok: false, error: 'Invalid Expo push token.' }, 400);

    const existing = await getRow(config, installationId);
    const now = new Date().toISOString();
    const data = {
      installationId,
      expoPushToken: active ? expoPushToken : existing?.expoPushToken,
      platform,
      appVersion,
      projectId,
      active,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    if (!data.expoPushToken) return res.json({ ok: false, error: 'Push token is required before disabling.' }, 400);

    await upsertRow(config, installationId, data);
    return res.json({ ok: true, active });
  } catch (cause) {
    error(cause.stack || cause.message);
    return res.json({ ok: false, error: 'Push installation sync failed.' }, 500);
  }
}

function parseBody(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch { return {}; }
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function appwriteConfig(req) {
  return {
    endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || DEFAULT_ENDPOINT,
    projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || EXPECTED_PROJECT_ID,
    databaseId: process.env.APPWRITE_DATABASE_ID || DATABASE_ID,
    apiKey: req.headers?.['x-appwrite-key'] || req.headers?.['X-Appwrite-Key'] || process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  };
}

async function getRow(config, rowId) {
  const response = await fetchWithTimeout(`${config.endpoint}/tablesdb/${config.databaseId}/tables/${TABLE_ID}/rows/${encodeURIComponent(rowId)}`, {
    headers: appwriteHeaders(config),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error((await response.text()).slice(0, 200) || `Appwrite ${response.status}`);
  return response.json();
}

async function upsertRow(config, rowId, data) {
  const response = await fetchWithTimeout(`${config.endpoint}/tablesdb/${config.databaseId}/tables/${TABLE_ID}/rows/${encodeURIComponent(rowId)}`, {
    method: 'PUT',
    headers: { ...appwriteHeaders(config), 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, permissions: [] }),
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 200) || `Appwrite ${response.status}`);
  return response.json();
}

function appwriteHeaders(config) {
  return {
    'X-Appwrite-Project': config.projectId,
    'X-Appwrite-Key': config.apiKey,
    Accept: 'application/json',
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
