import assert from 'node:assert/strict';
import test from 'node:test';

process.env.TOUR_API_SERVICE_KEY = 'test-key';
process.env.TOUR_API_MAX_ITEMS = '1';

const { default: collect } = await import('../src/main.js');

test('TourAPI 장소와 여러 이미지 메타데이터를 Appwrite row로 정규화한다', async () => {
  const writes = [];
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options = {}) => {
    const requestUrl = String(input);
    requests.push(requestUrl);
    if (requestUrl.includes('/areaBasedList2')) {
      return json({ response: { header: { resultCode: '0000' }, body: { totalCount: 1, items: { item: {
        contentid: '123', contenttypeid: '12', title: '테스트 오름', addr1: '제주특별자치도 제주시 애월읍',
        mapx: '126.4', mapy: '33.4', firstimage: 'https://images.example/hero.jpg', modifiedtime: '20260722093000',
      } } } } });
    }
    if (requestUrl.includes('/detailCommon2')) {
      return json({ response: { header: { resultCode: '0000' }, body: { items: { item: {
        contentid: '123', contenttypeid: '12', title: '테스트 오름', addr1: '제주특별자치도 제주시 애월읍',
        mapx: '126.4', mapy: '33.4', overview: '<p>공식 상세 설명</p>', firstimage: 'https://images.example/hero.jpg',
        homepage: 'https://중문카트.com/',
      } } } } });
    }
    if (requestUrl.includes('/detailIntro2')) {
      return json({ response: { header: { resultCode: '0000' }, body: { items: { item: {
        usetime: '09:00~18:00', restdate: '연중무휴', parking: '주차 가능',
      } } } } });
    }
    if (requestUrl.includes('/detailImage2')) {
      return json({ response: { header: { resultCode: '0000' }, body: { items: { item: [
        { originimgurl: 'https://images.example/one.jpg', smallimageurl: 'https://images.example/one-small.jpg', imgname: '전경', cpyrhtDivCd: 'Type1' },
        { originimgurl: 'https://images.example/two.jpg', imgname: '산책로', cpyrhtDivCd: 'Type1' },
      ] } } } });
    }
    if (requestUrl.includes('/rows?')) {
      return json({ rows: [{ $id: 'tour-old', data: { source: 'tourapi-kor-service2', active: true } }] });
    }
    if (requestUrl.includes('/tablesdb/') && options.method === 'PATCH') {
      writes.push({ requestUrl, body: JSON.parse(String(options.body || '{}')) });
      return json({ $id: requestUrl.split('/').at(-1) });
    }
    if (requestUrl.includes('/tablesdb/')) {
      writes.push({ requestUrl, body: JSON.parse(String(options.body || '{}')) });
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

    assert.equal(result.status, 200);
    assert.equal(result.payload.processed, 1);
    const placeWrite = writes.find((write) => write.requestUrl.endsWith('/tour-123'));
    assert.ok(placeWrite);
    assert.equal(placeWrite.body.data.name, '테스트 오름');
    assert.equal(placeWrite.body.data.region, '제주시');
    assert.equal(placeWrite.body.data.openingHours, '09:00~18:00');
    assert.equal(placeWrite.body.data.homepage, 'https://xn--z92b76wi8d22e.com/');
    assert.equal(JSON.parse(placeWrite.body.data.imagesJson).length, 3);
    assert.deepEqual(placeWrite.body.permissions, ['read("any")']);
    assert.ok(writes.some((write) => write.body.data?.source === 'tourapi-kor-service2'));
    const areaRequest = requests.find((url) => url.includes('/areaBasedList2'));
    const commonRequest = requests.find((url) => url.includes('/detailCommon2'));
    assert.match(areaRequest, /lDongRegnCd=50/);
    assert.doesNotMatch(areaRequest, /areaCode=/);
    assert.doesNotMatch(commonRequest, /defaultYN|firstImageYN|areacodeYN|catcodeYN|addrinfoYN|mapinfoYN|overviewYN/);
    const staleListRequest = requests.find((url) => url.includes('/rows?'));
    const staleQueries = new URL(staleListRequest).searchParams.getAll('queries[]').map(JSON.parse);
    assert.deepEqual(staleQueries, [
      { method: 'equal', attribute: 'source', values: ['tourapi-kor-service2'] },
      { method: 'equal', attribute: 'active', values: [true] },
    ]);
    const retiredWrite = writes.find((write) => write.requestUrl.endsWith('/tour-old'));
    assert.equal(retiredWrite?.body.data.active, false);
    assert.ok(retiredWrite?.body.data.retiredAt);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('TourAPI가 빈 목록을 반환하면 장소를 덮어쓰지 않고 실패로 기록한다', async () => {
  const writes = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options = {}) => {
    const requestUrl = String(input);
    if (requestUrl.includes('/areaBasedList2')) {
      return json({ response: { header: { resultCode: '0000' }, body: { totalCount: 0, items: {} } } });
    }
    if (requestUrl.includes('/tablesdb/')) {
      writes.push({ requestUrl, body: JSON.parse(String(options.body || '{}')) });
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

    assert.equal(result.status, 500);
    assert.match(result.payload.error, /too few places/);
    assert.equal(writes.filter((write) => /\/tour-/.test(write.requestUrl)).length, 0);
    assert.equal(writes.filter((write) => write.body.data?.source === 'tourapi-kor-service2').length, 1);
    assert.equal(writes[0].body.data.status, 'failed');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}
