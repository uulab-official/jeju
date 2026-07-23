import { Query } from 'react-native-appwrite';

import {
  APPWRITE_CULTURE_TABLE_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  tablesDB,
} from '@/src/lib/appwrite';
import { JejuItem, ResourceKind } from '@/src/types/jeju';

const PAGE_SIZE = 20;
const FETCH_TIMEOUT_MS = 12_000;

type AppwriteRow = Record<string, unknown> & { $id?: string };

export type CulturePage = {
  items: JejuItem[];
  nextCursor?: string;
  hasMore: boolean;
  total: number;
};

export function getCultureBackendConfig() {
  return { endpoint: APPWRITE_ENDPOINT, projectId: APPWRITE_PROJECT_ID, databaseId: APPWRITE_DATABASE_ID, tableId: APPWRITE_CULTURE_TABLE_ID };
}

export async function fetchCulturePage(kind: ResourceKind, cursor?: string): Promise<CulturePage> {
  const queries = [Query.equal('active', true), Query.equal('kind', kind), Query.orderAsc('$id'), Query.limit(PAGE_SIZE)];
  if (cursor) queries.push(Query.cursorAfter(cursor));
  const payload = await withTimeout(tablesDB.listRows({ databaseId: APPWRITE_DATABASE_ID, tableId: APPWRITE_CULTURE_TABLE_ID, queries, total: true, ttl: 300 }), FETCH_TIMEOUT_MS);
  const rows = payload.rows as AppwriteRow[];
  return pageFromRows(rows, Number(payload.total || 0));
}

export async function searchCultureItems(query: string, kind?: ResourceKind): Promise<JejuItem[]> {
  const queries = [Query.equal('active', true), Query.search('searchText', query), Query.limit(PAGE_SIZE), Query.orderAsc('$id')];
  if (kind) queries.splice(1, 0, Query.equal('kind', kind));
  const payload = await withTimeout(tablesDB.listRows({ databaseId: APPWRITE_DATABASE_ID, tableId: APPWRITE_CULTURE_TABLE_ID, queries, total: false, ttl: 120 }), FETCH_TIMEOUT_MS);
  return (payload.rows as AppwriteRow[]).map(toItem).filter((item): item is JejuItem => Boolean(item));
}

function pageFromRows(rows: AppwriteRow[], total: number): CulturePage {
  const items = rows.map(toItem).filter((item): item is JejuItem => Boolean(item));
  const nextCursor = rows.at(-1)?.$id;
  return { items, nextCursor: items.length === PAGE_SIZE ? nextCursor : undefined, hasMore: items.length === PAGE_SIZE, total };
}

function toItem(row: AppwriteRow): JejuItem | null {
  const id = text(row.externalId) || text(row.$id);
  const kind = text(row.kind) as ResourceKind;
  const title = text(row.title);
  if (!id || !title || !['life', 'proverb', 'dictionary', 'keyword'].includes(kind)) return null;
  let fields: { label: string; value: string }[] = [];
  try {
    const parsed = JSON.parse(text(row.fieldsJson));
    if (Array.isArray(parsed)) fields = parsed.filter((item) => item && typeof item.label === 'string' && typeof item.value === 'string');
  } catch {
    // A malformed optional fields payload should not hide the item.
  }
  return { id, kind, title, subtitle: text(row.subtitle) || undefined, body: text(row.body), category: text(row.category) || undefined, imageUrl: url(row.imageUrl), audioUrl: url(row.audioUrl), fields, searchText: text(row.searchText).toLocaleLowerCase('ko-KR') };
}

function text(value: unknown) { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''; }
function url(value: unknown) { const valueText = text(value); return /^https?:\/\//i.test(valueText) ? valueText : undefined; }
async function withTimeout<T>(request: Promise<T>, timeoutMs: number): Promise<T> { let timeout: ReturnType<typeof setTimeout> | undefined; try { return await Promise.race([request, new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error(`Appwrite 요청 시간이 ${timeoutMs / 1000}초를 넘었습니다.`)), timeoutMs); })]); } finally { if (timeout) clearTimeout(timeout); } }
