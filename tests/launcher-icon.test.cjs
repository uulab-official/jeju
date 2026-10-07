const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const sharp = require('sharp');
const {
  dpiValues,
  getAdaptiveIcon,
  getIcon,
  setIconAsync,
  setRoundIconManifest,
} = require('@expo/prebuild-config/build/plugins/icons/withAndroidIcons');

const root = path.resolve(__dirname, '..');

test('configured Android launcher contains the approved multicolor artwork, not a blank square', async () => {
  const config = require('../app.config.js')();
  const file = config.android?.adaptiveIcon?.foregroundImage || config.android?.icon || config.icon;
  const { data } = await sharp(path.resolve(root, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const visibleColors = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] >= 128) visibleColors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
  }
  assert.ok(visibleColors.size > 1, `${file} is a blank single-color launcher (${visibleColors.size} visible color)`);
});

test('visual preflight rejects the historical blank adaptive foreground even when its alpha bounds pass', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-launcher-check-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const directory of ['assets', 'fastlane', 'src']) {
    fs.symlinkSync(path.join(root, directory), path.join(fixture, directory), 'dir');
  }
  const config = structuredClone(require('../app.base.json'));
  config.expo.android.adaptiveIcon = {
    backgroundColor: '#FFF3C4',
    foregroundImage: './assets/images/android-icon-foreground.png',
    monochromeImage: './assets/images/android-icon-monochrome.png',
  };
  fs.writeFileSync(path.join(fixture, 'app.base.json'), JSON.stringify(config));
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/visual-assets-check.js'), fixture], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /Android adaptive foreground.*blank or single-color/);
});

test('Expo standard-icon generation removes stale adaptive XML and round icon references', async (t) => {
  const config = require('../app.config.js')();
  assert.equal(config.android.adaptiveIcon, undefined, 'Remove the entire adaptiveIcon object so Expo uses its uncropped standard-icon path');
  assert.equal(getIcon(config), './assets/images/icon.png');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-launcher-resources-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const res = path.join(fixture, 'android/app/src/main/res');
  const options = (expo) => {
    const adaptive = getAdaptiveIcon(expo);
    for (const key of ['foregroundImage', 'backgroundImage', 'monochromeImage']) {
      if (adaptive[key]) adaptive[key] = path.resolve(root, adaptive[key]);
    }
    return { ...adaptive, icon: path.resolve(root, getIcon(expo)), isAdaptive: Boolean(expo.android?.adaptiveIcon) };
  };
  const oldConfig = structuredClone(config);
  oldConfig.android.adaptiveIcon = {
    backgroundColor: '#FFF3C4',
    foregroundImage: './assets/images/android-icon-foreground.png',
    monochromeImage: './assets/images/android-icon-monochrome.png',
  };
  await setIconAsync(fixture, options(oldConfig));
  assert.ok(fs.existsSync(path.join(res, 'mipmap-anydpi-v26/ic_launcher.xml')));
  await setIconAsync(fixture, options(config));
  const cleanFixture = fs.mkdtempSync(path.join(os.tmpdir(), 'jeju-launcher-clean-'));
  t.after(() => fs.rmSync(cleanFixture, { recursive: true, force: true }));
  await setIconAsync(cleanFixture, options(config));
  for (const output of [res, path.join(cleanFixture, 'android/app/src/main/res')]) {
    for (const filename of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
      assert.equal(fs.existsSync(path.join(output, 'mipmap-anydpi-v26', filename)), false, filename);
    }
    for (const { folderName, scale } of Object.values(dpiValues)) {
      assert.equal(fs.existsSync(path.join(output, folderName, 'ic_launcher_round.webp')), false, folderName);
      const file = path.join(output, folderName, 'ic_launcher.webp');
      const actual = await sharp(file).removeAlpha().raw().toBuffer();
      const expected = await sharp(path.resolve(root, config.icon)).resize(48 * scale, 48 * scale).removeAlpha().raw().toBuffer();
      assert.equal(actual.length, expected.length);
      const difference = actual.reduce((sum, value, index) => sum + Math.abs(value - expected[index]), 0) / actual.length;
      assert.ok(difference < 5, `${folderName}: launcher no longer matches approved artwork (${difference})`);
    }
  }
  const manifest = { manifest: { application: [{ $: { 'android:name': '.MainApplication', 'android:icon': '@mipmap/ic_launcher', 'android:roundIcon': '@mipmap/ic_launcher_round' } }] } };
  setRoundIconManifest(config, manifest);
  assert.equal(manifest.manifest.application[0].$['android:roundIcon'], undefined);
  assert.equal(manifest.manifest.application[0].$['android:icon'], '@mipmap/ic_launcher');
});
