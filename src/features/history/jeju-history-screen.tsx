import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { jejuHistoryChapters } from '@/src/data/jeju-history';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { pretendard } from '@/src/theme/tokens';

export function JejuHistoryScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="제주 역사" subtitle="장소와 함께 읽는 섬의 시간" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderBottomColor: colors.border }]}>
          <Text style={[styles.heroEyebrow, { color: colors.primaryStrong }]}>탐라에서 평화의 섬까지</Text>
          <Text selectable style={[styles.heroTitle, { color: colors.text }]}>풍경 아래 쌓인{`\n`}제주의 시간</Text>
          <Text selectable style={[styles.heroText, { color: colors.muted }]}>공식 박물관과 기관 자료를 바탕으로 시대의 흐름과 지금 가볼 장소를 함께 정리했습니다.</Text>
        </View>

        <View style={styles.heading}>
          <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>제주의 시간선</Text>
          <Text selectable style={[styles.sectionCaption, { color: colors.muted }]}>시대를 누르면 이야기와 공식 출처를 볼 수 있습니다.</Text>
        </View>
        <View style={styles.timeline}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          {jejuHistoryChapters.map((chapter) => (
            <View key={chapter.id} style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: chapter.accent[0], borderColor: colors.background }]} />
              <HapticPressable
                feedback="selection"
                onPress={() => router.push({ pathname: '/history/[id]', params: { id: chapter.id } })}
                style={[styles.card, { borderBottomColor: colors.border }]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.period, { color: chapter.accent[0] }]}>{chapter.period}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
                <Text selectable style={[styles.cardTitle, { color: colors.text }]}>{chapter.title}</Text>
                <Text selectable style={[styles.cardSummary, { color: colors.muted }]}>{chapter.summary}</Text>
              </HapticPressable>
            </View>
          ))}
        </View>
        <View style={[styles.sourceNote, { borderColor: colors.border }]}>
          <Text selectable style={[styles.sourceNoteTitle, { color: colors.text }]}>자료 기준</Text>
          <Text selectable style={[styles.sourceNoteText, { color: colors.muted }]}>국립제주박물관, 국가유산포털, 제주4·3평화재단의 공식 자료를 기준으로 정리하고 각 이야기에서 원문을 연결합니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 42, gap: 26 },
  hero: { paddingTop: 18, paddingBottom: 24, borderBottomWidth: StyleSheet.hairlineWidth, gap: 9 },
  heroEyebrow: { ...pretendard(900), fontSize: 12 },
  heroTitle: { fontFamily: 'NanumOld', fontSize: 33, lineHeight: 43 },
  heroText: { ...pretendard(400), fontSize: 14, lineHeight: 22, maxWidth: 320 },
  heading: { gap: 4 },
  sectionTitle: { ...pretendard(900), fontSize: 21 },
  sectionCaption: { ...pretendard(400), fontSize: 12, lineHeight: 18 },
  timeline: { position: 'relative' },
  line: { position: 'absolute', width: 1, left: 6, top: 18, bottom: 18 },
  timelineRow: { paddingLeft: 25, position: 'relative' },
  dot: { position: 'absolute', left: 1, top: 30, width: 11, height: 11, borderRadius: 6, borderWidth: 3, zIndex: 1 },
  card: { minHeight: 136, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  period: { ...pretendard(900), flex: 1, fontSize: 11 },
  cardTitle: { fontFamily: 'NanumOld', fontSize: 22, lineHeight: 30, paddingTop: 12 },
  cardSummary: { ...pretendard(400), fontSize: 13, lineHeight: 20, paddingTop: 6 },
  sourceNote: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 6 },
  sourceNoteTitle: { ...pretendard(800), fontSize: 14 },
  sourceNoteText: { ...pretendard(400), fontSize: 11, lineHeight: 17 },
});
