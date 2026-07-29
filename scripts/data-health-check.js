const fs = require('node:fs');

loadDotEnv('.env');
loadDotEnv('.env.local');

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://appwrite.uulab.co.kr/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const databaseId = process.env.APPWRITE_DATABASE_ID || 'jeju';
const apiKey = process.env.APPWRITE_API_KEY;
const tourismFunctionId = process.env.APPWRITE_COLLECT_FUNCTION_ID || 'collect-jeju-tourism';
const cultureFunctionId = process.env.APPWRITE_CULTURE_FUNCTION_ID || 'collect-jeju-culture';
const maxAgeHours = Number(process.env.DATA_HEALTH_MAX_AGE_HOURS || 26);

if (!projectId || !apiKey) fail('APPWRITE_PROJECT_ID와 APPWRITE_API_KEY가 필요합니다.');

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  Accept: 'application/json',
};
const publicHeaders = {
  'X-Appwrite-Project': projectId,
  Accept: 'application/json',
};

async function main() {
  const problems = [];

  const [tourismFunction, cultureFunction, tourismExecutions, cultureExecutions] = await Promise.all([
    get(`/functions/${encodeURIComponent(tourismFunctionId)}`),
    get(`/functions/${encodeURIComponent(cultureFunctionId)}`),
    listExecutions(tourismFunctionId),
    listExecutions(cultureFunctionId),
  ]);
  checkFunction(tourismFunction, tourismFunctionId, problems, 'TOUR_API_SERVICE_KEY');
  checkFunction(cultureFunction, cultureFunctionId, problems);
  checkExecutionHistory(tourismExecutions, tourismFunction, tourismFunctionId, problems);
  checkExecutionHistory(cultureExecutions, cultureFunction, cultureFunctionId, problems);

  const syncRunQueries = new URLSearchParams({ limit: '100' });
  syncRunQueries.append('queries[]', JSON.stringify({ method: 'orderDesc', attribute: 'finishedAt', values: [] }));
  const syncRuns = await get(`/tablesdb/${encodeURIComponent(databaseId)}/tables/sync_runs/rows?${syncRunQueries.toString()}`);
  const [places, cultureItems] = await Promise.all([
    get(`/tablesdb/${encodeURIComponent(databaseId)}/tables/places/rows?limit=1`),
    get(`/tablesdb/${encodeURIComponent(databaseId)}/tables/culture_items/rows?limit=1`),
  ]);
  const publicListQueries = new URLSearchParams({ total: 'false' });
  publicListQueries.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'active', values: [true] }));
  publicListQueries.append('queries[]', JSON.stringify({ method: 'limit', values: [1] }));
  const [publicPlaces, publicCultureItems] = await Promise.all([
    getPublic(`/tablesdb/${encodeURIComponent(databaseId)}/tables/places/rows?${publicListQueries.toString()}`),
    getPublic(`/tablesdb/${encodeURIComponent(databaseId)}/tables/culture_items/rows?${publicListQueries.toString()}`),
  ]);
  const rows = Array.isArray(syncRuns.rows) ? syncRuns.rows : [];
  const latestTourism = rows
    .map((row) => row.data || row)
    .filter((row) => row.source === 'tourapi-kor-service2')
    .sort((a, b) => Date.parse(b.finishedAt || b.startedAt || 0) - Date.parse(a.finishedAt || a.startedAt || 0))[0];
  const latestCulture = rows
    .map((row) => row.data || row)
    .filter((row) => row.source === 'jeju-openapi')
    .sort((a, b) => Date.parse(b.finishedAt || b.startedAt || 0) - Date.parse(a.finishedAt || a.startedAt || 0))[0];

  checkSync(latestTourism, problems, {
    label: 'TourAPI 장소',
    missing: 'TourAPI 장소 수집 결과가 없습니다.',
    auth: '최근 TourAPI 수집이 인증 거부되었습니다. 개발계정 키의 승인·활성화 상태를 확인하세요.',
    empty: '최근 TourAPI 수집이 성공 상태지만 저장된 장소가 0건입니다.',
    allowEmpty: true,
  });
  checkSync(latestCulture, problems, {
    label: '제주어 문화',
    missing: '제주어 문화 수집 결과가 없습니다.',
    empty: '최근 제주어 문화 수집이 성공 상태지만 저장된 항목이 0건입니다.',
    allowEmpty: true,
  });
  if (Number(places.total || 0) < 1) problems.push('places 테이블에 수집된 TourAPI 관광정보가 없습니다.');
  if (Number(cultureItems.total || 0) < 1) problems.push('culture_items 테이블에 수집된 제주어 데이터가 없습니다.');
  if (!Array.isArray(publicPlaces.rows) || !publicPlaces.rows.length) problems.push('앱 권한으로 places 공개 데이터를 조회할 수 없습니다.');
  if (!Array.isArray(publicCultureItems.rows) || !publicCultureItems.rows.length) problems.push('앱 권한으로 culture_items 공개 데이터를 조회할 수 없습니다.');

  const cultureSample = publicCultureItems.rows?.[0]?.data || publicCultureItems.rows?.[0];
  if (cultureSample?.externalId && cultureSample?.kind) {
    const detailQueries = new URLSearchParams({ total: 'false' });
    detailQueries.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'active', values: [true] }));
    detailQueries.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'kind', values: [cultureSample.kind] }));
    detailQueries.append('queries[]', JSON.stringify({ method: 'equal', attribute: 'externalId', values: [cultureSample.externalId] }));
    detailQueries.append('queries[]', JSON.stringify({ method: 'limit', values: [1] }));
    const detail = await getPublic(`/tablesdb/${encodeURIComponent(databaseId)}/tables/culture_items/rows?${detailQueries.toString()}`);
    const detailRow = detail.rows?.[0]?.data || detail.rows?.[0];
    if (detailRow?.externalId !== cultureSample.externalId) {
      problems.push('제주어 검색 결과의 상세 직접 조회가 일치하지 않습니다.');
    }
  } else {
    problems.push('제주어 공개 데이터에 상세 조회용 externalId 또는 kind가 없습니다.');
  }

  if (problems.length) {
    console.error('데이터 헬스체크 실패:');
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(`데이터 헬스체크 통과: ${tourismFunctionId}, ${cultureFunctionId}, places ${places.total || 0}건, culture_items ${cultureItems.total || 0}건`);
}

function checkFunction(functionInfo, functionId, problems, requiredSecret) {
  if (!functionInfo.enabled || !functionInfo.live) problems.push(`${functionId} Function이 비활성 또는 live 상태가 아닙니다.`);
  if (!functionInfo.schedule) problems.push(`${functionId} Function에 예약 스케줄이 없습니다.`);
  if (requiredSecret && (!Array.isArray(functionInfo.vars) || !functionInfo.vars.some((variable) => variable.key === requiredSecret))) {
    problems.push(`${functionId} Function Secret ${requiredSecret}가 없습니다.`);
  }
  if (functionInfo.latestDeploymentStatus && functionInfo.latestDeploymentStatus !== 'ready') {
    problems.push(`${functionId} 최신 배포 상태가 ready가 아닙니다 (${functionInfo.latestDeploymentStatus}).`);
  }
}

function checkExecutionHistory(payload, functionInfo, functionId, problems) {
  const executions = Array.isArray(payload.executions) ? payload.executions : [];
  if (!executions.length) {
    problems.push(`${functionId} Function 실행 기록이 없습니다.`);
    return;
  }

  const latest = executions[0];
  const latestCreatedAt = Date.parse(latest.$createdAt || latest.createdAt || '');
  if (latest.status === 'failed') {
    problems.push(`${functionId} 최신 실행이 실패했습니다 (${latest.$id || 'unknown'}).`);
  } else if (['waiting', 'processing'].includes(String(latest.status))
    && Number.isFinite(latestCreatedAt) && Date.now() - latestCreatedAt > 15 * 60 * 1000) {
    problems.push(`${functionId} 최신 실행이 15분 이상 ${latest.status} 상태입니다.`);
  }

  const latestScheduled = executions.find((execution) => execution.trigger === 'schedule');
  if (!latestScheduled) {
    problems.push(`${functionId} 예약 실행 기록이 없습니다.`);
    return;
  }
  if (latestScheduled.status !== 'failed') return;

  const scheduledAt = Date.parse(latestScheduled.$createdAt || latestScheduled.createdAt || '');
  const recovered = executions.some((execution) => (
    execution.status === 'completed'
    && execution.deploymentId === functionInfo.deploymentId
    && Date.parse(execution.$createdAt || execution.createdAt || '') > scheduledAt
  ));
  if (!recovered && latest.status !== 'failed') {
    problems.push(`${functionId} 최근 예약 실행 실패 후 현재 배포의 성공 실행이 없습니다 (${latestScheduled.$id || 'unknown'}).`);
  }
}

function checkSync(latest, problems, options) {
  if (!latest) {
    problems.push(options.missing);
    return;
  }
  const successfulStatus = ['completed', 'partial'].includes(String(latest.status));
  if (latest.status === 'auth_error' && options.auth) problems.push(options.auth);
  else if (!successfulStatus) problems.push(`${options.label} 최근 수집 상태가 ${latest.status || 'unknown'}입니다.`);
  if (successfulStatus && !options.allowEmpty && Number(latest.processedCount || 0) < 1) problems.push(options.empty);
  if (successfulStatus && Number(latest.failedCount || 0) > 0) {
    problems.push(`${options.label} 수집에서 ${latest.failedCount}건 처리하지 못했습니다.`);
  }
  const finishedAt = Date.parse(latest.finishedAt || latest.startedAt || '');
  if (!Number.isFinite(finishedAt)) problems.push(`${options.label} 수집 완료 시각이 없습니다.`);
  else if (Date.now() - finishedAt > maxAgeHours * 60 * 60 * 1000) problems.push(`${options.label} 최근 수집이 ${maxAgeHours}시간보다 오래되었습니다.`);
}

async function get(path) {
  return request(path, headers);
}

async function getPublic(path) {
  return request(path, publicHeaders);
}

async function request(path, requestHeaders) {
  const response = await fetch(`${endpoint}${path}`, { headers: requestHeaders });
  const body = await response.text();
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`Appwrite 응답이 JSON이 아닙니다 (${response.status}, ${path}).`);
  }
  if (!response.ok) throw new Error(`Appwrite 요청 실패 (${response.status}, ${path}): ${payload.message || 'unknown error'}`);
  return payload;
}

function listExecutions(functionId) {
  const params = new URLSearchParams({ total: 'false' });
  params.append('queries[]', JSON.stringify({ method: 'orderDesc', attribute: '$createdAt', values: [] }));
  params.append('queries[]', JSON.stringify({ method: 'limit', values: [20] }));
  return get(`/functions/${encodeURIComponent(functionId)}/executions?${params.toString()}`);
}

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

function fail(message) {
  console.error(`데이터 헬스체크 실패: ${message}`);
  process.exit(1);
}

main().catch((error) => fail(error.message));
