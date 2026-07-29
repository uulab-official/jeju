import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Animated, FlatList, NativeScrollEvent, NativeSyntheticEvent, PanResponder, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticPressable } from '@/src/components/HapticPressable';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { layout, typography } from '@/src/theme/tokens';

export function PlaceMediaViewerScreen({ placeId, initialIndex = 0 }: { placeId: string; initialIndex?: number }) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { findPlace } = usePlaceData();
  const [dragY] = useState(() => new Animated.Value(0));
  const place = findPlace(placeId);
  const images = useMemo(() => {
    if (!place) return [];
    if (place.images?.length) return place.images;
    return place.heroImageUrl ? [{ url: place.heroImageUrl, description: place.name }] : [];
  }, [place]);
  const safeInitialIndex = Math.max(0, Math.min(initialIndex, Math.max(0, images.length - 1)));
  const [index, setIndex] = useState(safeInitialIndex);
  const backdropOpacity = dragY.interpolate({
    inputRange: [-height * 0.5, 0, height * 0.5],
    outputRange: [0.25, 1, 0.25],
    extrapolate: 'clamp',
  });
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.25
    ),
    onPanResponderMove: (_, gesture) => dragY.setValue(gesture.dy),
    onPanResponderRelease: (_, gesture) => {
      const shouldDismiss = Math.abs(gesture.dy) > Math.min(140, height * 0.18) || Math.abs(gesture.vy) > 1.15;
      if (shouldDismiss) {
        Animated.timing(dragY, {
          toValue: gesture.dy < 0 ? -height : height,
          duration: 170,
          useNativeDriver: true,
        }).start(() => router.back());
        return;
      }
      Animated.spring(dragY, {
        toValue: 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragY, {
        toValue: 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    },
  }), [dragY, height]);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setIndex(Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))));
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
      <Animated.View
        accessibilityHint="사진을 위아래로 밀어 닫을 수 있어요"
        style={[styles.viewer, { transform: [{ translateY: dragY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <HapticPressable accessibilityLabel="사진 닫기" feedback="light" onPress={() => router.back()} style={styles.close}>
            <Ionicons name="close" size={27} color="#FFFFFF" />
          </HapticPressable>
          <Text numberOfLines={1} style={styles.title}>{place?.name ?? '제주 사진'}</Text>
          <Text style={styles.counter}>{images.length > 1 ? `${index + 1} / ${images.length}` : ''}</Text>
        </View>
        {images.length ? (
          <FlatList
            data={images}
            getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
            horizontal
            initialScrollIndex={safeInitialIndex}
            keyExtractor={(item, itemIndex) => `${item.url}-${itemIndex}`}
            onMomentumScrollEnd={onScrollEnd}
            pagingEnabled
            renderItem={({ item, index: itemIndex }) => (
              <View style={[styles.page, { width }]}>
                <Image
                  accessibilityLabel={item.description || `${place?.name ?? '제주'} 사진 ${itemIndex + 1}`}
                  cachePolicy="memory-disk"
                  contentFit="contain"
                  source={{ uri: item.url }}
                  style={styles.image}
                  transition={150}
                />
                {item.description ? <Text style={[styles.description, { marginBottom: Math.max(insets.bottom, 18) }]}>{item.description}</Text> : null}
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="image-outline" size={34} color="rgba(255,255,255,0.7)" />
            <Text style={styles.emptyText}>표시할 사진이 없어요.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdrop: { backgroundColor: '#080808' },
  viewer: { flex: 1 },
  topBar: { minHeight: 56, paddingHorizontal: layout.screenPadding, flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  close: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  title: { ...typography.body, flex: 1, color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  counter: { ...typography.caption, width: layout.minTouchTarget, color: 'rgba(255,255,255,0.78)', textAlign: 'right', fontVariant: ['tabular-nums'] },
  page: { flex: 1, justifyContent: 'center' },
  image: { width: '100%', height: '78%' },
  description: { ...typography.caption, color: 'rgba(255,255,255,0.82)', textAlign: 'center', paddingHorizontal: 28, marginTop: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { ...typography.body, color: 'rgba(255,255,255,0.78)' },
});
