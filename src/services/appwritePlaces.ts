import { jejuPlaces } from '@/src/data/places';
import {
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PLACES_TABLE_ID,
  APPWRITE_PROJECT_ID,
  tablesDB,
} from '@/src/lib/appwrite';
import { JejuPlace, PlaceCategory, PlaceImage } from '@/src/types/place';
import { Query } from 'react-native-appwrite';

const PAGE_SIZE = 100;
const MAX_ROWS = 2000;
const FETCH_TIMEOUT_MS = 12_000;

type AppwriteRow = Record<string, unknown> & { $id?: string };

export type PlaceBackendConfig = {
  endpoint: string;
  projectId: string;
  databaseId: string;
  tableId: string;
};

export function getPlaceBackendConfig(): PlaceBackendConfig | null {
  return {
    endpoint: APPWRITE_ENDPOINT,
    projectId: APPWRITE_PROJECT_ID,
    databaseId: APPWRITE_DATABASE_ID,
    tableId: APPWRITE_PLACES_TABLE_ID,
  };
}

export async function fetchAppwritePlaces(): Promise<JejuPlace[]> {
  const config = getPlaceBackendConfig();
  if (!config) return jejuPlaces;

  const rows: AppwriteRow[] = [];
  let cursor: string | undefined;
  for (let pageNumber = 0; pageNumber < Math.ceil(MAX_ROWS / PAGE_SIZE); pageNumber += 1) {
    const queries = [Query.equal('active', true), Query.orderAsc('$id'), Query.limit(PAGE_SIZE)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const payload = await withTimeout(tablesDB.listRows({
      databaseId: config.databaseId,
      tableId: config.tableId,
      queries,
      total: false,
      ttl: 300,
    }), FETCH_TIMEOUT_MS);
    const pageRows = payload.rows as AppwriteRow[];
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) break;
    const nextCursor = pageRows.at(-1)?.$id;
    if (!nextCursor || nextCursor === cursor) break;
    cursor = nextCursor;
  }

  const places = rows.map(toPlace).filter((place): place is JejuPlace => Boolean(place));
  if (!places.length) throw new Error('Appwrite에 공개된 제주 장소가 없습니다.');
  return places;
}

function toPlace(row: AppwriteRow): JejuPlace | null {
  const name = text(row.name);
  const latitude = number(row.latitude);
  const longitude = number(row.longitude);
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const category = normalizeCategory(row.category);
  const images = parseImages(row.imagesJson);
  const heroImageUrl = url(row.heroImageUrl) || images[0]?.url;
  const region = text(row.region).includes('서귀포') ? '서귀포시' : '제주시';

  return {
    id: text(row.$id) || `tour-${text(row.externalId)}`,
    externalId: text(row.externalId),
    contentTypeId: number(row.contentTypeId) || undefined,
    name,
    category,
    categoryLabel: text(row.categoryLabel) || categoryLabel(category),
    region,
    area: text(row.area) || region,
    address: text(row.address),
    summary: text(row.summary) || `${region}에 있는 ${name}의 공식 관광정보입니다.`,
    highlight: text(row.highlight) || '운영시간과 현장 상황은 방문 전 공식 정보를 확인해 주세요.',
    latitude,
    longitude,
    tags: stringArray(row.tags),
    sourceName: text(row.sourceName) || '한국관광공사 TourAPI',
    sourceUrl: url(row.sourceUrl) || 'https://korean.visitkorea.or.kr/',
    sourceLicense: text(row.sourceLicense),
    phone: text(row.phone),
    homepage: url(row.homepage),
    openingHours: text(row.openingHours),
    restDate: text(row.restDate),
    parking: text(row.parking),
    heroImageUrl,
    images,
    modifiedAt: text(row.modifiedAt),
    collectedAt: text(row.collectedAt),
    accent: [text(row.accentStart) || '#E98A47', text(row.accentEnd) || '#B9422D'],
  };
}

async function withTimeout<T>(request: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Appwrite 요청 시간이 ${timeoutMs / 1000}초를 넘었습니다.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function parseImages(value: unknown): PlaceImage[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        url: url(item?.url),
        thumbnailUrl: url(item?.thumbnailUrl),
        description: text(item?.description),
        copyrightType: text(item?.copyrightType),
      }))
      .filter((item) => Boolean(item.url));
  } catch {
    return [];
  }
}

function normalizeCategory(value: unknown): PlaceCategory {
  const category = text(value) as PlaceCategory;
  const allowed: PlaceCategory[] = [
    'nature', 'beach', 'culture', 'market', 'island', 'walk', 'food', 'stay', 'festival', 'activity',
  ];
  return allowed.includes(category) ? category : 'nature';
}

function categoryLabel(category: PlaceCategory) {
  return ({
    nature: '자연', beach: '바다', culture: '문화', market: '시장', island: '섬', walk: '걷기',
    food: '맛집', stay: '숙소', festival: '축제', activity: '체험',
  } satisfies Record<PlaceCategory, string>)[category];
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean);
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function text(value: unknown) {
  return typeof value === 'string' ? value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function url(value: unknown) {
  const candidate = text(value);
  return /^https?:\/\//i.test(candidate) ? candidate.replace(/^http:\/\//i, 'https://') : '';
}
