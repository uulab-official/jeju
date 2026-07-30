import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

export function AppHeader({
  title,
  subtitle,
  back = false,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const seedTop = initialWindowMetrics?.insets.top ?? 0;
  const top = Math.max(insets.top, seedTop);
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.safe,
        {
          height: top + layout.appBarHeight,
          paddingTop: top,
          backgroundColor: colors.background,
        },
      ]}>
      <View style={styles.bar}>
        {back ? (
          <View style={styles.leading}>
            <HapticPressable
              accessibilityLabel="뒤로 가기"
              feedback="light"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.back}>
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </HapticPressable>
          </View>
        ) : null}
        <View style={[styles.titleWrap, subtitle ? styles.titleWrapWithSubtitle : styles.titleWrapSingle]}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { zIndex: 10, flexShrink: 0 },
  bar: { height: layout.appBarHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.screenPadding },
  leading: { width: layout.minTouchTarget, height: layout.minTouchTarget, justifyContent: 'center', marginLeft: -8 },
  back: { width: layout.minTouchTarget, height: layout.minTouchTarget, justifyContent: 'center' },
  titleWrap: { flex: 1, minWidth: 0 },
  titleWrapSingle: { height: layout.appBarHeight, justifyContent: 'center' },
  titleWrapWithSubtitle: { height: layout.minTouchTarget, justifyContent: 'center' },
  title: {
    ...typography.heading,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  subtitle: { ...typography.caption, marginTop: 1 },
  actions: { minWidth: layout.minTouchTarget, minHeight: layout.minTouchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
});
