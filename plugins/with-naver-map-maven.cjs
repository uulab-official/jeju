const { withProjectBuildGradle } = require('@expo/config-plugins');

const NAVER_MAP_MAVEN = 'https://repository.map.naver.com/archive/maven';

module.exports = function withNaverMapMaven(config) {
  return withProjectBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') return gradleConfig;

    const contents = gradleConfig.modResults.contents;
    if (contents.includes(NAVER_MAP_MAVEN)) return gradleConfig;

    gradleConfig.modResults.contents = `${contents.trimEnd()}

// NAVER Maps Android SDK is distributed from NAVER's official Maven repository.
allprojects {
    repositories {
        maven { url '${NAVER_MAP_MAVEN}' }
    }
}
`;
    return gradleConfig;
  });
};
