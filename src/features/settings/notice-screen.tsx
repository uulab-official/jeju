import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

const notices = [
  {
    id: 'launch-1.0.0',
    date: '2026.07.29',
    title: '소랑제주 1.0.0 출시 안내',
    body: '여행지, 지도, 테마 가이드, 제주 역사와 제주어 자료를 한곳에서 만날 수 있어요. 공식 공공데이터를 기준으로 정보를 꾸준히 갱신하겠습니다.',
  },
  {
    id: 'data-source',
    date: '2026.07.29',
    title: '관광·문화 정보 이용 안내',
    body: '관광 정보는 한국관광공사 TourAPI, 제주어 자료는 제주특별자치도 OpenAPI를 기준으로 제공합니다. 방문 전 운영시간과 현장 상황은 장소별 공식 출처를 함께 확인해 주세요.',
  },
] as const;

export default function NoticeScreen() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="공지사항" subtitle="소랑제주의 새로운 소식" />
      <ScrollView contentContainerStyle={styles.content}>
        {notices.map((notice) => (
          <View key={notice.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.heading}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="megaphone-outline" size={19} color={colors.primaryStrong} />
              </View>
              <View style={styles.headingCopy}>
                <Text selectable style={[styles.title, { color: colors.text }]}>{notice.title}</Text>
                <Text style={[styles.date, { color: colors.muted }]}>{notice.date}</Text>
              </View>
            </View>
            <Text selectable style={[styles.body, { color: colors.muted }]}>{notice.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: layout.screenPadding, paddingBottom: layout.screenBottomPadding, gap: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  title: { ...typography.subheading, fontSize: 15 },
  date: { ...typography.caption, fontSize: 11 },
  body: { ...typography.body, lineHeight: 22 },
});
