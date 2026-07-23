import 'react-native-url-polyfill/auto';

import { Client, Functions, TablesDB } from 'react-native-appwrite';

export const APPWRITE_ENDPOINT = 'https://appwrite.uulab.co.kr/v1';
export const APPWRITE_PROJECT_ID = '6a615d4e00392e50bbd8';
export const APPWRITE_DATABASE_ID = 'jeju';
export const APPWRITE_PLACES_TABLE_ID = 'places';
export const APPWRITE_CULTURE_TABLE_ID = 'culture_items';
export const APPWRITE_PUSH_FUNCTION_ID = 'register-push-installation';

export const client = new Client()
  .setProject(APPWRITE_PROJECT_ID)
  .setEndpoint(APPWRITE_ENDPOINT)
  .setPlatform('kr.co.uulab.jeju');

export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);

let pingPromise: Promise<unknown> | null = null;

export function pingAppwrite() {
  pingPromise ??= client.ping().finally(() => {
    pingPromise = null;
  });
  return pingPromise;
}
