import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePushNotifications } from '@/src/providers/PushNotificationsProvider';

const labels = {
  checking: '알림 상태를 확인하고 있어요',
  disabled: '알림이 꺼져 있어요',
  enabled: '제주 소식 알림을 받고 있어요',
  unsupported: '실제 기기에서 설정할 수 있어요',
  error: '알림 연결을 다시 확인해 주세요',
} as const;

export default function NotificationSettingsScreen() {
  const { colors } = useAppTheme();
  const { state, errorMessage, enable, disable } = usePushNotifications();
  const enabled = state === 'enabled';
  const busy = state === 'checking';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="제주 소식 알림" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.primary }]}>
            <Ionicons name={enabled ? 'notifications' : 'notifications-outline'} size={30} color={colors.onPrimary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{labels[state]}</Text>
          <Text style={[styles.copy, { color: colors.muted }]}>제주의 축제, 계절 여행지, 새 제주어 콘텐츠처럼 꼭 필요한 소식만 보내드릴게요.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>알림 원칙</Text>
          <Text style={[styles.item, { color: colors.muted }]}>• 광고성 알림은 별도 동의 없이 보내지 않아요.</Text>
          <Text style={[styles.item, { color: colors.muted }]}>• 알림 토큰은 메시지 전송 목적으로만 사용해요.</Text>
          <Text style={[styles.item, { color: colors.muted }]}>• 언제든 이 화면에서 수신을 중지할 수 있어요.</Text>
        </View>

        {errorMessage ? <Text style={[styles.error, { color: colors.danger }]}>{errorMessage}</Text> : null}
        <HapticPressable
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
  content: { padding: 18, gap: 14 },
  hero: { borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center' },
  icon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  copy: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  item: { fontSize: 13, lineHeight: 20 },
  error: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  button: { minHeight: 54, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '800' },
  settingsButton: { minHeight: 48, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  settingsButtonText: { fontSize: 13, fontWeight: '700' },
});
