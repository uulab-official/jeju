import * as Linking from 'expo-linking';

import { JejuPlace } from '@/src/types/place';

export async function openInNaverMap(place: Pick<JejuPlace, 'latitude' | 'longitude' | 'name'>) {
  const query = new URLSearchParams({ lat: String(place.latitude), lng: String(place.longitude), name: place.name, appname: 'kr.co.uulab.jeju' });
  try {
    await Linking.openURL(`nmap://place?${query.toString()}`);
  } catch {
    await Linking.openURL(`https://map.naver.com/p/search/${encodeURIComponent(place.name)}`);
  }
}
