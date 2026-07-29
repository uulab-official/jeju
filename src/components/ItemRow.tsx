import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useFavorites } from '@/src/providers/FavoritesProvider';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { JejuItem, resourceMeta } from '@/src/types/jeju';
import { radius, typography } from '@/src/theme/tokens';

export function ItemRow({ item, showKind = false }: { item: JejuItem; showKind?: boolean }) {
  const { colors } = useAppTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(item.kind, item.id);

  return (
    <HapticPressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/detail/[kind]/[id]', params: { kind: item.kind, id: item.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.border },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={resourceMeta[item.kind].icon} size={21} color={colors.primaryStrong} />
      </View>
      <View style={styles.copy}>
        {showKind ? <Text style={[styles.kind, { color: colors.primaryStrong }]}>{resourceMeta[item.kind].shortLabel}</Text> : null}
        <Text numberOfLines={2} style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        {item.subtitle || item.body ? (
          <Text numberOfLines={2} style={[styles.subtitle, { color: colors.muted }]}>{item.subtitle || item.body}</Text>
        ) : null}
      </View>
      <HapticPressable
        accessibilityLabel={saved ? '저장 해제' : '저장'}
        hitSlop={10}
        onPress={(event) => {
          event.stopPropagation();
          toggleFavorite(item.kind, item.id);
        }}
        feedback="success"
        style={styles.save}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={saved ? colors.primary : colors.muted} />
      </HapticPressable>
      <Ionicons name="chevron-forward" size={19} color={colors.muted} />
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 92, borderRadius: radius.md, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  kind: { fontSize: 11, fontWeight: '700' },
  title: { ...typography.subheading, lineHeight: 22, fontFamily: 'NanumOld' },
  subtitle: typography.body,
  save: { padding: 6 },
});
