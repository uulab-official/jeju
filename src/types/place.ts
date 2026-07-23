export type PlaceCategory =
  | 'nature'
  | 'beach'
  | 'culture'
  | 'market'
  | 'island'
  | 'walk'
  | 'food'
  | 'stay'
  | 'festival'
  | 'activity';

export type PlaceImage = {
  url: string;
  thumbnailUrl?: string;
  description?: string;
  copyrightType?: string;
};

export type JejuPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  region: '제주시' | '서귀포시';
  area: string;
  summary: string;
  highlight: string;
  latitude: number;
  longitude: number;
  tags: string[];
  sourceName: string;
  sourceUrl: string;
  sourceLicense?: string;
  externalId?: string;
  contentTypeId?: number;
  address?: string;
  phone?: string;
  homepage?: string;
  openingHours?: string;
  restDate?: string;
  parking?: string;
  heroImageUrl?: string;
  images?: PlaceImage[];
  modifiedAt?: string;
  collectedAt?: string;
  accent: [string, string];
};
