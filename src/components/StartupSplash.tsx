import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';

type StartupSplashProps = {
  message: string;
  progress: number;
};

export function StartupSplash({ message, progress }: StartupSplashProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const [animatedProgress] = useState(() => new Animated.Value(clamped));
  const currentProgress = useRef(clamped);
  const [displayProgress, setDisplayProgress] = useState(clamped);

  useEffect(() => {
    const listener = animatedProgress.addListener(({ value }) => {
      const next = Math.max(currentProgress.current, Math.max(0, Math.min(1, value)));
      currentProgress.current = next;
      setDisplayProgress(next);
    });
    return () => animatedProgress.removeListener(listener);
  }, [animatedProgress]);

  useEffect(() => {
    const target = Math.max(currentProgress.current, clamped);
    Animated.timing(animatedProgress, {
      toValue: target,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedProgress, clamped]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View accessibilityLabel={message} style={styles.root}>
      <View style={styles.logoSlot}>
        <Image
          accessibilityIgnoresInvertColors
          contentFit="contain"
          source={require('../../assets/images/splash-mark.png')}
          style={styles.logo}
        />
      </View>
      <Text style={styles.title}>소랑제주</Text>
      <View style={styles.messageSlot}>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.progressSlot}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width }]} />
        </View>
        <Text style={styles.percent}>{Math.round(displayProgress * 100)}%</Text>
      </View>
      <View style={styles.spinnerSlot}>
        <ActivityIndicator color="#B95112" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 36,
  },
  logoSlot: {
    height: 112,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 104,
    height: 104,
  },
  title: {
    color: '#27231F',
    fontFamily: 'NanumOld',
    fontSize: 28,
    textAlign: 'center',
  },
  messageSlot: {
    marginTop: 18,
    marginBottom: 18,
  },
  message: {
    color: '#756B61',
    fontSize: 14,
    textAlign: 'center',
    includeFontPadding: true,
  },
  progressSlot: {
    width: '100%',
    maxWidth: 300,
    height: 36,
    alignSelf: 'center',
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E9DED1',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#E87924',
  },
  percent: {
    marginTop: 8,
    color: '#756B61',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  spinnerSlot: {
    height: 24,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
