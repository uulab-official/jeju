import { useLocalSearchParams } from 'expo-router';

import { LibraryScreen } from '@/src/features/library/LibraryScreen';
import { ResourceKind, resourceKinds } from '@/src/types/jeju';

export default function LibraryRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const resolved = resourceKinds.includes(kind as ResourceKind) ? (kind as ResourceKind) : 'dictionary';
  return <LibraryScreen kind={resolved} />;
}
