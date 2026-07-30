import { Tabs } from 'expo-router';

import { AppTabBar } from '@/src/components/AppTabBar';
import { triggerHaptic } from '@/src/lib/haptics';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenListeners={{ tabPress: () => void triggerHaptic('medium') }}
      screenOptions={{
        animation: 'none',
        freezeOnBlur: false,
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="search" options={{ title: '발견' }} />
      <Tabs.Screen name="map" options={{ title: '지도' }} />
      <Tabs.Screen name="favorites" options={{ title: '저장' }} />
      <Tabs.Screen name="more" options={{ title: '전체' }} />
    </Tabs>
  );
}
