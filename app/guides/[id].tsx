import { useLocalSearchParams } from 'expo-router';

import { TravelGuideScreen } from '@/src/features/guides/travel-guide-screen';

export default function TravelGuideRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TravelGuideScreen id={id} />;
}
