import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JEJU_API_RETRIES = '1';

const { default: collect } = await import('../src/main.js');

test('내부 Appwrite 장애 시 공개 Endpoint로 전환하고 신규 항목이 없으면 즉시 종료한다', async () => {
  const requests = [];
  const writes = [];
  const originalFetch = globalThis.fetch;
  const originalFunctionEndpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  process.env.APPWRITE_FUNCTION_API_ENDPOINT = 'http://internal-appwrite/v1';

  globalThis.fetch = async (input, options = {}) => {
    const requestUrl = String(input);
    requests.push(requestUrl);

    if (requestUrl.startsWith('http://internal-appwrite/v1/')) {
      throw new TypeError('simulated internal Appwrite network failure');
    }
    if (requestUrl.includes('/tables/sync_runs/rows?')) {
      return json({ rows: [{
        source: 'jeju-openapi',
        status: 'completed',
        finishedAt: '2026-07-23T03:00:00.000Z',
        checkpointJson: JSON.stringify({
          life: 1000,
          proverb: 1000,
          dictionary: 1000,
          keyword: 1000,
        }),
      }] });
    }
    if (requestUrl.startsWith('https://www.jeju.go.kr/rest/')) {
      return xml('<jejunetApi><items><item><seq>1000</seq><name>기존 항목</name><contents>기존 내용</contents></item></items><query><rows>1</rows></query></jejunetApi>');
    }
    if (requestUrl.includes('/tables/sync_runs/rows/') && options.method === 'PUT') {
      writes.push(JSON.parse(String(options.body || '{}')));
      return json({ $id: requestUrl.split('/').at(-1) });
    }
    throw new Error(`Unexpected request: ${requestUrl}`);
  };

  try {
    const result = await collect({
      req: { headers: { 'x-appwrite-key': 'dynamic-key' }, body: '{}' },
      res: { json: (payload, status = 200) => ({ payload, status }) },
      log: () => {},
      error: () => {},
    });

    assert.equal(result.status, 200, JSON.stringify(result));
    assert.equal(result.payload.fetched, 0);
    assert.equal(result.payload.processed, 0);
    assert.deepEqual(result.payload.checkpoint, {
      life: 1000,
      proverb: 1000,
      dictionary: 1000,
      keyword: 1000,
    });
    assert.equal(requests.filter((url) => url.startsWith('https://www.jeju.go.kr/rest/')).length, 4);
    assert.ok(requests.some((url) => url.startsWith('http://internal-appwrite/v1/')));
    assert.ok(requests.some((url) => url.startsWith('https://appwrite.uulab.co.kr/v1/')));
    assert.equal(writes.length, 1);
    assert.equal(writes[0].data.status, 'completed');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalFunctionEndpoint === undefined) delete process.env.APPWRITE_FUNCTION_API_ENDPOINT;
    else process.env.APPWRITE_FUNCTION_API_ENDPOINT = originalFunctionEndpoint;
  }
});

test('일부 저장 실패 시 이전 체크포인트를 유지해 다음 실행에서 다시 처리한다', async () => {
  const writes = [];
  const originalFetch = globalThis.fetch;
  const originalFunctionEndpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
  delete process.env.APPWRITE_FUNCTION_API_ENDPOINT;

  globalThis.fetch = async (input, options = {}) => {
    const requestUrl = String(input);
    if (requestUrl.includes('/tables/sync_runs/rows?')) {
      return json({ rows: [{
        source: 'jeju-openapi',
        status: 'completed',
        finishedAt: '2026-07-23T03:00:00.000Z',
        checkpointJson: JSON.stringify({
          life: 1000,
          proverb: 1000,
          dictionary: 1000,
          keyword: 1000,
        }),
      }] });
    }
    if (requestUrl.startsWith('https://www.jeju.go.kr/rest/')) {
      const page = new URL(requestUrl).searchParams.get('page');
      const seq = page === '1' ? '1001' : '1000';
      return xml(`<jejunetApi><items><item><seq>${seq}</seq><name>항목</name><contents>내용</contents></item></items><query><rows>2</rows></query></jejunetApi>`);
    }
    if (requestUrl.endsWith('/tables/culture_items/rows') && options.method === 'PUT') {
      return json({ message: 'simulated write failure' }, 500);
    }
    if (requestUrl.includes('/tables/sync_runs/rows/') && options.method === 'PUT') {
      const body = JSON.parse(String(options.body || '{}'));
      writes.push(body);
      return json({ $id: requestUrl.split('/').at(-1) });
    }
    throw new Error(`Unexpected request: ${requestUrl}`);
  };

  try {
    const result = await collect({
      req: { headers: { 'x-appwrite-key': 'dynamic-key' }, body: '{}' },
      res: { json: (payload, status = 200) => ({ payload, status }) },
      log: () => {},
      error: () => {},
    });

    assert.equal(result.status, 200, JSON.stringify(result));
    assert.equal(result.payload.ok, false);
    assert.equal(result.payload.fetched, 4);
    assert.equal(result.payload.failed, 4);
    assert.deepEqual(result.payload.checkpoint, {
      life: 1000,
      proverb: 1000,
      dictionary: 1000,
      keyword: 1000,
    });
    assert.equal(writes.length, 1);
    assert.equal(writes[0].data.status, 'partial');
    assert.equal(writes[0].data.checkpointJson, JSON.stringify(result.payload.checkpoint));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalFunctionEndpoint === undefined) delete process.env.APPWRITE_FUNCTION_API_ENDPOINT;
    else process.env.APPWRITE_FUNCTION_API_ENDPOINT = originalFunctionEndpoint;
  }
});

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

function xml(payload, status = 200) {
  return new Response(payload, { status, headers: { 'content-type': 'application/xml' } });
}
