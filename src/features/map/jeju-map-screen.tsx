import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router, useScrollToTop } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { HapticPressable } from '@/src/components/HapticPressable';
import { triggerHaptic } from '@/src/lib/haptics';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { usePlaceData } from '@/src/providers/PlaceDataProvider';
import { openInAppleMaps, openInNaverMap } from '@/src/services/naver-map';

type NaverMapModule = typeof import('@mj-studio/react-native-naver-map');

export function JejuMapScreen() {
  const { colors } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const { places } = usePlaceData();
  const configured = Boolean(Constants.expoConfig?.extra?.naverMapConfigured);
  const [mapModule, setMapModule] = useState<NaverMapModule | null>(null);
  const placesById = useMemo(
    () => new Map(places.map((place) => [place.id, place])),
    [places],
  );
  const clusterMarkers = useMemo(
    () => places.map((place) => ({
      identifier: place.id,
      latitude: place.latitude,
      longitude: place.longitude,
    })),
    [places],
  );

  useEffect(() => {
    if (!configured) return;
    void import('@mj-studio/react-native-naver-map').then(setMapModule).catch(() => setMapModule(null));
  }, [configured]);

  if (configured && mapModule) {
    const MapView = mapModule.NaverMapView;
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppHeader title="제주 지도" subtitle="장소를 눌러 자세히 알아보세요" />
        <MapView
          clusters={[{
            animate: true,
            markers: clusterMarkers,
            maxZoom: 16,
            minZoom: 4,
            screenDistance: 54,
          }]}
          initialCamera={{ latitude: 33.38, longitude: 126.55, zoom: 9 }}
          isShowScaleBar
          isShowZoomControls
          locale="ko"
          onTapClusterLeaf={({ markerIdentifier }) => {
            const place = placesById.get(markerIdentifier);
            if (!place) return;
            void triggerHaptic('selection');
            router.push({ pathname: '/places/[id]', params: { id: place.id } });
          }}
          style={styles.nativeMap}
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title="제주 지도" subtitle="동서남북으로 펼쳐 보는 여행" />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.mapPreview, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <View style={[styles.island, { backgroundColor: colors.surface }]} />
          {places.slice(0, 5).map((place, index) => (
            <HapticPressable key={place.id} accessibilityLabel={`${place.name} 위치`} onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })} style={[styles.pin, pinPositions[index], { backgroundColor: colors.primary }]}>
              <Ionicons name="location" size={17} color={colors.onPrimary} />
            </HapticPressable>
          ))}
          <View style={[styles.mapNotice, { backgroundColor: colors.surface }]}><Ionicons name="map-outline" size={18} color={colors.primaryStrong} /><Text selectable style={[styles.mapNoticeText, { color: colors.text }]}>네이버 지도 연결 전에도 장소와 위치를 둘러볼 수 있어요</Text></View>
        </View>
        <Text selectable style={[styles.sectionTitle, { color: colors.text }]}>지도에서 바로 열기</Text>
        {places.map((place) => (
          <View key={place.id} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.surfaceAlt }]}><Ionicons name="location-outline" size={21} color={colors.primaryStrong} /></View>
            <HapticPressable style={styles.rowCopy} onPress={() => router.push({ pathname: '/places/[id]', params: { id: place.id } })}><Text selectable style={[styles.rowTitle, { color: colors.text }]}>{place.name}</Text><Text selectable style={[styles.rowMeta, { color: colors.muted }]}>{place.region} · {place.area}</Text></HapticPressable>
            <View style={styles.mapActions}>
              <HapticPressable accessibilityLabel={`${place.name} 네이버 지도에서 열기`} feedback="medium" onPress={() => void openInNaverMap(place)} style={[styles.naverButton, { borderColor: colors.border }]}><Text style={[styles.naverText, { color: colors.primaryStrong }]}>네이버</Text></HapticPressable>
              <HapticPressable accessibilityLabel={`${place.name} Apple 지도에서 열기`} feedback="medium" onPress={() => void openInAppleMaps(place)} style={[styles.appleButton, { borderColor: colors.border }]}><Text style={[styles.naverText, { color: colors.text }]}>Apple</Text></HapticPressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const pinPositions = [{ left: '60%', top: '34%' }, { left: '45%', top: '42%' }, { left: '79%', top: '28%' }, { left: '18%', top: '48%' }, { left: '52%', top: '25%' }] as const;
const styles = StyleSheet.create({ screen: { flex: 1 }, nativeMap: { flex: 1 }, content: { paddingHorizontal: 18, paddingBottom: 34, gap: 10 }, mapPreview: { height: 260, borderWidth: 1, borderRadius: 25, overflow: 'hidden', position: 'relative', borderCurve: 'continuous' }, island: { position: 'absolute', width: '72%', height: '43%', left: '14%', top: '22%', borderRadius: 999, transform: [{ rotate: '-8deg' }], opacity: 0.9 }, pin: { position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, mapNotice: { position: 'absolute', left: 14, right: 14, bottom: 14, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, mapNoticeText: { flex: 1, fontSize: 12, lineHeight: 17 }, sectionTitle: { fontSize: 19, fontWeight: '900', paddingTop: 14, paddingBottom: 3 }, row: { minHeight: 72, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderCurve: 'continuous' }, rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1, gap: 4 }, rowTitle: { fontSize: 15, fontWeight: '800' }, rowMeta: { fontSize: 11 }, mapActions: { flexDirection: 'row', gap: 5 }, naverButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 9 }, appleButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 9 }, naverText: { fontSize: 11, fontWeight: '900' } });
