import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function StartupRecovery({ onRetry, onLayout, retrying = false }: { onRetry: () => void; onLayout: () => void; retrying?: boolean }) {
  return (
    <View onLayout={onLayout} style={styles.root}>
      <Image accessibilityIgnoresInvertColors contentFit="contain" source={require('../../assets/images/splash-mark.png')} style={styles.logo} />
      <Text style={styles.title}>소랑제주</Text>
      <Text style={styles.message}>제주 글꼴을 준비하지 못했어요</Text>
      <Text style={styles.description}>제주어를 정확하게 보여드리기 위해{ '\n' }글꼴을 다시 준비해 주세요</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="제주 글꼴 다시 준비하기" accessibilityState={{ disabled: retrying, busy: retrying }} disabled={retrying} onPress={onRetry} style={({ pressed }) => [styles.retry, (pressed || retrying) && styles.pressed]}>
        <Text style={styles.retryText}>{retrying ? '글꼴을 준비하고 있어요' : '다시 준비하기'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7', paddingHorizontal: 36 },
  logo: { width: 104, height: 104 },
  title: { color: '#27231F', fontSize: 28, textAlign: 'center', marginTop: 8 },
  message: { color: '#756B61', fontSize: 14, textAlign: 'center', marginTop: 18 },
  description: { color: '#756B61', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  retry: { minHeight: 48, minWidth: 148, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: '#E87924', paddingHorizontal: 20, marginTop: 24 },
  retryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});
