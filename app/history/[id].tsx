import { useLocalSearchParams } from 'expo-router';

import { HistoryDetailScreen } from '@/src/features/history/history-detail-screen';

export default function HistoryDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HistoryDetailScreen id={id} />;
}
