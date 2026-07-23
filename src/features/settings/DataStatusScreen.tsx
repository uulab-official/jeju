import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { resourceKinds, resourceMeta, ResourceKind } from '@/src/types/jeju';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';

const placeSourceLabel = { bundled: '앱 기본 정보', cache: '기기에 저장된 정보', remote: '공식 데이터' } as const;

export default function DataStatusScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { places, source, lastUpdatedAt, refreshing: placesRefreshing, error: placesError, refresh: refreshPlaces } = usePlaceData();
  const { resources, refresh: refreshResources } = useJejuData();
  const [refreshing, setRefreshing] = useState(false);

  const resourceCount = useMemo(() => resourceKinds.reduce((sum, kind) => sum + (resources[kind].totalCount || resources[kind].items.length), 0), [resources]);
  const refresh = async () => {
    if (refreshing || placesRefreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([refreshPlaces(), refreshResources()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="데이터 상태" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={[styles.hero, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="cloud-done-outline" size={28} color={colors.onPrimary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>공공데이터 연결 상태</Text>
            <Text style={[styles.heroBody, { color: colors.muted }]}>한국관광공사 TourAPI와 제주어 OpenAPI의 현재 표시 상태를 확인해요.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View style={styles.headingCopy}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>여행지·지도</Text>
              <Text style={[styles.cardBody, { color: colors.muted }]}>{places.length.toLocaleString('ko-KR')}곳이 표시되고 있어요.</Text>
            </View>
            <StatusPill label={placeSourceLabel[source]} color={source === 'remote' ? colors.success : colors.primaryStrong} background={colors.surfaceAlt} />
          </View>
          {lastUpdatedAt ? <Text style={[styles.meta, { color: colors.muted }]}>마지막 수집 시각 · {formatDate(lastUpdatedAt)}</Text> : null}
          {placesError ? <Text style={[styles.error, { color: colors.danger }]}>{placesError}</Text> : <Text style={[styles.meta, { color: colors.muted }]}>네트워크가 불안정하면 저장된 정보를 먼저 보여드려요.</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View style={styles.headingCopy}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>제주어 자료</Text>
              <Text style={[styles.cardBody, { color: colors.muted }]}>{resourceCount.toLocaleString('ko-KR')}개 항목을 준비했어요.</Text>
            </View>
            <StatusPill label="제주특별자치도 OpenAPI" color={colors.primaryStrong} background={colors.surfaceAlt} />
          </View>
          <View style={styles.resourceList}>
            {resourceKinds.map((kind) => <ResourceRow key={kind} kind={kind} colors={colors} state={resources[kind]} />)}
          </View>
        </View>

        <HapticPressable accessibilityLabel="데이터 다시 확인" disabled={refreshing || placesRefreshing} feedback="medium" onPress={() => void refresh()} style={[styles.button, { backgroundColor: colors.primary, opacity: refreshing || placesRefreshing ? 0.6 : 1 }]}>
          <Ionicons name="refresh-outline" size={19} color={colors.onPrimary} />
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{refreshing || placesRefreshing ? '확인 중…' : '데이터 다시 확인'}</Text>
        </HapticPressable>

        <Text style={[styles.footnote, { color: colors.muted }]}>표시되는 장소의 상세 화면에서 원문 출처와 이용 조건을 확인할 수 있어요.</Text>
      </ScrollView>
    </View>
  );
}

function StatusPill({ label, color, background }: { label: string; color: string; background: string }) {
  return <View style={[styles.pill, { backgroundColor: background }]}><Text numberOfLines={1} style={[styles.pillText, { color }]}>{label}</Text></View>;
}

function ResourceRow({ kind, colors, state }: { kind: ResourceKind; colors: ReturnType<typeof useAppTheme>['colors']; state: { items: unknown[]; loading: boolean; error?: string; fromCache: boolean; totalCount: number } }) {
  const status = state.loading ? '확인 중' : state.error ? '최근 자료 유지' : state.fromCache ? '저장된 자료' : '최신 확인';
  const statusColor = state.error ? colors.danger : state.fromCache ? colors.primaryStrong : colors.success;
  return (
    <View style={[styles.resourceRow, { borderTopColor: colors.border }]}>
      <View style={[styles.resourceIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name={resourceMeta[kind].icon} size={18} color={colors.primaryStrong} /></View>
      <View style={styles.resourceCopy}><Text style={[styles.resourceLabel, { color: colors.text }]}>{resourceMeta[kind].label}</Text><Text style={[styles.resourceCount, { color: colors.muted }]}>{(state.totalCount || state.items.length).toLocaleString('ko-KR')}개 · 화면 {state.items.length}개</Text></View>
      <Text style={[styles.resourceStatus, { color: statusColor }]}>{status}</Text>
    </View>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '확인 불가';
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, gap: 14 },
  hero: { borderWidth: 1, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 },
  heroIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, gap: 5 },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  heroBody: { fontSize: 13, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardBody: { fontSize: 13 },
  pill: { maxWidth: 150, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 10, fontWeight: '800' },
  meta: { fontSize: 12, lineHeight: 18 },
  error: { fontSize: 12, lineHeight: 18 },
  resourceList: { marginTop: 2 },
  resourceRow: { minHeight: 55, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resourceIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  resourceCopy: { flex: 1, gap: 2 },
  resourceLabel: { fontSize: 13, fontWeight: '700' },
  resourceCount: { fontSize: 11 },
  resourceStatus: { fontSize: 11, fontWeight: '700' },
  button: { minHeight: 52, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '800' },
  footnote: { paddingHorizontal: 3, fontSize: 11, lineHeight: 17 },
});
