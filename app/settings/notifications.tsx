import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePushNotifications } from '@/src/providers/PushNotificationsProvider';
import { layout, pretendard, typography } from '@/src/theme/tokens';

const labels = {
  checking: '알림 상태를 확인하고 있어요',
  disabled: '알림이 꺼져 있어요',
  enabled: '제주 소식 알림을 받고 있어요',
  unsupported: '실제 기기에서 설정할 수 있어요',
  error: '알림 연결을 다시 확인해 주세요',
} as const;

const principles = [
  '광고성 알림은 별도 동의 없이 보내지 않아요.',
  '알림 토큰은 메시지 전송 목적으로만 사용해요.',
  '언제든 이 화면에서 수신을 중지할 수 있어요.',
] as const;

export default function NotificationSettingsScreen() {
  const { colors } = useAppTheme();
  const { state, errorMessage, enable, disable } = usePushNotifications();
  const enabled = state === 'enabled';
  const busy = state === 'checking';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="제주 소식 알림" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.status}>
          <Text style={[styles.eyebrow, { color: colors.primaryStrong }]}>알림 상태</Text>
          <Text style={[styles.title, { color: colors.text }]}>{labels[state]}</Text>
          <Text style={[styles.copy, { color: colors.muted }]}>제주의 축제, 계절 여행지, 새 제주어 콘텐츠처럼 꼭 필요한 소식만 보내드릴게요.</Text>
        </View>

        <View style={styles.principles}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>알림을 보내는 기준</Text>
          <View style={[styles.ruleList, { borderColor: colors.border }]}>
            {principles.map((principle, index) => (
              <View key={principle} style={[styles.rule, index < principles.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <Text style={[styles.ruleNumber, { color: colors.primaryStrong }]}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={[styles.ruleText, { color: colors.muted }]}>{principle}</Text>
              </View>
            ))}
          </View>
        </View>

        {errorMessage ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text> : null}
        <HapticPressable
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          feedback={enabled ? 'warning' : 'success'}
          onPress={() => void (enabled ? disable() : enable())}
          style={[styles.button, { backgroundColor: enabled ? colors.surface : colors.primary, borderColor: enabled ? colors.border : colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: enabled ? colors.text : colors.onPrimary }]}>{enabled ? '알림 끄기' : '알림 받기'}</Text>
        </HapticPressable>
        {(state === 'disabled' || state === 'error') && errorMessage ? (
          <HapticPressable feedback="light" onPress={() => void Linking.openSettings()} style={[styles.settingsButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="settings-outline" size={17} color={colors.primaryStrong} />
            <Text style={[styles.settingsButtonText, { color: colors.text }]}>기기 설정에서 알림 확인</Text>
          </HapticPressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: 14, paddingBottom: 40 },
  status: { paddingHorizontal: 2, paddingBottom: 30 },
  eyebrow: { ...typography.label, marginBottom: 10 },
  title: { ...pretendard(800), fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  copy: { ...typography.body, maxWidth: 310, marginTop: 9 },
  principles: { gap: 12, marginBottom: 28 },
  sectionTitle: { ...typography.subheading, paddingHorizontal: 2 },
  ruleList: { borderTopWidth: 1, borderBottomWidth: 1 },
  rule: { minHeight: 58, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleNumber: { ...pretendard(700), width: 22, fontSize: 11, lineHeight: 16 },
  ruleText: { ...typography.body, flex: 1, fontSize: 13, lineHeight: 20 },
  error: { ...typography.body, fontSize: 13, lineHeight: 20, marginBottom: 12, paddingHorizontal: 2 },
  button: { minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...pretendard(800), fontSize: 14, lineHeight: 20 },
  settingsButton: { minHeight: 48, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  settingsButtonText: { ...pretendard(700), fontSize: 13, lineHeight: 19 },
});
