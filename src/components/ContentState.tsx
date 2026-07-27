import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  const { colors } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0.45));
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return (
    <View accessibilityLabel="목록을 불러오는 중" style={styles.skeletonList}>
      {Array.from({ length: rows }).map((_, index) => (
        <Animated.View key={index} style={[styles.skeletonRow, { backgroundColor: colors.border, opacity }]}>
          <View style={[styles.skeletonCircle, { backgroundColor: colors.surfaceAlt }]} />
          <View style={styles.skeletonCopy}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceAlt, width: `${62 + (index % 3) * 8}%` }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceAlt, width: '44%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function EmptyState({ title, message, icon = 'search-outline' }: { title: string; message: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={icon} size={28} color={colors.primary} /></View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stateMessage, { color: colors.muted }]}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name="cloud-offline-outline" size={28} color={colors.danger} /></View>
      <Text style={[styles.stateTitle, { color: colors.text }]}>데이터를 불러오지 못했어요</Text>
      <Text style={[styles.stateMessage, { color: colors.muted }]}>{message}</Text>
      <HapticPressable accessibilityLabel="데이터 다시 시도" accessibilityRole="button" feedback="medium" onPress={onRetry} style={[styles.retry, { backgroundColor: colors.primary }]}>
        <Text style={[styles.retryText, { color: colors.onPrimary }]}>다시 시도</Text>
      </HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonList: { gap: 10, paddingHorizontal: 18, paddingTop: 8 },
  skeletonRow: { height: 88, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonCircle: { width: 42, height: 42, borderRadius: 13 },
  skeletonCopy: { flex: 1, gap: 9 },
  skeletonLine: { height: 12, borderRadius: 8 },
  state: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 10 },
  stateIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stateTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  stateMessage: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retry: { marginTop: 8, minHeight: 44, paddingHorizontal: 22, borderRadius: 14, justifyContent: 'center' },
  retryText: { fontWeight: '800' },
});
