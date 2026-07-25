import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePushNotifications } from '@/src/providers/PushNotificationsProvider';

export function NotificationListScreen() {
  const { colors } = useAppTheme();
  const { notifications } = usePushNotifications();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader
        back
        title="알림"
        right={(
          <HapticPressable accessibilityLabel="알림 설정" feedback="light" hitSlop={10} onPress={() => router.push('/settings/notifications')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={21} color={colors.text} />
          </HapticPressable>
        )}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {notifications.length ? <View style={styles.list}>{notifications.map((item) => (
          <HapticPressable key={item.id} feedback="light" onPress={() => { if (item.route) router.push(item.route as never); }} style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name="notifications-outline" size={20} color={colors.primaryStrong} /></View>
            <View style={styles.itemCopy}><Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>{item.body ? <Text style={[styles.itemBody, { color: colors.muted }]}>{item.body}</Text> : null}<Text style={[styles.itemDate, { color: colors.muted }]}>{formatDate(item.receivedAt)}</Text></View>
            {item.route ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
          </HapticPressable>
        ))}</View> : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="notifications-outline" size={30} color={colors.primaryStrong} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>아직 도착한 소식이 없어요</Text>
          <Text style={[styles.body, { color: colors.muted }]}>계절 여행지, 제주 축제와 새 문화 콘텐츠를 준비되는 대로 알려드릴게요.</Text>
          <HapticPressable feedback="medium" onPress={() => router.push('/settings/notifications')} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>알림 설정하기</Text>
          </HapticPressable>
        </View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  settingsButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 18, paddingBottom: 34, justifyContent: 'center' },
  list: { gap: 10, justifyContent: 'flex-start' },
  item: { minHeight: 84, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  itemIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 14, fontWeight: '800' },
  itemBody: { fontSize: 13, lineHeight: 19 },
  itemDate: { fontSize: 11, marginTop: 2 },
  empty: { borderWidth: 1, borderRadius: 24, padding: 26, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  body: { maxWidth: 280, fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 9 },
  button: { minHeight: 48, borderRadius: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  buttonText: { fontSize: 14, fontWeight: '800' },
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '받은 시각 확인 불가';
}
