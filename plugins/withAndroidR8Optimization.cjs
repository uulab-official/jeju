'use strict';

const {
  withAppBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

const OPTIMIZED_RESOURCE_SHRINKING = 'android.r8.optimizedResourceShrinking';
const LEGACY_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZED_PROGUARD_FILE = 'getDefaultProguardFile("proguard-android-optimize.txt")';

function upsertGradleProperty(properties, key, value) {
  const index = properties.findIndex((property) => property.type === 'property' && property.key === key);
  const next = { type: 'property', key, value };

  if (index === -1) {
    properties.push(next);
  } else {
    properties[index] = next;
  }
}

function withJejuAndroidR8Optimization(config) {
  config = withGradleProperties(config, (mod) => {
    upsertGradleProperty(mod.modResults, OPTIMIZED_RESOURCE_SHRINKING, 'true');
    return mod;
  });

  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('[withAndroidR8Optimization] Jeju requires a Groovy android/app/build.gradle file.');
    }

    const contents = mod.modResults.contents;
    if (!contents.includes('minifyEnabled')) {
      throw new Error('[withAndroidR8Optimization] Jeju release build is missing minifyEnabled.');
    }
    if (!contents.includes('shrinkResources')) {
      throw new Error('[withAndroidR8Optimization] Jeju release build is missing shrinkResources.');
    }

    let next = contents.replaceAll(LEGACY_PROGUARD_FILE, OPTIMIZED_PROGUARD_FILE);
    if (!next.includes(OPTIMIZED_PROGUARD_FILE)) {
      throw new Error('[withAndroidR8Optimization] Jeju release build must use proguard-android-optimize.txt.');
    }

    mod.modResults.contents = next;
    return mod;
  });
}

module.exports = withJejuAndroidR8Optimization;
