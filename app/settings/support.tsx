import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

const SUPPORT_URL = 'https://uulab.co.kr';
const SUPPORT_EMAIL = 'uulab.official@gmail.com';

export default function SupportScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="지원" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.primary }]}><Ionicons name="chatbubbles-outline" size={28} color={colors.onPrimary} /></View>
          <Text style={[styles.title, { color: colors.text }]}>소랑제주가 더 좋아지도록 알려주세요</Text>
          <Text style={[styles.body, { color: colors.muted }]}>오류, 출처 정정, 접근성 의견은 UULab 웹사이트에서 보내주시면 확인하겠습니다.</Text>
          <HapticPressable accessibilityLabel="UULab 지원 웹사이트 열기" feedback="medium" onPress={() => void Linking.openURL(SUPPORT_URL)} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>지원 웹사이트 열기</Text>
            <Ionicons name="open-outline" size={17} color={colors.onPrimary} />
          </HapticPressable>
          <HapticPressable
            accessibilityLabel="소랑제주 지원 이메일 보내기"
            feedback="light"
            onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[소랑제주] 문의')}`)}
            style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Ionicons name="mail-outline" size={17} color={colors.primaryStrong} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>이메일 문의</Text>
          </HapticPressable>
        </View>
        <Text selectable style={[styles.note, { color: colors.muted }]}>문의: {SUPPORT_EMAIL}{`\n`}출처 정정 요청에는 장소명과 확인 가능한 공식 링크를 함께 적어 주세요.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 18, gap: 14 }, card: { borderWidth: 1, borderRadius: 23, padding: 24, alignItems: 'center' }, icon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 17 }, title: { fontSize: 19, fontWeight: '800', textAlign: 'center' }, body: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 9 }, button: { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 21 }, buttonText: { fontSize: 14, fontWeight: '800' }, secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }, secondaryButtonText: { fontSize: 13, fontWeight: '800' }, note: { paddingHorizontal: 3, fontSize: 12, lineHeight: 19 } });
