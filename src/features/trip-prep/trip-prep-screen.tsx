import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const STORAGE_KEY = '@jeju/trip-prep/v1';
const checklist = [
  { id: 'weather', title: '출발 전 기상 확인', body: '강풍·파도·강수에 따라 해안과 선박 일정이 달라질 수 있어요.', icon: 'partly-sunny-outline' },
  { id: 'trail', title: '탐방로 통제 확인', body: '한라산과 오름은 계절·기상·산불 위험에 따라 출입이 제한될 수 있어요.', icon: 'walk-outline' },
  { id: 'ferry', title: '선박 운항·마지막 배 확인', body: '우도 등 섬 일정은 왕복 운항 시간과 신분증을 미리 확인해요.', icon: 'boat-outline' },
  { id: 'reservation', title: '예약·운영시간 확인', body: '체험·공연·전시는 휴무일과 예약 조건이 장소마다 달라요.', icon: 'calendar-outline' },
  { id: 'offline', title: '오프라인 준비', body: '통신이 약한 구간을 위해 주소와 비상 연락처를 저장해 두세요.', icon: 'download-outline' },
  { id: 'respect', title: '제주를 배려하는 여행', body: '해안·오름·추모 공간의 규칙을 지키고 쓰레기를 되가져가요.', icon: 'heart-outline' },
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
        <View style={[styles.hero, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}><Ionicons name="briefcase-outline" size={27} color={colors.onPrimary} /></View>
          <View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: colors.text }]}>여행 전 {completed}/{checklist.length}개 확인</Text><Text style={[styles.heroBody, { color: colors.muted }]}>제주의 날씨와 장소 운영 정보를 출발 직전에 다시 확인하면 여행이 더 안전하고 편안해요.</Text></View>
        </View>
        <View style={styles.list}>{checklist.map((item) => {
          const selected = Boolean(checked[item.id]);
          return <HapticPressable key={item.id} accessibilityState={{ checked: selected }} accessibilityRole="checkbox" onPress={() => toggle(item.id)} feedback="selection" style={[styles.row, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: selected ? colors.primary : colors.surfaceAlt }]}><Ionicons name={selected ? 'checkmark' : item.icon} size={20} color={selected ? colors.onPrimary : colors.primaryStrong} /></View>
            <View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text><Text style={[styles.rowBody, { color: colors.muted }]}>{item.body}</Text></View>
            <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={23} color={selected ? colors.primary : colors.muted} />
          </HapticPressable>;
        })}</View>
        <HapticPressable accessibilityLabel="여행 준비 체크리스트 초기화" feedback="light" onPress={reset} style={[styles.reset, { borderColor: colors.border }]}><Ionicons name="refresh-outline" size={16} color={colors.muted} /><Text style={[styles.resetText, { color: colors.muted }]}>체크리스트 초기화</Text></HapticPressable>
        <Text style={[styles.note, { color: colors.muted }]}>운영시간·기상·통제 정보는 원문 제공처의 최신 안내가 우선입니다.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { padding: 18, paddingBottom: 38, gap: 14 },
  hero: { borderWidth: 1, borderRadius: 23, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 13 }, heroIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, heroCopy: { flex: 1, gap: 5 }, heroTitle: { fontSize: 17, fontWeight: '900' }, heroBody: { fontSize: 12, lineHeight: 19 },
  list: { gap: 10 }, row: { minHeight: 82, borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, rowIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1, gap: 3 }, rowTitle: { fontSize: 14, fontWeight: '900' }, rowBody: { fontSize: 11, lineHeight: 17 }, reset: { minHeight: 44, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, resetText: { fontSize: 12, fontWeight: '700' }, note: { fontSize: 11, lineHeight: 17, paddingHorizontal: 2 },
});
