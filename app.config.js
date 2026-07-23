const base = require('./app.base.json');

module.exports = () => {
  const expo = JSON.parse(JSON.stringify(base.expo));
  const runtimeVersion = process.env.EXPO_OTA_RUNTIME_VERSION;
  const projectId = process.env.EAS_PROJECT_ID || expo.extra?.eas?.projectId;
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (runtimeVersion) expo.runtimeVersion = runtimeVersion;
  if (projectId) {
    expo.extra = { ...expo.extra, eas: { projectId } };
    expo.updates = { ...expo.updates, url: `https://u.expo.dev/${projectId}` };
  }
  expo.extra = { ...expo.extra, naverMapConfigured: Boolean(naverMapClientId) };
  if (naverMapClientId) {
    expo.plugins = [
      ...(expo.plugins || []),
      [
        '@mj-studio/react-native-naver-map',
        {
          client_id: naverMapClientId,
        },
      ],
    ];
  }
  return expo;
};
