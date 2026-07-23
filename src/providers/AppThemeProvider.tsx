import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import { AppColors, darkColors, lightColors } from '@/src/theme/tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = '@jeju/theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export async function readThemePreference(): Promise<ThemeMode> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved === 'system' || saved === 'light' || saved === 'dark' ? saved : 'system';
}

export function AppThemeProvider({ children, initialMode = 'system' }: PropsWithChildren<{ initialMode?: ThemeMode }>) {
  const systemScheme: ColorSchemeName = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const value = useMemo(
    () => ({ colors: isDark ? darkColors : lightColors, isDark, mode, setMode }),
    [isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside AppThemeProvider');
  return value;
}
