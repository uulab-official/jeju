import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { triggerHaptic } from '@/src/lib/haptics';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const icons = {
  index: ['home-outline', 'home'],
  search: ['compass-outline', 'compass'],
  map: ['map-outline', 'map'],
  favorites: ['bookmark-outline', 'bookmark'],
  more: ['grid-outline', 'grid'],
} as const;

export default function TabLayout() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 7);
  return (
    <Tabs
      screenListeners={{ tabPress: () => void triggerHaptic('medium') }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 59 + bottomPadding,
          paddingTop: 7,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, focused, size }) => {
          const pair = icons[route.name as keyof typeof icons] ?? icons.index;
          return <Ionicons name={pair[focused ? 1 : 0]} size={size} color={color} />;
        },
      })}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="search" options={{ title: '발견' }} />
      <Tabs.Screen name="map" options={{ title: '지도' }} />
      <Tabs.Screen name="favorites" options={{ title: '저장' }} />
      <Tabs.Screen name="more" options={{ title: '전체' }} />
    </Tabs>
  );
}
