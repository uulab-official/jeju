export type JejuHistoryChapter = {
  id: string;
  period: string;
  eyebrow: string;
  title: string;
  summary: string;
  paragraphs: string[];
  icon: string;
  accent: [string, string];
  sourceName: string;
  sourceUrl: string;
  place?: {
    name: string;
    address: string;
    note: string;
    url: string;
  };
  remembrance?: string;
};

export const jejuHistoryChapters: JejuHistoryChapter[] = [
  {
    id: 'tamna',
    period: '기원후 2세기 무렵–1105',
    eyebrow: '섬나라 탐라',
    title: '바다로 이어진 탐라',
    summary: '제주는 고립된 섬이 아니라 한반도와 중국, 일본을 잇는 바닷길의 교류 거점이었어요.',
    paragraphs: [
      '국립제주박물관은 탐라가 기원후 200년 무렵부터 1105년까지 제주에 존재했던 고대 정치체로 설명합니다.',
      '탐라 사람들은 섬의 자연에 적응해 생활하면서 바다를 건너 주변 지역과 물자와 문화를 주고받았습니다. 출토 유물은 제주가 오래전부터 동아시아 해상 교류망 안에 있었음을 보여줍니다.',
    ],
    icon: 'boat-outline',
    accent: ['#2F869B', '#16485B'],
    sourceName: '국립제주박물관 · 섬나라 탐라',
    sourceUrl: 'https://jeju.museum.go.kr/_prog/special_exhibit/index.php?gubun=&menu_dvs_cd=040201&mng_no=223&mode=V&site_dvs_cd=kr',
    place: {
      name: '국립제주박물관',
      address: '제주시 일주동로 17',
      note: '제주의 선사시대부터 탐라, 고려와 조선의 역사·문화유산을 한자리에서 살펴볼 수 있어요.',
      url: 'https://jeju.museum.go.kr/',
    },
  },
  {
    id: 'goryeo',
    period: '1105–1295',
    eyebrow: '탐라에서 제주로',
    title: '고려와 몽골의 흔적',
    summary: '1105년 탐라군 편입 이후 섬의 행정과 생활은 한반도 정세 속에서 크게 바뀌었어요.',
    paragraphs: [
      '고려는 처음에는 탐라의 지배 질서를 인정했지만 1105년 탐라를 탐라군으로 편입했습니다. 1273년 삼별초가 진압된 뒤에는 몽골의 직접 지배 기구가 설치되고 목마장이 운영되며 말과 목축 문화가 제주 생활에 큰 영향을 남겼습니다.',
      '1295년에는 바다 건너의 고을이라는 뜻을 담은 제주라는 이름으로 바뀌었습니다. 항파두리 유적은 1271년 제주에 들어온 삼별초가 성을 쌓고 1273년까지 저항했던 역사를 전합니다.',
    ],
    icon: 'flag-outline',
    accent: ['#8B6A4C', '#513824'],
    sourceName: '국립제주박물관 · 고려시대 제주',
    sourceUrl: 'https://jeju.museum.go.kr/html/kr/sub02/sub02_020106.html',
    place: {
      name: '제주 항파두리 항몽 유적',
      address: '제주시 애월읍 항파두리로 50',
      note: '토성과 전시관을 통해 13세기 삼별초의 제주 진입과 최후 항전을 살펴보는 국가 사적이에요.',
      url: 'https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1333903960000&pageNo=1_1_1_1',
    },
  },
  {
    id: 'tamna-sunryeokdo',
    period: '1702',
    eyebrow: '조선시대 제주',
    title: '그림으로 남은 탐라순력도',
    summary: '한 장면씩 펼치면 18세기 제주의 성곽, 마을, 목장과 사람들의 삶이 보여요.',
    paragraphs: [
      '1702년 제주목사 이형상은 제주 곳곳을 순력한 뒤 그 과정과 모습을 그림과 글로 기록한 탐라순력도를 만들었습니다.',
      '행정 기록이면서 동시에 당시 제주의 지형과 방어 시설, 목장과 행사, 생활상을 시각적으로 전하는 중요한 자료입니다. 오늘의 장소와 옛 그림을 비교해 보면 도시와 마을이 어떻게 달라졌는지 더 입체적으로 읽을 수 있습니다.',
    ],
    icon: 'map-outline',
    accent: ['#A45F45', '#653425'],
    sourceName: '국립제주박물관 · 탐라순력도',
    sourceUrl: 'https://jeju.museum.go.kr/_prog/special_exhibit/index.php?gubun=&menu_dvs_cd=0402&mng_no=262&mode=V&site_dvs_cd=kr',
    place: {
      name: '국립제주박물관',
      address: '제주시 일주동로 17',
      note: '탐라순력도와 관련된 전시·자료는 방문 전 박물관의 현재 전시 안내를 확인해 주세요.',
      url: 'https://jeju.museum.go.kr/',
    },
  },
  {
    id: 'jeju-43',
    period: '1947–1954',
    eyebrow: '기억에서 평화로',
    title: '제주4·3을 기억하다',
    summary: '수많은 민간인이 희생된 역사를 기억하고, 진상규명과 화해·상생의 의미를 배워요.',
    paragraphs: [
      '제주4·3평화재단은 제주4·3을 1947년 3월 1일 경찰의 발포를 기점으로, 1948년 4월 3일 무장봉기와 이후의 무력 충돌·진압 과정에서 수많은 제주도민이 희생된 사건으로 설명합니다.',
      '그 시간의 범위는 1954년 9월 21일 한라산 금족지역이 전면 개방될 때까지 이어집니다. 오늘의 4·3 기억 공간은 희생자를 추모하고 진실, 인권, 평화와 화해·상생의 가치를 다음 세대에 전하는 곳입니다.',
    ],
    icon: 'flower-outline',
    accent: ['#5D6670', '#30363C'],
    sourceName: '제주4·3평화재단 · 4·3이란',
    sourceUrl: 'https://jeju43peace.or.kr/kor/sub01_01_01.do',
    place: {
      name: '제주4·3평화공원',
      address: '제주시 명림로 430',
      note: '기념관, 위령제단과 위령탑 등이 있는 추모·평화·인권 교육 공간입니다.',
      url: 'https://jeju43peace.or.kr/kor/sub04_01.do',
    },
    remembrance: '이곳은 희생자를 기억하고 추모하는 경건한 공간입니다. 조용하고 차분한 태도로 둘러보고, 인물과 유적을 가벼운 인증 사진의 배경으로 소비하지 않도록 해주세요.',
  },
];

export function getJejuHistoryChapter(id: string) {
  return jejuHistoryChapters.find((chapter) => chapter.id === id);
}
