import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useScrollToTop } from 'expo-router';
import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { layout, typography } from '@/src/theme/tokens';

const groups = [
  {
    title: '제주 문화',
    rows: [
      { label: '제주 역사', caption: '탐라에서 4·3과 평화까지', icon: 'time-outline', route: '/history' },
      { label: '제주어 통합 검색', caption: '생활방언·속담·사전·색인어', icon: 'search-outline', route: '/language/search' },
      { label: '제주어 표기법', caption: '제주의 말을 읽고 적는 원칙', icon: 'language-outline', route: '/language/notation' },
    ],
  },
  {
    title: '서비스',
    rows: [
      { label: '알림', caption: '받은 제주 소식 확인', icon: 'notifications-outline', route: '/notifications' },
      { label: '공지사항', caption: '업데이트와 서비스 안내', icon: 'megaphone-outline', route: '/settings/notices' },
      { label: '설정', caption: '알림과 화면 테마', icon: 'settings-outline', route: '/settings' },
      { label: '자주 묻는 질문', caption: '데이터와 이용 방법', icon: 'help-circle-outline', route: '/settings/faq' },
    ],
  },
  {
    title: '서비스 정보',
    rows: [
      { label: '개인정보 처리방침', caption: '수집하는 정보 안내', icon: 'shield-checkmark-outline', route: '/settings/privacy' },
      { label: '이용약관', caption: '서비스 이용 기준', icon: 'document-text-outline', route: '/settings/terms' },
      { label: '앱 정보', caption: '버전과 데이터 출처', icon: 'information-circle-outline', route: '/settings/about' },
      { label: '데이터 상태', caption: '공공데이터 갱신·출처 확인', icon: 'cloud-done-outline', route: '/settings/data-status' },
    ],
  },
] as const;

export default function MoreScreen() {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { refresh, resources } = useJejuData();
  const { places, refreshing: placesRefreshing, refresh: refreshPlaces } = usePlaceData();
  const refreshing = placesRefreshing || Object.values(resources).some((state) => state.refreshing);
  const cultureCount = Object.values(resources).reduce((sum, state) => sum + (state.totalCount || state.items.length), 0);
  const refreshAll = async () => {
    await Promise.all([refresh(), refreshPlaces()]);
  };
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        title="전체"
        right={(
          <HapticPressable accessibilityLabel="설정 열기" feedback="light" onPress={() => router.push('/settings')} style={styles.headerAction}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </HapticPressable>
        )}
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View style={[styles.summary, { borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryEyebrow, { color: colors.primaryStrong }]}>공식 제주 정보</Text>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>여행지 {places.length.toLocaleString()}곳 · 제주어 자료 {cultureCount.toLocaleString()}개</Text>
          <Text style={[styles.summaryText, { color: colors.muted }]}>한국관광공사와 제주특별자치도 공개 자료를 바탕으로 제공합니다.</Text>
        </View>
        {groups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{group.title}</Text>
            <View style={[styles.group, { borderColor: colors.border }]}>
              {group.rows.map((row, index) => (
                <HapticPressable accessibilityLabel={`${row.label}: ${row.caption}`} key={row.route} onPress={() => router.push(row.route)} style={[styles.row, index < group.rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <Ionicons name={row.icon} size={22} color={colors.primaryStrong} />
                  <View style={styles.rowCopy}><Text style={[styles.rowLabel, { color: colors.text }]}>{row.label}</Text><Text style={[styles.rowCaption, { color: colors.muted }]}>{row.caption}</Text></View>
                  <Ionicons name="chevron-forward" size={19} color={colors.muted} />
                </HapticPressable>
              ))}
            </View>
          </View>
        ))}
        <HapticPressable disabled={refreshing} feedback="medium" onPress={() => void refreshAll()} style={[styles.refresh, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Ionicons name="refresh" size={19} color={colors.primaryStrong} /><Text style={[styles.refreshText, { color: colors.text }]}>{refreshing ? '새 데이터를 확인하고 있어요' : '전체 데이터 새로고침'}</Text>
        </HapticPressable>
        <Text style={[styles.source, { color: colors.muted }]}>자료 출처: 한국관광공사 TourAPI · 제주특별자치도 제주어 OpenAPI</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, headerAction: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center' }, content: { padding: layout.screenPadding, paddingBottom: layout.screenBottomPadding }, summary: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 20, marginBottom: 24, gap: 6 }, summaryEyebrow: { ...typography.label }, summaryTitle: { ...typography.heading, fontSize: 21, lineHeight: 29 }, summaryText: { ...typography.body, fontSize: 13, lineHeight: 19 },
  section: { marginBottom: 24 }, sectionTitle: { ...typography.subheading, fontSize: 16, marginBottom: 10 }, group: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth }, row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 13 }, rowCopy: { flex: 1, gap: 3 }, rowLabel: { ...typography.subheading, fontSize: 15 }, rowCaption: { ...typography.caption },
  refresh: { marginTop: 14, minHeight: 52, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, refreshText: { ...typography.body, fontWeight: '700' }, source: { ...typography.caption, textAlign: 'center', fontSize: 11, marginTop: 18 },
});
