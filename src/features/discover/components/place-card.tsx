import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { GestureResponderEvent, StyleSheet, Text, View } from 'react-native';

import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useSavedPlaces } from '@/src/providers/SavedPlacesProvider';
import { JejuPlace } from '@/src/types/place';

export function PlaceCard({ place, compact = false }: { place: JejuPlace; compact?: boolean }) {
  const { colors } = useAppTheme();
  const { isSaved, toggleSaved } = useSavedPlaces();
  const saved = isSaved(place.id);
  const save = (event: GestureResponderEvent) => {
    event.stopPropagation();
    toggleSaved(place.id);
  };

  return (
    <HapticPressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compact : styles.regular,
        { borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <LinearGradient colors={place.accent} style={[styles.visual, compact && styles.compactVisual]}>
        {place.heroImageUrl ? <Image source={{ uri: place.heroImageUrl }} contentFit="cover" transition={180} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} /> : null}
        {place.heroImageUrl ? <LinearGradient colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.58)']} style={StyleSheet.absoluteFill} /> : null}
        <Text selectable style={styles.region}>{place.region} · {place.area}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text selectable style={[styles.category, { color: colors.primaryStrong }]}>{place.categoryLabel}</Text>
            <Text selectable numberOfLines={1} style={[styles.name, { color: colors.text }]}>{place.name}</Text>
          </View>
          <HapticPressable accessibilityLabel={saved ? '저장 취소' : '장소 저장'} feedback="success" hitSlop={8} onPress={save} style={styles.save}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primaryStrong} />
          </HapticPressable>
        </View>
        <Text selectable numberOfLines={compact ? 2 : 3} style={[styles.summary, { color: colors.muted }]}>{place.summary}</Text>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  regular: { minHeight: 132, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 14 },
  compact: { width: 220 },
  visual: { width: 112, minHeight: 112, borderRadius: 12, padding: 10, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' },
  compactVisual: { width: 220, height: 122 },
  region: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  body: { flex: 1, paddingTop: 9, gap: 7 },
  titleRow: { minHeight: 42, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  titleCopy: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '800' },
  category: { fontSize: 11, fontWeight: '800' },
  save: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  summary: { fontSize: 13, lineHeight: 19 },
});
