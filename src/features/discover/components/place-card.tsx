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
      style={({ pressed }) => [styles.card, compact && styles.compact, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.86 : 1 }]}
    >
      <LinearGradient colors={place.accent} style={[styles.visual, compact && styles.compactVisual]}>
        {place.heroImageUrl ? <Image source={{ uri: place.heroImageUrl }} contentFit="cover" transition={180} cachePolicy="memory-disk" style={StyleSheet.absoluteFill} /> : null}
        {place.heroImageUrl ? <LinearGradient colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.58)']} style={StyleSheet.absoluteFill} /> : null}
        <Ionicons name="location" size={compact ? 25 : 30} color="rgba(255,255,255,0.92)" />
        <Text selectable style={styles.region}>{place.region} · {place.area}</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text selectable numberOfLines={1} style={[styles.name, { color: colors.text }]}>{place.name}</Text>
            <Text selectable style={[styles.category, { color: colors.primaryStrong }]}>{place.categoryLabel}</Text>
          </View>
          <HapticPressable accessibilityLabel={saved ? '저장 취소' : '장소 저장'} feedback="success" hitSlop={8} onPress={save} style={[styles.save, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.primaryStrong} />
          </HapticPressable>
        </View>
        <Text selectable numberOfLines={compact ? 2 : 3} style={[styles.summary, { color: colors.muted }]}>{place.summary}</Text>
        <View style={styles.tags}>{place.tags.slice(0, compact ? 2 : 3).map((tag) => <Text key={tag} style={[styles.tag, { color: colors.muted, backgroundColor: colors.surfaceAlt }]}>#{tag}</Text>)}</View>
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', borderCurve: 'continuous' },
  compact: { width: 238 },
  visual: { height: 118, padding: 16, justifyContent: 'space-between' },
  compactVisual: { height: 104 },
  region: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  body: { padding: 15, gap: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleCopy: { flex: 1, gap: 3 },
  name: { fontSize: 17, fontWeight: '800' },
  category: { fontSize: 11, fontWeight: '800' },
  save: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summary: { fontSize: 13, lineHeight: 19 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11 },
});
