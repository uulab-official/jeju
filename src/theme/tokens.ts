export const palette = {
  tangerine: '#E87924',
  tangerineDark: '#B95112',
  citrus: '#F7B955',
  cream: '#FFF7E5',
  ink: '#27231F',
  muted: '#756B61',
  line: '#E9DED1',
  white: '#FFFFFF',
  night: '#171411',
  nightSurface: '#24201C',
  nightLine: '#3B342D',
  danger: '#C63C35',
  success: '#397A4A',
};

export type AppColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  primaryStrong: string;
  onPrimary: string;
  danger: string;
  success: string;
};

export const lightColors: AppColors = {
  background: '#FFFCF7',
  surface: palette.white,
  surfaceAlt: palette.cream,
  text: palette.ink,
  muted: palette.muted,
  border: palette.line,
  primary: palette.tangerine,
  primaryStrong: palette.tangerineDark,
  onPrimary: palette.white,
  danger: palette.danger,
  success: palette.success,
};

export const darkColors: AppColors = {
  background: palette.night,
  surface: palette.nightSurface,
  surfaceAlt: '#30281F',
  text: '#FFF8EF',
  muted: '#C0B4A8',
  border: palette.nightLine,
  primary: '#F29B4C',
  primaryStrong: '#FFBA72',
  onPrimary: '#2B1607',
  danger: '#FF8882',
  success: '#8CD29A',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
export const layout = {
  screenPadding: 18,
  screenBottomPadding: 36,
  appBarHeight: 56,
  controlHeight: 50,
  minTouchTarget: 44,
} as const;

export type PretendardWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export const pretendardFamily: Record<PretendardWeight, string> = {
  100: 'Pretendard-100',
  200: 'Pretendard-200',
  300: 'Pretendard-300',
  400: 'Pretendard-400',
  500: 'Pretendard-500',
  600: 'Pretendard-600',
  700: 'Pretendard-700',
  800: 'Pretendard-800',
  900: 'Pretendard-900',
};

export const pretendard = (weight: PretendardWeight = 400) => ({
  fontFamily: pretendardFamily[weight],
});

export const typography = {
  display: { fontFamily: 'NanumOld', fontSize: 29, lineHeight: 39 },
  heading: { ...pretendard(900), fontSize: 20, letterSpacing: -0.2 },
  subheading: { ...pretendard(800), fontSize: 16 },
  body: { ...pretendard(400), fontSize: 14, lineHeight: 21 },
  caption: { ...pretendard(400), fontSize: 12, lineHeight: 18 },
  label: { ...pretendard(800), fontSize: 12 },
} as const;
