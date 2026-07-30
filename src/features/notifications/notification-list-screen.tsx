import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePushNotifications } from '@/src/providers/PushNotificationsProvider';
import { layout, pretendard, typography } from '@/src/theme/tokens';

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
        {notifications.length ? <View style={[styles.list, { borderColor: colors.border }]}>{notifications.map((item) => (
          <HapticPressable
            accessibilityLabel={item.route ? `${item.title} 열기` : item.title}
            accessibilityRole={item.route ? 'button' : 'text'}
            disabled={!item.route}
            key={item.id}
            feedback="light"
            onPress={() => { if (item.route) router.push(item.route as never); }}
            style={[styles.item, { borderColor: colors.border }]}
          >
            <View style={styles.itemCopy}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
              {item.body ? <Text style={[styles.itemBody, { color: colors.muted }]}>{item.body}</Text> : null}
              <Text style={[styles.itemDate, { color: colors.muted }]}>{formatDate(item.receivedAt)}</Text>
            </View>
            {item.route ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
          </HapticPressable>
        ))}</View> : <View style={styles.empty}>
          <Text style={[styles.eyebrow, { color: colors.primaryStrong }]}>알림함</Text>
          <Text style={[styles.title, { color: colors.text }]}>새 소식은 이곳에 모여요</Text>
          <Text style={[styles.body, { color: colors.muted }]}>계절 여행지, 제주 축제와 새로운 문화 콘텐츠 소식을 전해드릴게요.</Text>
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
  content: { flexGrow: 1, paddingHorizontal: layout.screenPadding, paddingTop: 14, paddingBottom: 40 },
  list: { borderTopWidth: 1 },
  item: { minHeight: 88, borderBottomWidth: 1, paddingVertical: 15, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemCopy: { flex: 1, gap: 4 },
  itemTitle: { ...typography.subheading },
  itemBody: { ...typography.body, fontSize: 13, lineHeight: 20 },
  itemDate: { ...typography.caption, fontSize: 11, marginTop: 2 },
  empty: { paddingTop: 62, paddingHorizontal: 2, alignItems: 'flex-start' },
  eyebrow: { ...typography.label, marginBottom: 12 },
  title: { ...pretendard(800), fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  body: { maxWidth: 300, ...typography.body, marginTop: 10 },
  button: { minHeight: 46, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { ...pretendard(700), fontSize: 14, lineHeight: 20 },
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : '받은 시각 확인 불가';
}
