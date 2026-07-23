import { JejuPlace, PlaceCategory } from '@/src/types/place';

export type TravelGuide = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  duration: string;
  pace: string;
  icon: string;
  accent: [string, string];
  categories: PlaceCategory[];
  tags: string[];
  fallbackPlaceIds: string[];
  tips: string[];
};

export const travelGuides: TravelGuide[] = [
  {
    id: 'east-island-day',
    eyebrow: '동쪽 하루',
    title: '해 뜨는 섬을 따라',
    summary: '성산의 능선부터 우도의 해안까지, 제주 동쪽 풍경을 크게 만나는 하루예요.',
    duration: '하루',
    pace: '활기차게',
    icon: 'sunny-outline',
    accent: ['#FFB85C', '#E55F32'],
    categories: ['nature', 'island', 'beach'],
    tags: ['일출', '성산', '우도', '해안', '자전거'],
    fallbackPlaceIds: ['seongsan-ilchulbong', 'udo'],
    tips: ['우도 선박 운항과 마지막 배 시간을 먼저 확인해요.', '바람이 강한 날에는 해안 이동 시간을 여유롭게 잡아요.'],
  },
  {
    id: 'active-jeju',
    eyebrow: '액티비티',
    title: '몸으로 기억하는 제주',
    summary: '걷기, 라이딩, 레포츠처럼 제주의 바람과 지형을 온몸으로 즐겨요.',
    duration: '반나절~하루',
    pace: '에너지 충전',
    icon: 'bicycle-outline',
    accent: ['#67BFA5', '#287B69'],
    categories: ['activity', 'walk', 'island'],
    tags: ['액티비티', '체험', '등산', '자전거', '레포츠', '트레킹'],
    fallbackPlaceIds: ['hallasan', 'udo'],
    tips: ['예약·연령·신장 제한은 운영처 공식 안내에서 확인해요.', '등산과 해양 활동은 기상 통제 여부를 출발 직전에 다시 확인해요.'],
  },
  {
    id: 'rainy-jeju',
    eyebrow: '비 오는 날',
    title: '제주의 예술과 생활 속으로',
    summary: '미술관과 시장을 오가며 비가 내려도 깊고 따뜻한 제주를 만나요.',
    duration: '반나절',
    pace: '느긋하게',
    icon: 'rainy-outline',
    accent: ['#A99BDC', '#6656A5'],
    categories: ['culture', 'market', 'food'],
    tags: ['비오는날', '전시', '미술', '전통시장', '먹거리'],
    fallbackPlaceIds: ['jeju-museum-art', 'dongmun-market'],
    tips: ['휴관일과 전시 교체 일정을 먼저 확인해요.', '시장 점포별 영업시간은 서로 다를 수 있어요.'],
  },
  {
    id: 'west-sunset',
    eyebrow: '서쪽 오후',
    title: '바다와 노을 사이 천천히',
    summary: '밝은 바다와 해안 산책을 중심으로 제주 서쪽의 여백을 즐겨요.',
    duration: '반나절',
    pace: '천천히',
    icon: 'partly-sunny-outline',
    accent: ['#78C8E8', '#4377C5'],
    categories: ['beach', 'walk', 'nature'],
    tags: ['노을', '해변', '산책', '한림', '애월'],
    fallbackPlaceIds: ['hyeopjae-beach'],
    tips: ['일몰 시각보다 한 시간쯤 일찍 도착하면 좋아요.', '해안 강풍과 파도 예보를 확인하고 물가 안전선을 지켜요.'],
  },
];

export function getTravelGuide(id: string) {
  return travelGuides.find((guide) => guide.id === id);
}

export function resolveGuidePlaces(guide: TravelGuide, places: JejuPlace[], limit = 5) {
  const picked: JejuPlace[] = [];
  const seen = new Set<string>();
  const add = (place?: JejuPlace) => {
    if (place && !seen.has(place.id) && picked.length < limit) {
      seen.add(place.id);
      picked.push(place);
    }
  };

  guide.fallbackPlaceIds.forEach((id) => add(places.find((place) => place.id === id)));
  places
    .map((place) => ({ place, score: scorePlace(place, guide) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'ko-KR'))
    .forEach(({ place }) => add(place));

  return picked;
}

function scorePlace(place: JejuPlace, guide: TravelGuide) {
  const haystack = `${place.name} ${place.area} ${place.summary} ${place.tags.join(' ')}`.toLocaleLowerCase('ko-KR');
  const categoryScore = guide.categories.includes(place.category) ? 3 : 0;
  const tagScore = guide.tags.reduce((score, tag) => score + (haystack.includes(tag.toLocaleLowerCase('ko-KR')) ? 2 : 0), 0);
  return categoryScore + tagScore;
}
