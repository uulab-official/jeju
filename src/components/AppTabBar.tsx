import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const TAB_CONTENT_HEIGHT = 58;
const MIN_BOTTOM_PADDING = 8;

const tabMeta = {
  index: { label: '홈', icon: 'home-outline', focusedIcon: 'home' },
  search: { label: '발견', icon: 'compass-outline', focusedIcon: 'compass' },
  map: { label: '지도', icon: 'map-outline', focusedIcon: 'map' },
  favorites: { label: '저장', icon: 'bookmark-outline', focusedIcon: 'bookmark' },
  more: { label: '전체', icon: 'grid-outline', focusedIcon: 'grid' },
} as const;

type AppTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const seedBottom = initialWindowMetrics?.insets.bottom ?? 0;
  const bottom = Math.max(insets.bottom, seedBottom, MIN_BOTTOM_PADDING);

  return (
    <View
      nativeID="main-tab-bar"
      style={[
        styles.root,
        {
          height: TAB_CONTENT_HEIGHT + bottom,
          paddingBottom: bottom,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = tabMeta[route.name as keyof typeof tabMeta] ?? tabMeta.index;
          const options = descriptors[route.key]?.options;
          const color = focused ? colors.primary : colors.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <HapticPressable
              accessibilityHint={focused
                ? '현재 탭입니다. 다시 누르면 목록 맨 위로 이동합니다.'
                : `${meta.label} 화면으로 이동합니다.`}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? meta.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityValue={{ text: `${index + 1}/${state.routes.length}` }}
              accessible
              collapsable={false}
              feedback="none"
              focusable
              key={route.key}
              onLongPress={onLongPress}
              onPress={onPress}
              style={styles.item}
              testID={options?.tabBarButtonTestID}>
              <Ionicons
                color={color}
                name={(focused ? meta.focusedIcon : meta.icon) as keyof typeof Ionicons.glyphMap}
                size={22}
              />
              <Text allowFontScaling={false} numberOfLines={1} style={[styles.label, { color }]}>
                {meta.label}
              </Text>
            </HapticPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: 'NanumBold',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 13,
  },
});
