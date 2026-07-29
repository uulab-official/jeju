import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { APPWRITE_PROJECT_ID, APPWRITE_PUSH_FUNCTION_ID, functions } from '@/src/lib/appwrite';

const TOKEN_STORAGE_KEY = '@jeju/expo-push-token/v1';
const OPT_OUT_STORAGE_KEY = '@jeju/push-opt-out/v1';
const INSTALLATION_STORAGE_KEY = '@jeju/push-installation-id/v1';
const LAST_SYNC_STORAGE_KEY = '@jeju/push-last-sync/v1';
const INBOX_STORAGE_KEY = '@jeju/push-inbox/v1';
const MAX_INBOX_ITEMS = 50;
const CHANNEL_ID = 'jeju-news';
const PUSH_SYNC_FRESHNESS_MS = 24 * 60 * 60 * 1_000;
const ALLOWED_ROUTE_ROOTS = new Set(['detail', 'library', 'notifications', 'places', 'settings']);

type PushState = 'checking' | 'disabled' | 'enabled' | 'unsupported' | 'error';

type PushContextValue = {
  state: PushState;
  errorMessage: string | null;
  notifications: PushInboxItem[];
  enable: () => Promise<void>;
  disable: () => Promise<void>;
};

export type PushInboxItem = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  route?: string;
};

const PushContext = createContext<PushContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function projectId() {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

async function createExpoPushToken() {
  const id = projectId();
  if (!id) throw new Error('EAS 프로젝트 ID가 설정되지 않았습니다.');
  const token = await Notifications.getExpoPushTokenAsync({ projectId: id });
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token.data);
  return token.data;
}

async function installationId() {
  const saved = await AsyncStorage.getItem(INSTALLATION_STORAGE_KEY);
  if (saved) return saved;
  const created = `install-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(INSTALLATION_STORAGE_KEY, created);
  return created;
}

async function syncPushInstallation(active: boolean, expoPushToken?: string) {
  const id = await installationId();
  const execution = await functions.createExecution({
    functionId: APPWRITE_PUSH_FUNCTION_ID,
    body: JSON.stringify({
      installationId: id,
      expoPushToken,
      active,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version ?? '1.0.0',
      projectId: APPWRITE_PROJECT_ID,
    }),
    async: false,
  });
  const responseStatus = Number(execution.responseStatusCode || 0);
  if (execution.status !== 'completed' || responseStatus < 200 || responseStatus >= 300) {
    throw new Error('알림 서버에 기기를 등록하지 못했습니다.');
  }
  await AsyncStorage.setItem(LAST_SYNC_STORAGE_KEY, new Date().toISOString());
}

async function shouldSyncPushInstallation() {
  const lastSyncedAt = await AsyncStorage.getItem(LAST_SYNC_STORAGE_KEY);
  return !lastSyncedAt
    || !Number.isFinite(Date.parse(lastSyncedAt))
    || Date.now() - Date.parse(lastSyncedAt) >= PUSH_SYNC_FRESHNESS_MS;
}

function safeNotificationRoute(target: unknown) {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    const root = target.split(/[/?#]/).filter(Boolean)[0];
    if (root && ALLOWED_ROUTE_ROOTS.has(root)) return target;
  }
  return null;
}

function notificationRoute(response: Notifications.NotificationResponse) {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  return safeNotificationRoute(response.notification.request.content.data?.route);
}

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PushState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PushInboxItem[]>([]);
  const handledResponseIds = useRef(new Set<string>());

  const recordNotification = useCallback((notification: Notifications.Notification) => {
    const request = notification.request;
    const content = request.content;
    const title = typeof content.title === 'string' && content.title.trim() ? content.title.trim() : '제주 소식';
    const body = typeof content.body === 'string' ? content.body.trim() : '';
    const route = safeNotificationRoute(content.data?.route) ?? undefined;
    const item: PushInboxItem = { id: request.identifier, title, body, receivedAt: new Date().toISOString(), route };
    setNotifications((current) => {
      if (current.some((entry) => entry.id === item.id)) return current;
      const next = [item, ...current].slice(0, MAX_INBOX_ITEMS);
      void AsyncStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const handleResponse = (response: Notifications.NotificationResponse) => {
      recordNotification(response.notification);
      const identifier = response.notification.request.identifier;
      if (handledResponseIds.current.has(identifier)) return;
      handledResponseIds.current.add(identifier);
      const target = notificationRoute(response);
      if (target) requestAnimationFrame(() => router.push(target as never));
    };

    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: '제주 소식',
        description: '제주의 축제, 계절 여행지와 새 문화 콘텐츠 소식',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 180, 250],
        lightColor: '#E87924',
      });
    }

    void Promise.all([
      Notifications.getPermissionsAsync(),
      AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      AsyncStorage.getItem(OPT_OUT_STORAGE_KEY),
    ]).then(
      ([permission, token, optedOut]) => {
        if (!mounted) return;
        if (!Device.isDevice) setState('unsupported');
        else if (permission.status === 'granted' && token && !optedOut) {
          setState('enabled');
          void shouldSyncPushInstallation().then((shouldSync) => {
            if (!shouldSync) return;
            return syncPushInstallation(true, token);
          }).catch(() => {
            if (mounted) setErrorMessage('알림 서버 연결을 다시 확인해 주세요.');
          });
        } else {
          setState('disabled');
          if (optedOut) {
            void shouldSyncPushInstallation().then((shouldSync) => {
              if (shouldSync) return syncPushInstallation(false);
            }).catch(() => undefined);
          }
        }
      },
    ).catch(() => mounted && setState('error'));

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      handleResponse(lastResponse);
      Notifications.clearLastNotificationResponse();
    }

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleResponse(response);
      Notifications.clearLastNotificationResponse();
    });
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => recordNotification(notification));
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void AsyncStorage.getItem(OPT_OUT_STORAGE_KEY).then((optedOut) => {
        if (optedOut) return;
        return createExpoPushToken().then(async (token) => {
          await syncPushInstallation(true, token);
          setState('enabled');
        });
      }).catch(() => setState('error'));
    });

    return () => {
      mounted = false;
      responseSubscription.remove();
      receivedSubscription.remove();
      tokenSubscription.remove();
    };
  }, [recordNotification]);

  useEffect(() => {
    void AsyncStorage.getItem(INBOX_STORAGE_KEY).then((value) => {
      if (!value) return;
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
          const restored = parsed
            .filter(isInboxItem)
            .map((item) => ({ ...item, route: safeNotificationRoute(item.route) ?? undefined }));
          setNotifications((current) => {
            const merged = new Map<string, PushInboxItem>();
            [...current, ...restored].forEach((item) => merged.set(item.id, item));
            return [...merged.values()]
              .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))
              .slice(0, MAX_INBOX_ITEMS);
          });
        }
      } catch {
        // A malformed inbox must not block notification registration.
      }
    }).catch(() => undefined);
  }, []);

  const enable = useCallback(async () => {
    setErrorMessage(null);
    if (!Device.isDevice) {
      setState('unsupported');
      setErrorMessage('푸시 알림은 실제 기기에서만 등록할 수 있어요.');
      return;
    }
    try {
      const current = await Notifications.getPermissionsAsync();
      const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setState('disabled');
        setErrorMessage('기기 설정에서 알림 권한을 허용해 주세요.');
        return;
      }
      const token = await createExpoPushToken();
      await syncPushInstallation(true, token);
      await AsyncStorage.removeItem(OPT_OUT_STORAGE_KEY);
      setState('enabled');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : '알림 등록 중 오류가 발생했습니다.');
    }
  }, []);

  const disable = useCallback(async () => {
    setErrorMessage(null);
    await AsyncStorage.setItem(OPT_OUT_STORAGE_KEY, '1');
    await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, LAST_SYNC_STORAGE_KEY]);
    setState('disabled');
    try {
      await syncPushInstallation(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '알림 해제를 완료하지 못했습니다.');
    }
  }, []);

  const value = useMemo(() => ({ state, errorMessage, notifications, enable, disable }), [disable, enable, errorMessage, notifications, state]);
  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

function isInboxItem(value: unknown): value is PushInboxItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PushInboxItem>;
  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.body === 'string'
    && typeof item.receivedAt === 'string'
    && Number.isFinite(Date.parse(item.receivedAt));
}

export function usePushNotifications() {
  const value = useContext(PushContext);
  if (!value) throw new Error('usePushNotifications must be used inside PushNotificationsProvider');
  return value;
}
