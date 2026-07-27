import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { getJejuHistoryChapter } from '@/src/data/jeju-history';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export function HistoryDetailScreen({ id }: { id: string }) {
  const { colors } = useAppTheme();
  const chapter = getJejuHistoryChapter(id);
  if (!chapter) return <View style={[styles.screen, { backgroundColor: colors.background }]}><AppHeader back title="제주 역사" /><View style={styles.notFound}><Text style={{ color: colors.text }}>역사 이야기를 찾을 수 없어요.</Text><HapticPressable onPress={() => router.back()}><Text style={{ color: colors.primaryStrong }}>돌아가기</Text></HapticPressable></View></View>;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="제주 역사" right={<HapticPressable accessibilityLabel="제주 역사 이야기 공유" feedback="light" onPress={() => void Share.share({ title: chapter.title, message: `${chapter.title}\n\n${chapter.summary}\n\n소랑제주` })} style={styles.shareButton}><Ionicons name="share-outline" size={21} color={colors.text} /></HapticPressable>} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={chapter.accent} style={styles.hero}>
          <View style={styles.icon}><Ionicons name={chapter.icon as never} size={28} color="#FFFFFF" /></View>
          <Text style={styles.period}>{chapter.period}</Text>
          <Text selectable style={styles.title}>{chapter.title}</Text>
          <Text selectable style={styles.summary}>{chapter.summary}</Text>
        </LinearGradient>

        <View style={styles.story}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>이 시대의 제주</Text>
          {chapter.paragraphs.map((paragraph) => <Text selectable key={paragraph} style={[styles.paragraph, { color: colors.text }]}>{paragraph}</Text>)}
        </View>

        {chapter.remembrance ? <View style={[styles.remembrance, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}><Ionicons name="flower-outline" size={23} color={colors.primaryStrong} /><View style={styles.flex}><Text selectable style={[styles.remembranceTitle, { color: colors.text }]}>기억 공간을 방문할 때</Text><Text selectable style={[styles.remembranceText, { color: colors.muted }]}>{chapter.remembrance}</Text></View></View> : null}

        {chapter.place ? <View style={styles.section}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>지금 만나는 역사 장소</Text>
          <HapticPressable feedback="medium" onPress={() => void Linking.openURL(chapter.place!.url)} style={[styles.placeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.placeIcon, { backgroundColor: `${chapter.accent[0]}20` }]}><Ionicons name="location-outline" size={24} color={chapter.accent[0]} /></View>
            <View style={styles.flex}><Text selectable style={[styles.placeName, { color: colors.text }]}>{chapter.place.name}</Text><Text selectable style={[styles.address, { color: colors.primaryStrong }]}>{chapter.place.address}</Text><Text selectable style={[styles.placeNote, { color: colors.muted }]}>{chapter.place.note}</Text></View>
            <Ionicons name="open-outline" size={18} color={colors.muted} />
          </HapticPressable>
        </View> : null}

        <HapticPressable feedback="light" onPress={() => void Linking.openURL(chapter.sourceUrl)} style={[styles.source, { borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={21} color={colors.primaryStrong} />
          <View style={styles.flex}><Text selectable style={[styles.sourceLabel, { color: colors.muted }]}>공식 자료에서 더 알아보기</Text><Text selectable style={[styles.sourceName, { color: colors.text }]}>{chapter.sourceName}</Text></View>
          <Ionicons name="open-outline" size={17} color={colors.muted} />
        </HapticPressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 42, gap: 22 }, flex: { flex: 1 }, shareButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 285, borderRadius: 28, padding: 23, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' }, icon: { position: 'absolute', top: 22, right: 22, width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, period: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '900' }, title: { color: '#FFFFFF', fontFamily: 'NanumOld', fontSize: 30, lineHeight: 40, paddingTop: 7 }, summary: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 21, paddingTop: 8 },
  story: { gap: 12 }, section: { gap: 10 }, sectionTitle: { fontSize: 21, fontWeight: '900' }, paragraph: { fontSize: 15, lineHeight: 25 },
  remembrance: { borderWidth: 1, borderRadius: 20, padding: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, remembranceTitle: { fontSize: 15, fontWeight: '900' }, remembranceText: { fontSize: 12, lineHeight: 20, paddingTop: 5 },
  placeCard: { borderWidth: 1, borderRadius: 21, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, placeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, placeName: { fontSize: 16, fontWeight: '900' }, address: { fontSize: 11, fontWeight: '800', paddingTop: 3 }, placeNote: { fontSize: 11, lineHeight: 17, paddingTop: 6 },
  source: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 }, sourceLabel: { fontSize: 10 }, sourceName: { fontSize: 13, fontWeight: '800', paddingTop: 2 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
