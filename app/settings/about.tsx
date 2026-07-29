import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const config = Constants.expoConfig;
  const nativeIdentifier = Platform.select({
    ios: config?.ios?.bundleIdentifier,
    android: config?.android?.package,
    default: undefined,
  }) ?? 'kr.co.uulab.jeju';
  const nativeBuild = Platform.select({
    ios: config?.ios?.buildNumber,
    android: config?.android?.versionCode ? String(config.android.versionCode) : undefined,
    default: undefined,
  }) ?? '-';
  const rows = [
    ['앱 버전', config?.version ?? '1.0.0'],
    ['빌드 번호', nativeBuild],
    ['런타임', String(config?.runtimeVersion ?? config?.version ?? '-')],
    ['업데이트 채널', Updates.channel ?? (__DEV__ ? 'development' : 'embedded')],
    ['앱 식별자', nativeIdentifier],
  ];
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="앱 정보" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>소랑제주</Text>
          <Text style={[styles.body, { color: colors.muted }]}>제주의 여행지와 문화, 지도, 제주어를 한곳에서 발견하고 나만의 제주를 저장하는 앱입니다.</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rows.map(([label, value], index) => <View key={label} style={[styles.row, index < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}><Text style={[styles.rowLabel, { color: colors.muted }]}>{label}</Text><Text selectable style={[styles.rowValue, { color: colors.text }]}>{value}</Text></View>)}
        </View>
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Text style={[styles.sourceTitle, { color: colors.text }]}>데이터 출처</Text><Text style={[styles.body, { color: colors.muted }]}>관광 정보는 한국관광공사 TourAPI의 공개 자료를 사용하고 장소별 원문 출처를 표시합니다. 제주어는 제주특별자치도 제주어 OpenAPI를 사용하며, 후기는 외부 서비스에서 복제하지 않습니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 18, gap: 14 }, card: { borderWidth: 1, borderRadius: 20, padding: 18 }, title: { fontFamily: 'NanumOld', fontSize: 25, marginBottom: 10 }, body: { fontSize: 14, lineHeight: 23 }, row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }, rowLabel: { fontSize: 13 }, rowValue: { fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' }, sourceTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 } });
