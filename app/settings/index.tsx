import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

const rows = [
  { label: '화면 테마', value: '시스템·라이트·다크', icon: 'contrast-outline', route: '/settings/theme' },
  { label: '제주 소식 알림', value: '축제·여행 정보와 새 콘텐츠', icon: 'notifications-outline', route: '/settings/notifications' },
  { label: '데이터 상태', value: '공공데이터 갱신·출처 확인', icon: 'cloud-done-outline', route: '/settings/data-status' },
  { label: '자주 묻는 질문', value: '이용 방법과 데이터 안내', icon: 'help-circle-outline', route: '/settings/faq' },
  { label: '개인정보 처리방침', value: '저장 정보 확인', icon: 'shield-checkmark-outline', route: '/settings/privacy' },
  { label: '이용약관', value: '서비스 이용 기준', icon: 'document-text-outline', route: '/settings/terms' },
  { label: '앱 정보', value: '버전과 오픈데이터 출처', icon: 'information-circle-outline', route: '/settings/about' },
  { label: '지원', value: '오류 신고와 의견 보내기', icon: 'chatbubbles-outline', route: '/settings/support' },
] as const;

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="설정" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rows.map((row, index) => (
            <HapticPressable accessibilityLabel={`${row.label}: ${row.value}`} key={row.route} onPress={() => router.push(row.route)} style={[styles.row, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={row.icon} size={20} color={colors.primaryStrong} /></View>
              <View style={styles.copy}><Text style={[styles.label, { color: colors.text }]}>{row.label}</Text><Text style={[styles.value, { color: colors.muted }]}>{row.value}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </HapticPressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: layout.screenPadding }, group: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' }, row: { minHeight: 76, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 3 }, label: { ...typography.subheading, fontSize: 15 }, value: { ...typography.caption } });
