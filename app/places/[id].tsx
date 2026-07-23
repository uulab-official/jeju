import { useLocalSearchParams } from 'expo-router';

import { PlaceDetailScreen } from '@/src/features/places/place-detail-screen';

export default function PlaceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlaceDetailScreen id={id} />;
}
