const base = require('./app.base.json');

module.exports = () => {
  const expo = JSON.parse(JSON.stringify(base.expo));
  const runtimeVersion = process.env.EXPO_OTA_RUNTIME_VERSION;
  const projectId = process.env.EAS_PROJECT_ID || expo.extra?.eas?.projectId;
  const naverMapClientId = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
  const productionAds = /^production(?:-|$)/.test(process.env.EAS_BUILD_PROFILE || '')
    || process.env.EXPO_PUBLIC_ADMOB_ENV === 'production';
  const keys = ['IOS_APP_ID', 'ANDROID_APP_ID', 'NATIVE_DISCOVER_IOS_ID', 'NATIVE_DISCOVER_ANDROID_ID'];
  const sampleIds = ['ca-app-pub-3940256099942544~1458002511', 'ca-app-pub-3940256099942544~3347511713',
    'ca-app-pub-3940256099942544/3986624511', 'ca-app-pub-3940256099942544/2247696110'];
  const ids = productionAds ? keys.map(key => process.env[`EXPO_PUBLIC_ADMOB_${key}`] || '') : sampleIds;
  if (productionAds && (process.env.EXPO_PUBLIC_ADMOB_FORCE_TEST_ADS === '1' || ids.some((id, index) =>
    !(index < 2 ? /^ca-app-pub-\d{16}~\d{10}$/ : /^ca-app-pub-\d{16}\/\d{10}$/).test(id)
    || id.startsWith('ca-app-pub-3940256099942544')))) {
    throw new Error('AdMob production requires all four issued app/unit IDs and test mode disabled.');
  }

  if (runtimeVersion) expo.runtimeVersion = runtimeVersion;
  if (typeof expo.runtimeVersion !== 'string' || !expo.runtimeVersion.endsWith('-admob16')) {
    throw new Error('AdMob native runtime must end in -admob16; the ad-free binary cannot receive this bundle.');
  }
  if (projectId) {
    expo.extra = { ...expo.extra, eas: { projectId } };
    expo.updates = { ...expo.updates, url: `https://u.expo.dev/${projectId}` };
  }
  expo.extra = { ...expo.extra, naverMapConfigured: Boolean(naverMapClientId) };
  expo.extra.admob = { productionReady: productionAds, testMode: !productionAds,
    nativeDiscoverIos: ids[2], nativeDiscoverAndroid: ids[3] };
  expo.plugins = [...(expo.plugins || []), ['react-native-google-mobile-ads', {
    iosAppId: ids[0], androidAppId: ids[1], delayAppMeasurementInit: true,
    userTrackingUsageDescription: '광고 제공 및 성과 측정을 위한 기기 식별자 사용 허용 여부를 확인합니다.',
  }]];
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
