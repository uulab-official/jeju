export const resourceKinds = ['life', 'proverb', 'dictionary', 'keyword'] as const;
export type ResourceKind = (typeof resourceKinds)[number];

export type DetailField = {
  label: string;
  value: string;
};

export type JejuItem = {
  id: string;
  kind: ResourceKind;
  title: string;
  subtitle?: string;
  body: string;
  category?: string;
  imageUrl?: string;
  audioUrl?: string;
  fields: DetailField[];
  searchText: string;
};

export type ResourceMeta = {
  label: string;
  shortLabel: string;
  description: string;
  endpoint: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
};

export const resourceMeta: Record<ResourceKind, ResourceMeta> = {
  life: {
    label: '제주 생활방언',
    shortLabel: '생활방언',
    description: '제주의 일상과 삶 속에서 쓰인 말을 살펴봐요.',
    endpoint: '/rest/JejuLifeDialectService/getJejuLifeDialectServiceList',
    icon: 'people-outline',
  },
  proverb: {
    label: '제주 속담',
    shortLabel: '속담',
    description: '제주 사람들의 지혜가 담긴 속담을 만나요.',
    endpoint: '/rest/JejuAdageService/getJejuAdageServiceList',
    icon: 'chatbubble-ellipses-outline',
  },
  dictionary: {
    label: '제주어 사전',
    shortLabel: '사전',
    description: '제주어의 뜻과 여러 언어 번역을 찾아봐요.',
    endpoint: '/rest/JejuDialectService/getJejuDialectServiceList',
    icon: 'book-outline',
  },
  keyword: {
    label: '색인어 사전',
    shortLabel: '색인어',
    description: '문헌 속 제주어와 관련 낱말을 탐색해요.',
    endpoint: '/rest/JejuAdageIndexService/getJejuAdageIndexList',
    icon: 'library-outline',
  },
};
