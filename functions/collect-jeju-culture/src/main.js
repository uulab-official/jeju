import { XMLParser } from 'fast-xml-parser';

const API_ORIGIN = 'https://www.jeju.go.kr';
const DEFAULT_ENDPOINT = 'https://appwrite.uulab.co.kr/v1';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jeju';
const ITEMS_TABLE_ID = process.env.APPWRITE_CULTURE_TABLE_ID || 'culture_items';
const SYNC_TABLE_ID = process.env.APPWRITE_SYNC_TABLE_ID || 'sync_runs';
const SOURCE = 'jeju-openapi';
const PAGE_SIZE = 1000;
const MAX_PAGES = 100;
const WRITE_CONCURRENCY = 10;
const WRITE_BATCH_SIZE = 100;
const FETCH_TIMEOUT_MS = 12000;
const FETCH_RETRIES = Math.max(1, Number(process.env.JEJU_API_RETRIES || 3));
const RETRY_BASE_DELAY_MS = Math.max(100, Number(process.env.JEJU_API_RETRY_DELAY_MS || 500));
const parser = new XMLParser({ ignoreAttributes: false, parseTagValue: false, trimValues: false });

const resources = {
  life: { endpoint: '/rest/JejuLifeDialectService/getJejuLifeDialectServiceList', sourceUrl: 'https://www.jeju.go.kr/rest/JejuLifeDialectService/getJejuLifeDialectServiceList' },
  proverb: { endpoint: '/rest/JejuAdageService/getJejuAdageServiceList', sourceUrl: 'https://www.jeju.go.kr/rest/JejuAdageService/getJejuAdageServiceList' },
  dictionary: { endpoint: '/rest/JejuDialectService/getJejuDialectServiceList', sourceUrl: 'https://www.jeju.go.kr/rest/JejuDialectService/getJejuDialectServiceList' },
  keyword: { endpoint: '/rest/JejuAdageIndexService/getJejuAdageIndexList', sourceUrl: 'https://www.jeju.go.kr/rest/JejuAdageIndexService/getJejuAdageIndexList' },
};

const parserRoot = (document) => document?.jejunetApi || {};

export default async function collectJejuCulture({ req, res, log, error }) {
  const startedAt = new Date();
  const config = appwriteConfig(req);
  if (isSmokeRequest(req)) return res.json({ ok: true, smoke: true, source: SOURCE, databaseId: config.databaseId });
  if (!config.apiKey) return res.json({ ok: false, error: 'Appwrite function API key is missing.' }, 500);

  let processed = 0;
  let failed = 0;
  try {
    const checkpoint = await loadCheckpoint(config);
    const nextCheckpoint = { ...checkpoint };
    const allRows = [];
    for (const kind of Object.keys(resources)) {
      const result = await fetchResource(kind, checkpoint[kind]);
      if (!checkpoint[kind] && !result.rows.length) throw new Error(`제주어 ${kind} 응답이 비어 있습니다. 기존 데이터를 보존합니다.`);
      allRows.push(...result.rows);
      if (result.maxSeq) nextCheckpoint[kind] = Math.max(Number(nextCheckpoint[kind] || 0), result.maxSeq);
      log(`제주어 ${kind} ${result.rows.length}건 신규 확인 (${result.pages}페이지 조회)`);
    }

    const batches = chunk(allRows, WRITE_BATCH_SIZE);
    await mapLimit(batches, 3, async (batch) => {
      try {
        await upsertRows(config, ITEMS_TABLE_ID, batch.map((row) => ({ $id: row.rowId, ...row.data, collectedAt: startedAt.toISOString(), active: true })));
        processed += batch.length;
      } catch (cause) {
        failed += batch.length;
        error(`제주어 ${batch.length}건 일괄 저장 실패: ${cause.message}`);
      }
    });

    const retired = Object.keys(checkpoint).length ? 0 : await deactivateStale(config, new Set(allRows.map((row) => row.rowId)), startedAt, error);
    await upsertSyncRun(config, { status: failed ? 'partial' : 'completed', processed, failed, startedAt, checkpoint: nextCheckpoint, message: `제주어 ${allRows.length}건 신규 확인, ${processed}건 저장, ${retired}건 비활성화` });
    return res.json({ ok: failed === 0, source: SOURCE, fetched: allRows.length, processed, failed, retired, checkpoint: nextCheckpoint });
  } catch (cause) {
    await upsertSyncRun(config, { status: 'failed', processed, failed: failed + 1, startedAt, message: cause.message }).catch(() => {});
    error(cause.stack || cause.message);
    return res.json({ ok: false, error: cause.message, processed, failed: failed + 1 }, 500);
  }
}

async function fetchResource(kind, watermark = 0) {
  const items = [];
  const seen = new Set();
  let totalRows;
  let maxSeq = Number(watermark || 0);
  let stoppedAtWatermark = false;
  let pages = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    pages = page;
    const url = new URL(resources[kind].endpoint, API_ORIGIN);
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(PAGE_SIZE));
    const response = await fetchWithRetry(url.toString(), { headers: { Accept: 'application/xml,text/xml' } });
    if (!response.ok) throw new Error(`제주어 ${kind} HTTP ${response.status}`);
    const document = parser.parse(await response.text());
    const root = parserRoot(document);
    const container = root.items || root.list || {};
    const rawItems = normalizeItems(container.item);
    const rows = rawItems.map((raw, index) => {
      const rawId = clean(raw.seq || raw.obSeq);
      const numericId = Number(rawId);
      if (Number.isFinite(numericId)) {
        maxSeq = Math.max(maxSeq, numericId);
        if (watermark && numericId <= watermark) {
          stoppedAtWatermark = true;
          return null;
        }
      }
      return toRow(kind, raw, items.length + index);
    }).filter(Boolean);
    const queryRows = Number(root.query?.rows);
    if (Number.isFinite(queryRows) && queryRows > 0) totalRows = queryRows;
    for (const row of rows) {
      if (!seen.has(row.rowId)) { seen.add(row.rowId); items.push(row); }
    }
    if (!rawItems.length || stoppedAtWatermark || (totalRows && !watermark && items.length >= totalRows) || (!totalRows && rawItems.length < PAGE_SIZE)) break;
    if (page === MAX_PAGES) throw new Error(`제주어 ${kind} 응답이 ${MAX_PAGES}페이지를 초과했습니다.`);
  }
  return { rows: items, pages, maxSeq };
}

function toRow(kind, raw, index) {
  const id = clean(raw.seq || raw.obSeq) || `${kind}-${index}`;
  const title = clean(raw.name || raw.siteName) || `${kind} ${index + 1}`;
  let body = clean(raw.contents || raw.solution || raw.original);
  let subtitle = clean(raw.siteName);
  let category = clean(raw.index || raw.type || raw.category);
  let fields;
  if (kind === 'life') {
    subtitle = clean(raw.siteName) || clean(raw.solution);
    fields = [['제주방언', raw.contents], ['고어', raw.original], ['표준말', raw.solution], ['분류', raw.type || raw.category]];
  } else if (kind === 'proverb') {
    fields = [['풀이', raw.contents], ['원문', raw.original], ['분류', raw.index], ['English', raw.engContents], ['中文', raw.chiContents], ['日本語', raw.janContents], ['출전', raw.book]];
  } else if (kind === 'dictionary') {
    fields = [['뜻풀이', raw.contents], ['분류', raw.index || raw.category], ['English', raw.engContents], ['中文', raw.chiContents], ['日本語', raw.janContents]];
  } else {
    const related = [raw.index1, raw.index2, raw.index3].map(clean).filter(Boolean).join(', ');
    body = clean(raw.contents);
    subtitle = [clean(raw.book), clean(raw.writer)].filter(Boolean).join(' · ');
    fields = [['설명', raw.contents], ['분류', raw.type], ['관련 서적', [clean(raw.book), clean(raw.writer), raw.page ? `p.${clean(raw.page)}` : ''].filter(Boolean).join(' · ')], ['관련어', related]];
  }
  const normalizedFields = fields.map(([label, value]) => ({ label, value: clean(value) })).filter((field) => field.value);
  const searchText = [title, subtitle, body, category, ...normalizedFields.map((field) => field.value)].filter(Boolean).join(' ').toLocaleLowerCase('ko-KR');
  const sourceUrl = resources[kind].sourceUrl;
  return {
    rowId: `culture-${kind}-${id}`,
    data: { externalId: id, kind, title, subtitle: subtitle || null, body, category: category || null, imageUrl: absoluteUrl(raw.image1Url), audioUrl: absoluteUrl(raw.soundUrl || raw.sound), fieldsJson: JSON.stringify(normalizedFields), searchText, source: SOURCE, sourceName: '제주특별자치도 제주어 OpenAPI', sourceUrl },
  };
}

function clean(value) {
  if (value == null) return '';
  return String(value).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

function absoluteUrl(value) {
  const valueText = clean(value);
  if (!valueText) return null;
  if (/^https?:\/\//i.test(valueText)) return valueText;
  return `${API_ORIGIN}${valueText.startsWith('/') ? '' : '/'}${valueText}`;
}

function normalizeItems(value) { return Array.isArray(value) ? value : value ? [value] : []; }

async function deactivateStale(config, currentIds, retiredAt, error) {
  const rows = await listRows(config, ITEMS_TABLE_ID, []);
  const stale = rows.filter((row) => row.$id && row.source === SOURCE && row.active === true && !currentIds.has(row.$id));
  await mapLimit(stale, WRITE_CONCURRENCY, async (row) => {
    try { await updateRow(config, ITEMS_TABLE_ID, row.$id, { active: false, retiredAt: retiredAt.toISOString() }); } catch (cause) { error(`제주어 비활성화 실패 ${row.$id}: ${cause.message}`); }
  });
  return stale.length;
}

async function listRows(config, tableId, queries) {
  const url = new URL(`${config.endpoint}/tablesdb/${config.databaseId}/tables/${tableId}/rows`);
  url.searchParams.set('limit', '5000'); url.searchParams.set('total', 'false');
  queries.forEach((query) => url.searchParams.append('queries[]', query));
  const response = await fetchWithTimeout(url.toString(), { headers: appwriteHeaders(config) });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return normalizeItems((await response.json()).rows);
}

async function upsertRow(config, tableId, rowId, data, permissions) { return appwriteWrite(config, tableId, rowId, 'PUT', { data: withoutNulls(data), permissions }); }
async function upsertRows(config, tableId, rows) {
  const response = await fetchWithTimeout(`${config.endpoint}/tablesdb/${config.databaseId}/tables/${tableId}/rows`, { method: 'PUT', headers: { ...appwriteHeaders(config), 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}
async function updateRow(config, tableId, rowId, data) { return appwriteWrite(config, tableId, rowId, 'PATCH', { data: withoutNulls(data) }); }
async function appwriteWrite(config, tableId, rowId, method, body) {
  const response = await fetchWithTimeout(`${config.endpoint}/tablesdb/${config.databaseId}/tables/${tableId}/rows/${encodeURIComponent(rowId)}`, { method, headers: { ...appwriteHeaders(config), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}

async function loadCheckpoint(config) {
  const rows = await listRows(config, SYNC_TABLE_ID, []);
  const latest = rows.map((row) => row.data || row).filter((row) => row.source === SOURCE && row.checkpointJson).sort((a, b) => Date.parse(b.finishedAt || b.startedAt || 0) - Date.parse(a.finishedAt || a.startedAt || 0))[0];
  if (!latest) return {};
  try { return JSON.parse(latest.checkpointJson) || {}; } catch { return {}; }
}

async function upsertSyncRun(config, data) { return upsertRow(config, SYNC_TABLE_ID, `sync-culture-${data.startedAt.getTime()}`, { runId: `sync-culture-${data.startedAt.getTime()}`, source: SOURCE, status: data.status, processedCount: data.processed, failedCount: data.failed, startedAt: data.startedAt.toISOString(), finishedAt: new Date().toISOString(), checkpointJson: data.checkpoint ? JSON.stringify(data.checkpoint) : null, message: data.message }, []); }
function appwriteHeaders(config) { return { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey, Accept: 'application/json' }; }
function withoutNulls(data) { return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== null && value !== undefined)); }
function appwriteConfig(req) { return { endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || DEFAULT_ENDPOINT, projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || 'jeju', databaseId: process.env.APPWRITE_DATABASE_ID || DATABASE_ID, apiKey: req.headers?.['x-appwrite-key'] || req.headers?.['X-Appwrite-Key'] || process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY }; }
function isSmokeRequest(req) { try { return req.body && JSON.parse(typeof req.body === 'string' ? req.body : JSON.stringify(req.body)).smoke === true; } catch { return false; } }
async function fetchWithTimeout(url, options = {}) { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS); try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timeout); } }
async function fetchWithRetry(url, options) { let lastError; for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) { try { const response = await fetchWithTimeout(url, options); if (response.status < 500 || attempt === FETCH_RETRIES) return response; lastError = new Error(`retryable HTTP ${response.status}`); } catch (cause) { lastError = cause; if (attempt === FETCH_RETRIES) throw cause; } await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_DELAY_MS * (2 ** (attempt - 1)))); } throw lastError || new Error('Request failed'); }
async function mapLimit(items, limit, mapper) { const results = []; let cursor = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (cursor < items.length) { const index = cursor++; results[index] = await mapper(items[index], index); } })); return results; }
function chunk(items, size) { const batches = []; for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size)); return batches; }
