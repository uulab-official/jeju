import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

const sections = [
  {
    title: '이용 설정',
    rows: [
      { label: '화면 테마', value: '시스템·라이트·다크', route: '/settings/theme' },
      { label: '제주 소식 알림', value: '축제·여행 정보와 새 콘텐츠', route: '/settings/notifications' },
      { label: '데이터 상태', value: '공공데이터 갱신·출처 확인', route: '/settings/data-status' },
    ],
  },
  {
    title: '안내',
    rows: [
      { label: '공지사항', value: '업데이트와 서비스 안내', route: '/settings/notices' },
      { label: '자주 묻는 질문', value: '이용 방법과 데이터 안내', route: '/settings/faq' },
    ],
  },
  {
    title: '정보와 지원',
    rows: [
      { label: '개인정보 처리방침', value: '저장 정보 확인', route: '/settings/privacy' },
      { label: '이용약관', value: '서비스 이용 기준', route: '/settings/terms' },
      { label: '앱 정보', value: '버전과 오픈데이터 출처', route: '/settings/about' },
      { label: '지원', value: '오류 신고와 의견 보내기', route: '/settings/support' },
    ],
  },
] as const;

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="설정" />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{section.title}</Text>
            <View style={[styles.group, { borderColor: colors.border }]}>
              {section.rows.map((row, index) => (
                <HapticPressable
                  accessibilityLabel={`${row.label}: ${row.value}`}
                  key={row.route}
                  onPress={() => router.push(row.route)}
                  style={[styles.row, index < section.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <View style={styles.copy}>
                    <Text style={[styles.label, { color: colors.text }]}>{row.label}</Text>
                    <Text style={[styles.value, { color: colors.muted }]}>{row.value}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={colors.muted} />
                </HapticPressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 8, paddingBottom: 40, gap: 28 },
  section: { gap: 9 },
  sectionTitle: { ...typography.label, paddingHorizontal: 2 },
  group: { borderTopWidth: 1, borderBottomWidth: 1 },
  row: { minHeight: 68, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 3 },
  label: { ...typography.subheading, fontSize: 15 },
  value: { ...typography.caption },
});
