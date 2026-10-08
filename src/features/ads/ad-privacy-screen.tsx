import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { showMobileAdsPrivacyOptions } from '@/src/features/ads/mobile-ads';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { layout, typography } from '@/src/theme/tokens';

export default function AdPrivacyScreen() {
  const { colors } = useAppTheme();
  const [message, setMessage] = useState('광고 동의가 필요한 지역에서는 여기에서 선택을 다시 확인할 수 있습니다.');
  const [loading, setLoading] = useState(false);

  const openOptions = async () => {
    if (loading) return;
    setLoading(true);
    const result = await showMobileAdsPrivacyOptions();
    setMessage(result === 'shown'
      ? '광고 개인정보 선택을 반영했습니다.'
      : result === 'not-required'
        ? '현재 지역에서는 별도의 광고 개인정보 선택 화면이 필요하지 않습니다.'
        : '광고 개인정보 설정을 열지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
    setLoading(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title="광고 개인정보 설정" />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>광고 개인정보 선택</Text>
        <Text accessibilityLiveRegion="polite" style={[styles.body, { color: colors.muted }]}>{message}</Text>
        <HapticPressable
          accessibilityLabel="광고 개인정보 선택 화면 열기"
          disabled={loading}
          feedback="medium"
          onPress={() => void openOptions()}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{loading ? '확인 중' : '선택 확인하기'}</Text>
        </HapticPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: layout.screenPadding, gap: 14 },
  title: { ...typography.heading, fontSize: 21 },
  body: { ...typography.body, lineHeight: 24 },
  button: { minHeight: 50, marginTop: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...typography.subheading, fontSize: 14 },
});
