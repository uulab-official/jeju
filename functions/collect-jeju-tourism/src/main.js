const TOUR_API_BASE = 'https://apis.data.go.kr/B551011/KorService2';
const DEFAULT_ENDPOINT = 'https://appwrite.uulab.co.kr/v1';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'jeju';
const PLACES_TABLE_ID = process.env.APPWRITE_PLACES_TABLE_ID || 'places';
const SYNC_TABLE_ID = process.env.APPWRITE_SYNC_TABLE_ID || 'sync_runs';
const SOURCE = 'tourapi-kor-service2';
const FETCH_TIMEOUT_MS = 12_000;
const FETCH_RETRIES = Math.max(1, Number(process.env.TOUR_API_RETRIES || 3));
const RETRY_BASE_DELAY_MS = Math.max(100, Number(process.env.TOUR_API_RETRY_DELAY_MS || 500));
const PAGE_SIZE = 100;
const MAX_ITEMS = Math.max(1, Number(process.env.TOUR_API_MAX_ITEMS || 300));
const MAX_SYNC_ITEMS = Math.max(1, Math.min(900, Number(process.env.TOUR_API_MAX_SYNC_ITEMS || 900)));
const MIN_ITEMS = Math.max(1, Number(process.env.TOUR_API_MIN_ITEMS || 1));
const DETAIL_CONCURRENCY = 6;
const WRITE_CONCURRENCY = 10;
const STALE_SCAN_PAGE_SIZE = 100;
const MAX_STALE_SCAN = 5000;
const DEACTIVATE_STALE = process.env.TOUR_API_DEACTIVATE_STALE !== 'false';

export default async function collectJejuTourism({ req, res, log, error }) {
  const startedAt = new Date();
  const config = appwriteConfig(req);
  const serviceKey = process.env.TOUR_API_SERVICE_KEY || process.env.DATA_GO_KR_SERVICE_KEY;
  const request = requestBody(req);

  if (request.smoke) {
    return res.json({ ok: true, smoke: true, source: SOURCE, databaseId: config.databaseId });
  }

  if (!config.apiKey) return res.json({ ok: false, error: 'Appwrite function API key is missing.' }, 500);
  if (!serviceKey) return res.json({ ok: false, error: 'TOUR_API_SERVICE_KEY is missing.' }, 500);

  let processed = 0;
  let failed = 0;
  let deactivated = 0;
  let skipped = 0;

  try {
    const checkpoint = request.full ? null : await resolveCheckpoint(config, startedAt);
    const mode = checkpoint ? 'incremental' : 'full';
    const fetchedItems = mode === 'full'
      ? await fetchJejuItems(serviceKey, log)
      : await fetchJejuChanges(serviceKey, checkpoint.modifiedDate, log);
    if (mode === 'full' && fetchedItems.length < MIN_ITEMS) {
      throw new Error(`TourAPI returned too few places (${fetchedItems.length}; minimum ${MIN_ITEMS}). Existing Appwrite data was preserved.`);
    }
    log(`TourAPI 제주 ${mode === 'full' ? '기본정보' : '변경정보'} ${fetchedItems.length}건 수집`);

    const visibleItems = [];
    for (const item of fetchedItems) {
      if (String(item.showflag ?? '1') === '0') {
        deactivated += await deactivateChangedPlace(config, item, startedAt);
        continue;
      }
      deactivated += await deactivatePreviousContentId(config, item, startedAt);
      if (mode === 'incremental' && await isCurrentPlaceUnchanged(config, item)) {
        skipped += 1;
        continue;
      }
      visibleItems.push(item);
    }

    const enriched = await mapLimit(visibleItems, DETAIL_CONCURRENCY, async (item) => {
      try {
        const [common, intro, imageItems] = await Promise.all([
          fetchDetailCommon(serviceKey, item.contentid),
          fetchDetailIntro(serviceKey, item.contentid, item.contenttypeid),
          fetchDetailImages(serviceKey, item.contentid),
        ]);
        return toPlaceRow(item, common, intro, imageItems, startedAt);
      } catch (cause) {
        error(`상세정보 일부 누락 ${item.contentid}: ${cause.message}`);
        return toPlaceRow(item, {}, {}, [], startedAt);
      }
    });
    const validPlaces = enriched.filter(Boolean);
    if (visibleItems.length && validPlaces.length < MIN_ITEMS) {
      throw new Error(`TourAPI returned no valid places (${validPlaces.length}; minimum ${MIN_ITEMS}). Existing Appwrite data was preserved.`);
    }

    await mapLimit(validPlaces, WRITE_CONCURRENCY, async (place) => {
      try {
        await upsertRow(config, PLACES_TABLE_ID, place.rowId, place.data, ['read("any")']);
        processed += 1;
      } catch (cause) {
        failed += 1;
        error(`Appwrite 저장 실패 ${place.rowId}: ${cause.message}`);
      }
    });

    if (mode === 'full' && DEACTIVATE_STALE) {
      try {
        deactivated += await deactivateStalePlaces(config, new Set(validPlaces.map((place) => place.rowId)), startedAt, log);
      } catch (cause) {
        failed += 1;
        error(`오래된 장소 비활성화 실패: ${cause.message}`);
      }
    }

    const nextCheckpoint = {
      modifiedDate: koreaDate(startedAt),
      collectedAt: startedAt.toISOString(),
      mode,
    };
    const persistedCheckpoint = failed ? checkpoint : nextCheckpoint;
    await upsertSyncRun(config, {
      status: failed ? 'partial' : 'completed', processed, failed, startedAt,
      message: `TourAPI ${mode} ${fetchedItems.length}건 조회, ${processed}건 저장, ${deactivated}건 비활성화, ${skipped}건 변경 없음`,
      checkpoint: persistedCheckpoint,
    });
    return res.json({
      ok: failed === 0, source: SOURCE, mode, fetched: fetchedItems.length,
      processed, deactivated, skipped, failed, checkpoint: persistedCheckpoint?.modifiedDate || null,
    });
  } catch (cause) {
    await upsertSyncRun(config, {
      status: cause.code === 'TOUR_API_AUTH' ? 'auth_error' : 'failed',
      processed, failed: failed + 1, startedAt, message: cause.message,
    }).catch(() => {});
    error(cause.stack || cause.message);
    return res.json({ ok: false, error: cause.message, processed, failed: failed + 1 }, 500);
  }
}

async function fetchJejuItems(serviceKey, log) {
  const items = [];
  for (let pageNo = 1; items.length < MAX_ITEMS; pageNo += 1) {
    const payload = await tourApi(serviceKey, 'areaBasedList2', {
      // KorService2 replaced the legacy areaCode filter with legal-dong codes.
      // 50 is Jeju Special Self-Governing Province.
      lDongRegnCd: 50,
      pageNo,
      numOfRows: Math.min(PAGE_SIZE, MAX_ITEMS - items.length),
      arrange: 'Q',
    });
    const body = payload?.response?.body || {};
    const page = normalizeItems(body?.items?.item);
    items.push(...page);
    log(`TourAPI page ${pageNo}: ${page.length}건`);
    if (!page.length || items.length >= Number(body.totalCount || 0)) break;
  }
  return items.slice(0, MAX_ITEMS);
}

async function fetchJejuChanges(serviceKey, modifiedDate, log) {
  const items = [];
  for (let pageNo = 1; items.length < MAX_SYNC_ITEMS; pageNo += 1) {
    const payload = await tourApi(serviceKey, 'areaBasedSyncList2', {
      lDongRegnCd: 50,
      modifiedtime: modifiedDate,
      pageNo,
      numOfRows: Math.min(PAGE_SIZE, MAX_SYNC_ITEMS - items.length),
      arrange: 'C',
    });
    const body = payload?.response?.body || {};
    const page = normalizeItems(body?.items?.item);
    items.push(...page);
    log(`TourAPI sync page ${pageNo}: ${page.length}건`);
    const total = Number(body.totalCount || 0);
    if (!page.length || items.length >= total) break;
    if (items.length >= MAX_SYNC_ITEMS) {
      throw new Error(`TourAPI sync changes exceeded the safe daily limit (${MAX_SYNC_ITEMS}/${total}). Checkpoint was preserved.`);
    }
  }
  return [...new Map(items.map((item) => [String(item.contentid || item.oldContentid), item])).values()];
}

async function fetchDetailCommon(serviceKey, contentId) {
  const payload = await tourApi(serviceKey, 'detailCommon2', {
    contentId,
  });
  return normalizeItems(payload?.response?.body?.items?.item)[0] || {};
}

async function fetchDetailIntro(serviceKey, contentId, contentTypeId) {
  if (!contentTypeId) return {};
  const payload = await tourApi(serviceKey, 'detailIntro2', { contentId, contentTypeId, numOfRows: 10, pageNo: 1 });
  return normalizeItems(payload?.response?.body?.items?.item)[0] || {};
}

async function fetchDetailImages(serviceKey, contentId) {
  const payload = await tourApi(serviceKey, 'detailImage2', {
    contentId, imageYN: 'Y', subImageYN: 'Y', numOfRows: 30, pageNo: 1,
  });
  return normalizeItems(payload?.response?.body?.items?.item);
}

async function tourApi(serviceKey, operation, params) {
  const query = Object.entries({ MobileOS: 'ETC', MobileApp: 'SorangJeju', _type: 'json', ...params })
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const keyPart = serviceKey.includes('%') ? serviceKey : encodeURIComponent(serviceKey);
  const response = await fetchWithTimeout(`${TOUR_API_BASE}/${operation}?serviceKey=${keyPart}&${query}`);
  const text = await response.text();
  if (!response.ok) {
    const cause = new Error(`TourAPI ${operation} HTTP ${response.status}: ${text.slice(0, 160)}`);
    if ([401, 403].includes(response.status)) cause.code = 'TOUR_API_AUTH';
    throw cause;
  }
  if (!text.trim().startsWith('{')) throw new Error(`TourAPI ${operation} returned a non-JSON response`);
  const payload = JSON.parse(text);
  const header = payload?.response?.header || {};
  if (!['0000', '00', '0'].includes(String(header.resultCode || '0000'))) {
    throw new Error(header.resultMsg || `TourAPI ${operation} result ${header.resultCode}`);
  }
  return payload;
}

export function toPlaceRow(base, common, intro, imageItems, collectedAt) {
  const merged = { ...base, ...common };
  const contentId = clean(merged.contentid);
  const name = clean(merged.title);
  const latitude = Number(merged.mapy);
  const longitude = Number(merged.mapx);
  if (!contentId || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const category = categoryFor(merged);
  const address = clean([merged.addr1, merged.addr2].filter(Boolean).join(' '));
  const region = address.includes('서귀포시') ? '서귀포시' : '제주시';
  const area = areaFromAddress(address, region);
  const images = imageList(merged, imageItems);
  const overview = clean(merged.overview);
  const sourceUrl = 'https://korean.visitkorea.or.kr/';
  const colors = accentFor(category);
  const modifiedAt = tourDate(merged.modifiedtime);
  const openingHours = firstText(intro, ['usetime', 'usetimeculture', 'usetimefestival', 'opentimefood', 'checkintime']);
  const restDate = firstText(intro, ['restdate', 'restdateculture', 'restdatefood']);
  const parking = firstText(intro, ['parking', 'parkingculture', 'parkingfood', 'parkinglodging']);

  return {
    rowId: `tour-${contentId}`,
    data: {
      externalId: contentId,
      source: SOURCE,
      contentTypeId: Number(merged.contenttypeid) || null,
      name,
      category,
      categoryLabel: categoryLabel(category),
      region,
      area,
      address,
      summary: overview.slice(0, 8000) || `${region}에 있는 ${name}의 공식 관광정보입니다.`,
      highlight: buildHighlight(openingHours, restDate),
      latitude,
      longitude,
      tags: tagsFor(merged, category, region, area),
      phone: clean(merged.tel || intro.infocenter || intro.infocenterfood || intro.infocenterculture),
      homepage: normalizeUrl(merged.homepage),
      openingHours,
      restDate,
      parking,
      heroImageUrl: images[0]?.url || normalizeUrl(merged.firstimage),
      imagesJson: JSON.stringify(images),
      sourceName: '한국관광공사 TourAPI',
      sourceUrl,
      sourceLicense: 'TourAPI에서 개방한 관광정보·사진. 이미지별 저작권 유형은 원본 메타데이터를 따릅니다.',
      accentStart: colors[0],
      accentEnd: colors[1],
      modifiedAt,
      collectedAt: collectedAt.toISOString(),
      active: true,
    },
  };
}

function imageList(base, imageItems) {
  const candidates = [
    normalizeUrl(base.firstimage) ? { url: normalizeUrl(base.firstimage), thumbnailUrl: normalizeUrl(base.firstimage2), description: clean(base.title), copyrightType: '' } : null,
    ...imageItems.map((item) => ({
      url: normalizeUrl(item.originimgurl),
      thumbnailUrl: normalizeUrl(item.smallimageurl),
      description: clean(item.imgname),
      copyrightType: clean(item.cpyrhtDivCd),
    })),
  ].filter((item) => item?.url);
  return [...new Map(candidates.map((item) => [item.url, item])).values()].slice(0, 12);
}

function categoryFor(item) {
  const type = Number(item.contenttypeid);
  const text = `${clean(item.title)} ${clean(item.cat1)} ${clean(item.cat2)} ${clean(item.cat3)}`;
  if (/해수욕장|해변|바다|해안/.test(text)) return 'beach';
  if (/우도|마라도|가파도|비양도|섬/.test(text)) return 'island';
  if (type === 39) return 'food';
  if (type === 32) return 'stay';
  if (type === 15) return 'festival';
  if (type === 14) return 'culture';
  if (type === 28) return 'activity';
  if (type === 25 || /올레|산책|트레킹|등산/.test(text)) return 'walk';
  if (type === 38 || /시장/.test(text)) return 'market';
  return 'nature';
}

function categoryLabel(category) {
  return ({ nature: '자연', beach: '바다', culture: '문화', market: '시장', island: '섬', walk: '걷기', food: '맛집', stay: '숙소', festival: '축제', activity: '체험' })[category];
}

function accentFor(category) {
  return ({
    nature: ['#75A879', '#356B52'], beach: ['#76C9E8', '#3D8BC4'], culture: ['#B49AD8', '#76599F'],
    market: ['#F2B35D', '#C86A36'], island: ['#64B9C8', '#2E7895'], walk: ['#8EBB72', '#477A47'],
    food: ['#F29A68', '#C9533E'], stay: ['#8FA7D8', '#596DAB'], festival: ['#ED82A6', '#B74477'], activity: ['#E5A453', '#A8652E'],
  })[category];
}

function tagsFor(item, category, region, area) {
  return [...new Set([categoryLabel(category), region, area, clean(item.cat2), clean(item.cat3)].filter(Boolean))].slice(0, 8);
}

function buildHighlight(openingHours, restDate) {
  if (openingHours && restDate) return `이용시간은 ${openingHours}, 쉬는 날은 ${restDate}로 안내돼 있어요. 방문 전 공식 정보를 다시 확인해 주세요.`;
  if (openingHours) return `이용시간은 ${openingHours}로 안내돼 있어요. 방문 전 공식 정보를 다시 확인해 주세요.`;
  return '운영시간과 현장 상황은 방문 전 공식 정보를 확인해 주세요.';
}

function firstText(object, keys) {
  return keys.map((key) => clean(object?.[key])).find(Boolean) || '';
}

function areaFromAddress(address, region) {
  const rest = address.split(region)[1]?.trim() || '';
  return rest.split(/\s+/).find((part) => /(?:읍|면|동)$/.test(part)) || region;
}

function tourDate(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  const iso = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${digits.slice(8, 10) || '00'}:${digits.slice(10, 12) || '00'}:${digits.slice(12, 14) || '00'}+09:00`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

function normalizeUrl(value) {
  const cleaned = clean(value).replace(/^['"]|['"]$/g, '');
  const href = cleaned.match(/href=['"]([^'"]+)/i)?.[1] || cleaned;
  if (!/^https?:\/\//i.test(href)) return '';
  try {
    const parsed = new URL(href.replace(/^http:\/\//i, 'https://'));
    return parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function clean(value) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeItems(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function appwriteConfig(req) {
  return {
    endpoint: process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT || DEFAULT_ENDPOINT,
    projectId: process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || 'jeju',
    databaseId: process.env.APPWRITE_DATABASE_ID || DATABASE_ID,
    apiKey: req.headers?.['x-appwrite-key'] || req.headers?.['X-Appwrite-Key'] || process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY,
  };
}

async function upsertRow(config, tableId, rowId, data, permissions) {
  const response = await appwriteRequest(config, `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${rowId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey },
    body: JSON.stringify({ data: withoutNulls(data), permissions }),
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}

async function updateRow(config, tableId, rowId, data) {
  const response = await appwriteRequest(config, `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${encodeURIComponent(rowId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey },
    body: JSON.stringify({ data: withoutNulls(data) }),
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}

async function getRow(config, tableId, rowId) {
  const response = await appwriteRequest(config, `/tablesdb/${config.databaseId}/tables/${tableId}/rows/${encodeURIComponent(rowId)}`, {
    headers: { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}

async function listRows(config, tableId, queries, offset, limit = STALE_SCAN_PAGE_SIZE) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset), total: 'false' });
  queries.forEach((query) => params.append('queries[]', query));
  const response = await appwriteRequest(config, `/tablesdb/${config.databaseId}/tables/${tableId}/rows?${params.toString()}`, {
    headers: { 'X-Appwrite-Project': config.projectId, 'X-Appwrite-Key': config.apiKey },
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 300) || `Appwrite ${response.status}`);
  return response.json();
}

async function resolveCheckpoint(config, startedAt) {
  const payload = await listRows(config, SYNC_TABLE_ID, [
    JSON.stringify({ method: 'equal', attribute: 'source', values: [SOURCE] }),
    JSON.stringify({ method: 'orderDesc', attribute: 'finishedAt', values: [] }),
  ], 0, 100);
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  for (const raw of rows) {
    const row = raw.data || raw;
    if (!['completed', 'partial'].includes(String(row.status))) continue;
    try {
      const checkpoint = JSON.parse(String(row.checkpointJson || ''));
      if (/^\d{8}$/.test(checkpoint.modifiedDate)) return checkpoint;
    } catch {
      // Older runs did not persist a tourism checkpoint.
    }
  }

  const places = await listRows(config, PLACES_TABLE_ID, [
    JSON.stringify({ method: 'equal', attribute: 'source', values: [SOURCE] }),
  ], 0, 1);
  if (Array.isArray(places.rows) && places.rows.length) {
    return {
      modifiedDate: koreaDate(new Date(startedAt.getTime() - 24 * 60 * 60 * 1000)),
      collectedAt: startedAt.toISOString(),
      mode: 'bootstrap',
    };
  }
  return null;
}

async function isCurrentPlaceUnchanged(config, item) {
  const contentId = clean(item.contentid);
  if (!contentId) return false;
  const row = await getRow(config, PLACES_TABLE_ID, `tour-${contentId}`);
  if (!row) return false;
  const data = row.data || row;
  const incomingModifiedAt = tourDate(item.modifiedtime);
  if (!incomingModifiedAt || !data.modifiedAt) return false;
  return data.active !== false && Date.parse(data.modifiedAt) === Date.parse(incomingModifiedAt);
}

async function deactivateChangedPlace(config, item, retiredAt) {
  const ids = [...new Set([clean(item.contentid), clean(item.oldContentid)].filter(Boolean))];
  let changed = 0;
  for (const contentId of ids) {
    const rowId = `tour-${contentId}`;
    const row = await getRow(config, PLACES_TABLE_ID, rowId);
    if (!row) continue;
    const data = row.data || row;
    if (data.active === false) continue;
    await updateRow(config, PLACES_TABLE_ID, rowId, { active: false, retiredAt: retiredAt.toISOString() });
    changed += 1;
  }
  return changed;
}

async function deactivatePreviousContentId(config, item, retiredAt) {
  const oldContentId = clean(item.oldContentid);
  const contentId = clean(item.contentid);
  if (!oldContentId || oldContentId === contentId) return 0;
  return deactivateChangedPlace(config, { contentid: oldContentId }, retiredAt);
}

async function deactivateStalePlaces(config, currentRowIds, retiredAt, log) {
  const stale = [];
  for (let offset = 0; offset < MAX_STALE_SCAN; offset += STALE_SCAN_PAGE_SIZE) {
    const payload = await listRows(config, PLACES_TABLE_ID, [
      JSON.stringify({ method: 'equal', attribute: 'source', values: [SOURCE] }),
      JSON.stringify({ method: 'equal', attribute: 'active', values: [true] }),
    ], offset);
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    stale.push(...rows.filter((row) => row.$id && !currentRowIds.has(row.$id)));
    if (rows.length < STALE_SCAN_PAGE_SIZE) break;
    if (offset + STALE_SCAN_PAGE_SIZE >= MAX_STALE_SCAN) throw new Error(`stale scan exceeded ${MAX_STALE_SCAN} rows`);
  }
  await mapLimit(stale, WRITE_CONCURRENCY, async (row) => {
    await updateRow(config, PLACES_TABLE_ID, row.$id, { active: false, retiredAt: retiredAt.toISOString() });
  });
  if (stale.length) log(`오래된 장소 ${stale.length}건 비활성화`);
  return stale.length;
}

async function upsertSyncRun(config, { status, processed, failed, startedAt, message, checkpoint }) {
  const runId = `sync-${startedAt.getTime()}`;
  return upsertRow(config, SYNC_TABLE_ID, runId, {
    runId, source: SOURCE, status, processedCount: processed, failedCount: failed,
    startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), message: String(message || '').slice(0, 8000),
    checkpointJson: checkpoint ? JSON.stringify(checkpoint) : '',
  });
}

async function appwriteRequest(config, path, options) {
  const endpoints = [...new Set([config.endpoint, DEFAULT_ENDPOINT].map((value) => String(value || '').replace(/\/$/, '')).filter(Boolean))];
  let lastError;
  for (let index = 0; index < endpoints.length; index += 1) {
    try {
      const response = await fetchWithTimeout(`${endpoints[index]}${path}`, options);
      if (shouldRetryStatus(response.status) && index + 1 < endpoints.length) {
        lastError = new Error(`Appwrite endpoint returned retryable HTTP ${response.status}`);
        continue;
      }
      return response;
    } catch (cause) {
      lastError = cause;
      if (index + 1 >= endpoints.length) throw cause;
    }
  }
  throw lastError || new Error('Appwrite request failed without an error');
}

async function fetchWithTimeout(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      if (!shouldRetryStatus(response.status) || attempt === FETCH_RETRIES) return response;
      lastError = new Error(`Retryable HTTP ${response.status}`);
    } catch (cause) {
      lastError = cause;
      if (attempt === FETCH_RETRIES) throw cause;
    } finally {
      clearTimeout(timeout);
    }
    await delay(RETRY_BASE_DELAY_MS * (2 ** (attempt - 1)));
  }
  throw lastError || new Error('Request failed without an error');
}

function shouldRetryStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

function withoutNulls(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== ''));
}

function koreaDate(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}${value.month}${value.day}`;
}

function requestBody(req) {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return {};
  }
}
