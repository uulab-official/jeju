import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

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
  const { colors } = useAppTheme();

  return (
    <View style={[styles.safe, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.bar}>
        {back ? (
          <HapticPressable
            accessibilityLabel="뒤로 가기"
            feedback="light"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.back}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </HapticPressable>
        ) : null}
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { zIndex: 10 },
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  back: { width: 38, height: 44, justifyContent: 'center', marginLeft: -8 },
  titleWrap: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: 'NanumBold', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 1 },
  actions: { minWidth: 38, flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
});
