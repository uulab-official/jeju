import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/src/components/ContentState';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useAppTheme } from '@/src/providers/AppThemeProvider';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <EmptyState icon="map-outline" title="페이지를 찾지 못했어요" message="요청한 주소가 바뀌었거나 더 이상 존재하지 않아요." />
      <HapticPressable feedback="medium" onPress={() => router.replace('/')} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.onPrimary }]}>홈으로 돌아가기</Text></HapticPressable>
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, padding: 24, justifyContent: 'center' }, button: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontWeight: '800' } });
