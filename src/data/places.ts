import { JejuPlace, PlaceCategory } from '@/src/types/place';

const VISIT_JEJU = 'https://www.visitjeju.net/kr/';

export const placeCategories: { id: PlaceCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: 'apps-outline' },
  { id: 'nature', label: '자연', icon: 'leaf-outline' },
  { id: 'beach', label: '바다', icon: 'water-outline' },
  { id: 'walk', label: '걷기', icon: 'walk-outline' },
  { id: 'culture', label: '문화', icon: 'color-palette-outline' },
  { id: 'market', label: '시장', icon: 'basket-outline' },
  { id: 'island', label: '섬', icon: 'boat-outline' },
  { id: 'food', label: '맛집', icon: 'restaurant-outline' },
  { id: 'stay', label: '숙소', icon: 'bed-outline' },
  { id: 'festival', label: '축제', icon: 'sparkles-outline' },
  { id: 'activity', label: '체험', icon: 'bicycle-outline' },
];

export const jejuPlaces: JejuPlace[] = [
  {
    id: 'seongsan-ilchulbong', name: '성산일출봉', category: 'nature', categoryLabel: '자연', region: '서귀포시', area: '성산읍',
    summary: '바다 위로 솟은 응회구에서 제주의 동쪽과 일출을 만나요.',
    highlight: '이른 아침과 해 질 무렵, 바람이 강하지 않은 날에 천천히 둘러보기 좋아요.',
    latitude: 33.4581, longitude: 126.9425, tags: ['일출', '유네스코', '오름'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#F49A54', '#D75B35'],
  },
  {
    id: 'hallasan', name: '한라산', category: 'walk', categoryLabel: '걷기', region: '제주시', area: '한라산국립공원',
    summary: '계절마다 표정이 달라지는 제주 한가운데의 산과 숲을 걸어요.',
    highlight: '탐방로별 예약·통제·기상 정보를 출발 전에 반드시 공식 사이트에서 확인해 주세요.',
    latitude: 33.3617, longitude: 126.5292, tags: ['등산', '숲', '사계절'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#75A879', '#356B52'],
  },
  {
    id: 'udo', name: '우도', category: 'island', categoryLabel: '섬', region: '제주시', area: '우도면',
    summary: '배를 타고 들어가 해안 풍경과 작은 마을의 속도를 느껴보세요.',
    highlight: '선박 운항은 날씨에 따라 달라질 수 있어 당일 운항 정보를 확인하는 것이 좋아요.',
    latitude: 33.5067, longitude: 126.9527, tags: ['섬여행', '자전거', '해안'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#64B9C8', '#2E7895'],
  },
  {
    id: 'hyeopjae-beach', name: '협재해수욕장', category: 'beach', categoryLabel: '바다', region: '제주시', area: '한림읍',
    summary: '밝은 모래와 얕고 맑은 바다 너머로 비양도를 바라봐요.',
    highlight: '여름 성수기 외에도 산책하기 좋지만, 강풍과 파도 예보는 꼭 확인해 주세요.',
    latitude: 33.394, longitude: 126.2397, tags: ['해변', '비양도', '노을'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#76C9E8', '#3D8BC4'],
  },
  {
    id: 'dongmun-market', name: '동문재래시장', category: 'market', categoryLabel: '시장', region: '제주시', area: '일도일동',
    summary: '제주의 식재료와 간식, 사람들의 생활이 모이는 도심 시장이에요.',
    highlight: '방문 시간에 따라 문을 연 점포가 다르므로 목적이 있다면 영업 정보를 확인해 주세요.',
    latitude: 33.5116, longitude: 126.526, tags: ['먹거리', '전통시장', '도심'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#F2B35D', '#C86A36'],
  },
  {
    id: 'jeju-museum-art', name: '제주도립미술관', category: 'culture', categoryLabel: '문화', region: '제주시', area: '연동',
    summary: '제주의 자연과 예술을 차분히 이어 보는 문화 공간이에요.',
    highlight: '전시는 교체될 수 있으니 공식 안내에서 휴관일과 현재 전시를 확인해 주세요.',
    latitude: 33.4527, longitude: 126.4897, tags: ['미술', '전시', '비오는날'], sourceName: '비짓제주', sourceUrl: VISIT_JEJU, accent: ['#B49AD8', '#76599F'],
  },
  {
    id: 'visitjeju-981-park', name: '9.81파크 제주', category: 'activity', categoryLabel: '체험', region: '제주시', area: '애월읍',
    summary: '한라산과 애월 바다 사이에서 무동력 레이싱과 여러 실내외 액티비티를 즐겨요.',
    highlight: '체험별 탑승 조건과 운영 여부가 다르고 날씨의 영향을 받을 수 있어 방문 전 공식 안내를 확인해 주세요.',
    latitude: 33.3928867, longitude: 126.3586318, tags: ['액티비티', '그래비티레이싱', '애월', '아이와'],
    address: '제주특별자치도 제주시 애월읍 천덕로 880-24', phone: '064-1833-9810',
    homepage: 'https://www.981park.com/', heroImageUrl: 'https://api.cdn.visitjeju.net/photomng/imgpath/202310/17/ba47ccc7-2637-4c98-977f-8ae4f959c9f1.webp',
    images: [{ url: 'https://api.cdn.visitjeju.net/photomng/imgpath/202310/17/ba47ccc7-2637-4c98-977f-8ae4f959c9f1.webp', thumbnailUrl: 'https://api.cdn.visitjeju.net/photomng/thumbnailpath/202310/17/1ccb902d-2102-45e5-9093-00a9eed44c20.webp', description: '9.81파크 제주' }],
    sourceName: '비짓제주', sourceUrl: 'https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_200000000008633', accent: ['#6BC0A1', '#25735C'],
  },
  {
    id: 'visitjeju-rail-bike', name: '제주레일바이크', category: 'activity', categoryLabel: '체험', region: '제주시', area: '구좌읍',
    summary: '오름과 목장 풍경 사이의 철로를 따라 전동 레일바이크로 달려요.',
    highlight: '계절별 운영시간과 현장 상황이 달라질 수 있으니 출발 전에 공식 관광정보와 운영처 안내를 확인해 주세요.',
    latitude: 33.4646218, longitude: 126.8369517, tags: ['액티비티', '레일바이크', '아이와', '동쪽여행'],
    address: '제주특별자치도 제주시 구좌읍 용눈이오름로 641', phone: '064-783-0033',
    homepage: 'https://www.jejurailpark.com/m/index.php', heroImageUrl: 'https://api.cdn.visitjeju.net/photomng/imgpath/202111/04/bbcd9fd9-519f-4265-ad56-fbbda40731b3.webp',
    images: [{ url: 'https://api.cdn.visitjeju.net/photomng/imgpath/202111/04/bbcd9fd9-519f-4265-ad56-fbbda40731b3.webp', thumbnailUrl: 'https://api.cdn.visitjeju.net/photomng/thumbnailpath/202111/04/d6fe3c07-6d5d-43b2-adee-79d8feb52687.webp', description: '제주레일바이크' }],
    sourceName: '비짓제주', sourceUrl: 'https://www.visitjeju.net/kr/detail/view?contentsid=CNTS_000000000020139', accent: ['#78BFC9', '#32758F'],
  },
];

export function getPlace(id: string) {
  return jejuPlaces.find((place) => place.id === id);
}
