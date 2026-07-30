import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, pretendard, typography } from '@/src/theme/tokens';

const STORAGE_KEY = '@jeju/trip-prep/v1';
const checklist = [
  { id: 'weather', title: '출발 전 기상 확인', body: '강풍·파도·강수에 따라 해안과 선박 일정이 달라질 수 있어요.' },
  { id: 'trail', title: '탐방로 통제 확인', body: '한라산과 오름은 계절·기상·산불 위험에 따라 출입이 제한될 수 있어요.' },
  { id: 'ferry', title: '선박 운항·마지막 배 확인', body: '우도 등 섬 일정은 왕복 운항 시간과 신분증을 미리 확인해요.' },
  { id: 'reservation', title: '예약·운영시간 확인', body: '체험·공연·전시는 휴무일과 예약 조건이 장소마다 달라요.' },
  { id: 'offline', title: '오프라인 준비', body: '통신이 약한 구간을 위해 주소와 비상 연락처를 저장해 두세요.' },
  { id: 'respect', title: '제주를 배려하는 여행', body: '해안·오름·추모 공간의 규칙을 지키고 쓰레기를 되가져가요.' },
] as const;

export default function TripPrepScreen() {
  const { colors } = useAppTheme();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value) as unknown;
        if (parsed && typeof parsed === 'object') setChecked(parsed as Record<string, boolean>);
      } catch { /* Ignore a corrupt local checklist. */ }
    }).catch(() => undefined);
  }, []);
  const completed = useMemo(() => checklist.filter((item) => checked[item.id]).length, [checked]);
  const toggle = (id: string) => setChecked((current) => {
    const next = { ...current, [id]: !current[id] };
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
    return next;
  });
  const reset = () => {
    setChecked({});
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="여행 준비" subtitle="떠나기 전 제주를 배려하는 체크리스트" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={[styles.eyebrow, { color: colors.primaryStrong }]}>여행 전 확인</Text>
          <View style={styles.countRow}>
            <Text style={[styles.count, { color: colors.text }]}>{completed}</Text>
            <Text style={[styles.total, { color: colors.muted }]}> / {checklist.length}</Text>
          </View>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>준비한 만큼 제주를 더 편안하게 만나요</Text>
          <Text style={[styles.summaryBody, { color: colors.muted }]}>날씨와 장소 운영 정보는 출발 직전에 한 번 더 확인해 주세요.</Text>
          <View accessibilityLabel={`${checklist.length}개 중 ${completed}개 완료`} accessibilityRole="progressbar" style={styles.progress}>
            {checklist.map((item) => (
              <View key={item.id} style={[styles.progressSegment, { backgroundColor: checked[item.id] ? colors.primary : colors.border }]} />
            ))}
          </View>
        </View>
        <View style={[styles.list, { borderColor: colors.border }]}>{checklist.map((item, index) => {
          const selected = Boolean(checked[item.id]);
          return <HapticPressable
            key={item.id}
            accessibilityLabel={`${item.title}. ${item.body}`}
            accessibilityState={{ checked: selected }}
            accessibilityRole="checkbox"
            onPress={() => toggle(item.id)}
            feedback="selection"
            style={[styles.row, index < checklist.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.rowNumber, { color: selected ? colors.primaryStrong : colors.muted }]}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: selected ? colors.primaryStrong : colors.text }]}>{item.title}</Text>
              <Text style={[styles.rowBody, { color: colors.muted }]}>{item.body}</Text>
            </View>
            <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={23} color={selected ? colors.primary : colors.muted} />
          </HapticPressable>;
        })}</View>
        <HapticPressable accessibilityLabel="여행 준비 체크리스트 초기화" feedback="light" onPress={reset} style={styles.reset}>
          <Ionicons name="refresh-outline" size={16} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted }]}>모두 다시 확인하기</Text>
        </HapticPressable>
        <Text style={[styles.note, { borderColor: colors.border, color: colors.muted }]}>운영시간·기상·통제 정보는 원문 제공처의 최신 안내가 우선입니다.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 10, paddingBottom: 40 },
  summary: { paddingHorizontal: 2, paddingBottom: 30 },
  eyebrow: { ...typography.label, marginBottom: 8 },
  countRow: { flexDirection: 'row', alignItems: 'baseline' },
  count: { ...pretendard(900), fontSize: 36, lineHeight: 44, letterSpacing: -0.8 },
  total: { ...pretendard(500), fontSize: 18, lineHeight: 25 },
  summaryTitle: { ...pretendard(800), fontSize: 18, lineHeight: 26, marginTop: 8 },
  summaryBody: { ...typography.body, maxWidth: 310, marginTop: 5 },
  progress: { flexDirection: 'row', gap: 5, marginTop: 20 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  list: { borderTopWidth: 1, borderBottomWidth: 1 },
  row: { minHeight: 92, paddingVertical: 15, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowNumber: { ...pretendard(700), width: 22, fontSize: 11, lineHeight: 16 },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { ...pretendard(800), fontSize: 14, lineHeight: 20 },
  rowBody: { ...typography.caption, fontSize: 11, lineHeight: 17 },
  reset: { minHeight: 48, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2, marginTop: 10 },
  resetText: { ...pretendard(700), fontSize: 12, lineHeight: 18 },
  note: { ...typography.caption, fontSize: 11, lineHeight: 17, borderTopWidth: 1, paddingTop: 18, paddingHorizontal: 2, marginTop: 4 },
});
