import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { jejuHistoryChapters } from '@/src/data/jeju-history';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export function JejuHistoryScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="제주 역사" subtitle="장소와 함께 읽는 섬의 시간" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#E39A62', '#9B5035', '#522E28']} style={styles.hero}>
          <Ionicons name="time-outline" size={30} color="#FFF4E8" />
          <Text style={styles.heroEyebrow}>탐라에서 평화의 섬까지</Text>
          <Text selectable style={styles.heroTitle}>풍경 아래 쌓인{`\n`}제주의 시간을 만나요</Text>
          <Text selectable style={styles.heroText}>공식 박물관과 기관의 자료를 바탕으로 시대의 흐름과 지금 가볼 장소를 함께 정리했어요.</Text>
        </LinearGradient>

        <View style={styles.heading}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>제주의 시간선</Text>
          <Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>짧은 요약을 누르면 이야기와 공식 출처를 볼 수 있어요.</Text>
        </View>
        <View style={styles.timeline}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          {jejuHistoryChapters.map((chapter) => (
            <View key={chapter.id} style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: chapter.accent[0], borderColor: colors.background }]} />
              <HapticPressable
                feedback="selection"
                onPress={() => router.push({ pathname: '/history/[id]', params: { id: chapter.id } })}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.icon, { backgroundColor: `${chapter.accent[0]}20` }]}><Ionicons name={chapter.icon as never} size={21} color={chapter.accent[0]} /></View>
                  <Text style={[styles.period, { color: chapter.accent[0] }]}>{chapter.period}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
                <Text selectable style={[styles.cardTitle, { color: colors.text }]}>{chapter.title}</Text>
                <Text selectable style={[styles.cardSummary, { color: colors.muted }]}>{chapter.summary}</Text>
              </HapticPressable>
            </View>
          ))}
        </View>
        <View style={[styles.sourceNote, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryStrong} />
          <Text selectable style={[styles.sourceNoteText, { color: colors.muted }]}>역사 설명은 국립제주박물관, 국가유산포털, 제주4·3평화재단의 공식 자료를 기준으로 정리하고 각 이야기에서 원문을 연결합니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 42, gap: 20 },
  hero: { minHeight: 290, borderRadius: 28, padding: 24, justifyContent: 'flex-end', overflow: 'hidden', borderCurve: 'continuous' }, heroEyebrow: { color: 'rgba(255,244,232,0.82)', fontSize: 12, fontWeight: '900', paddingTop: 16 }, heroTitle: { color: '#FFF8F1', fontFamily: 'NanumOld', fontSize: 29, lineHeight: 39, paddingTop: 7 }, heroText: { color: 'rgba(255,248,241,0.84)', fontSize: 13, lineHeight: 20, paddingTop: 10, maxWidth: 310 },
  heading: { gap: 4, paddingTop: 4 }, sectionTitle: { fontSize: 21, fontWeight: '900' }, sectionCaption: { fontSize: 12, lineHeight: 18 },
  timeline: { gap: 13, position: 'relative' }, line: { position: 'absolute', width: 2, left: 10, top: 14, bottom: 14 }, timelineRow: { paddingLeft: 30, position: 'relative' }, dot: { position: 'absolute', left: 3, top: 25, width: 16, height: 16, borderRadius: 8, borderWidth: 4, zIndex: 1 },
  card: { borderWidth: 1, borderRadius: 22, padding: 17, minHeight: 158, borderCurve: 'continuous' }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, period: { flex: 1, fontSize: 11, fontWeight: '900' }, cardTitle: { fontFamily: 'NanumOld', fontSize: 21, paddingTop: 14 }, cardSummary: { fontSize: 12, lineHeight: 19, paddingTop: 7 },
  sourceNote: { borderRadius: 19, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, sourceNoteText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
