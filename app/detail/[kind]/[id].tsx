import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/src/components/AppHeader';
import { EmptyState, ListSkeleton } from '@/src/components/ContentState';
import { HapticPressable } from '@/src/components/HapticPressable';
import { useFavorites } from '@/src/providers/FavoritesProvider';
import { useJejuData } from '@/src/providers/JejuDataProvider';
import { useAppTheme } from '@/src/providers/AppThemeProvider';
import { ResourceKind, resourceKinds, resourceMeta } from '@/src/types/jeju';

export default function DetailScreen() {
  const params = useLocalSearchParams<{ kind: string; id: string }>();
  const kind = resourceKinds.includes(params.kind as ResourceKind) ? (params.kind as ResourceKind) : 'dictionary';
  const id = decodeURIComponent(params.id ?? '');
  const { colors } = useAppTheme();
  const { resources, findItem, refresh } = useJejuData();
  const { isFavorite, toggleFavorite } = useFavorites();
  const state = resources[kind];
  const item = findItem(kind, id);
  const player = useAudioPlayer(item?.audioUrl ?? null);
  const audioStatus = useAudioPlayerStatus(player);

  useEffect(() => () => player.pause(), [player]);

  const right = item ? (
    <View style={styles.actions}>
      <HapticPressable accessibilityLabel="공유" feedback="light" hitSlop={8} onPress={() => void Share.share({ title: item.title, message: `${item.title}\n\n${item.body}\n\n소랑제주` })} style={styles.actionButton}>
        <Ionicons name="share-outline" size={22} color={colors.text} />
      </HapticPressable>
      <HapticPressable accessibilityLabel={isFavorite(kind, id) ? '저장 해제' : '저장'} feedback="success" hitSlop={8} onPress={() => toggleFavorite(kind, id)} style={styles.actionButton}>
        <Ionicons name={isFavorite(kind, id) ? 'bookmark' : 'bookmark-outline'} size={22} color={isFavorite(kind, id) ? colors.primary : colors.text} />
      </HapticPressable>
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader back title={resourceMeta[kind].shortLabel} right={right} />
      {(state.loading || state.refreshing) && !item ? <ListSkeleton rows={5} /> : !item ? (
        <EmptyState icon="alert-circle-outline" title="자료를 찾지 못했어요" message={state.error ?? '데이터가 갱신되었거나 주소가 올바르지 않을 수 있어요.'} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {item.imageUrl ? <Image source={{ uri: item.imageUrl }} contentFit="cover" style={[styles.image, { backgroundColor: colors.surfaceAlt }]} transition={180} /> : null}
          <View style={styles.titleArea}>
            <Text style={[styles.kind, { color: colors.primaryStrong }]}>{resourceMeta[kind].label}</Text>
            <Text selectable style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            {item.subtitle ? <Text selectable style={[styles.subtitle, { color: colors.muted }]}>{item.subtitle}</Text> : null}
            {item.audioUrl ? (
              <HapticPressable
                feedback="medium"
                onPress={() => {
                  if (audioStatus.playing) player.pause();
                  else {
                    if (audioStatus.didJustFinish) void player.seekTo(0);
                    player.play();
                  }
                }}
                style={[styles.audio, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={audioStatus.playing ? 'pause' : 'volume-high'} size={20} color={colors.primaryStrong} />
                <Text style={[styles.audioText, { color: colors.text }]}>{audioStatus.playing ? '재생 중 · 잠시 멈추기' : '제주어 발음 듣기'}</Text>
              </HapticPressable>
            ) : null}
          </View>
          <View style={styles.fields}>
            {item.fields.map((field, index) => (
              <View key={`${field.label}-${index}`} style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.primaryStrong }]}>{field.label}</Text>
                <Text selectable style={[styles.fieldValue, { color: colors.text }]}>{field.value}</Text>
              </View>
            ))}
          </View>
          {state.error ? (
            <HapticPressable feedback="medium" onPress={() => void refresh(kind)} style={[styles.cacheNotice, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="cloud-offline-outline" size={18} color={colors.muted} />
              <Text style={[styles.cacheText, { color: colors.muted }]}>저장된 자료입니다. 눌러서 최신 데이터 다시 확인</Text>
            </HapticPressable>
          ) : null}
          <Text style={[styles.source, { color: colors.muted }]}>출처: 제주특별자치도 제주어 OpenAPI</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, actions: { flexDirection: 'row' }, actionButton: { width: 38, height: 42, justifyContent: 'center', alignItems: 'center' }, content: { paddingBottom: 38 }, image: { width: '100%', aspectRatio: 16 / 10 }, titleArea: { padding: 22, paddingBottom: 12 }, kind: { fontSize: 12, fontWeight: '800', marginBottom: 8 }, title: { fontFamily: 'NanumOld', fontSize: 28, lineHeight: 39 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: 8 }, audio: { marginTop: 18, alignSelf: 'flex-start', height: 46, paddingHorizontal: 16, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }, audioText: { fontSize: 14, fontWeight: '700' },
  fields: { paddingHorizontal: 18, gap: 12 }, field: { borderWidth: 1, borderRadius: 18, padding: 17, gap: 8 }, fieldLabel: { fontSize: 13, fontWeight: '800' }, fieldValue: { fontSize: 16, lineHeight: 27, fontFamily: 'NanumOld' }, cacheNotice: { marginHorizontal: 18, marginTop: 14, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, cacheText: { flex: 1, fontSize: 12 }, source: { fontSize: 11, textAlign: 'center', marginTop: 24 },
});
