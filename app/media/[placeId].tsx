import { useLocalSearchParams } from 'expo-router';

import { PlaceMediaViewerScreen } from '@/src/features/media/place-media-viewer-screen';

export default function MediaViewerRoute() {
  const params = useLocalSearchParams<{ placeId: string; index?: string }>();
  const parsedIndex = Number(params.index ?? 0);
  return (
    <PlaceMediaViewerScreen
      initialIndex={Number.isFinite(parsedIndex) ? parsedIndex : 0}
      placeId={decodeURIComponent(params.placeId ?? '')}
    />
  );
}
