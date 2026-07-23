import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourceRoot = path.join(root, 'tmp/store-captures/real-jeju/ko');

const shots = [
  { file: '01-home', ko: ['여행지부터 제주 문화까지,', '섬을 더 깊이'], en: ['Travel, culture and language,', 'all beside you'], colors: ['#F6A34A', '#E56D26'] },
  { file: '02-discover', ko: ['취향에 맞는 제주를', '한눈에 발견'], en: ['Discover the Jeju', 'that fits your journey'], colors: ['#F4BE63', '#D98235'] },
  { file: '03-map', ko: ['가고 싶은 곳을', '지도에서 바로 확인'], en: ['See every saved idea', 'on the Jeju map'], colors: ['#67A78E', '#347A69'] },
  { file: '04-saved', ko: ['여행지와 제주어를', '나만의 보관함에'], en: ['Keep places and words', 'for your next trip'], colors: ['#E68A5F', '#B85234'] },
  { file: '05-more', ko: ['제주의 말과 삶을', '오래도록 가까이'], en: ['Keep Jeju language', 'and culture close'], colors: ['#7C8EB9', '#50628F'] },
];

const formats = [
  { platform: 'apple', width: 1242, height: 2688, phoneWidth: 1050, phoneTop: 350, radius: 64 },
  { platform: 'google', width: 1080, height: 1920, phoneWidth: 760, phoneTop: 250, radius: 46 },
];

const xml = (value) => value.replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);

async function roundedScreenshot(input, width, radius) {
  const sourceMetadata = await sharp(input).metadata();
  const height = Math.round((sourceMetadata.height * width) / sourceMetadata.width);
  const resized = sharp(input).resize({ width, height });
  const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="100%" height="100%" rx="${radius}" fill="#fff"/></svg>`);
  return {
    height,
    image: await resized.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer(),
  };
}

function backgroundSvg(format, shot, lines, locale, phoneHeight) {
  const titleSize = format.platform === 'apple' ? 68 : 54;
  const lineGap = format.platform === 'apple' ? 82 : 66;
  const firstY = format.platform === 'apple' ? 125 : 82;
  const tagSize = format.platform === 'apple' ? 30 : 24;
  const phoneLeft = Math.round((format.width - format.phoneWidth) / 2);
  const shadowY = format.phoneTop + 12;
  const shadowHeight = Math.min(phoneHeight, format.height - shadowY + 80);
  return Buffer.from(`
    <svg width="${format.width}" height="${format.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${shot.colors[0]}"/>
          <stop offset="1" stop-color="${shot.colors[1]}"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#51240F" flood-opacity="0.28"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <circle cx="${format.width - 90}" cy="110" r="210" fill="#fff" opacity="0.08"/>
      <text x="${format.width / 2}" y="${firstY}" text-anchor="middle" fill="#fff" font-family="Apple SD Gothic Neo, sans-serif" font-size="${titleSize}" font-weight="800">${xml(lines[0])}</text>
      <text x="${format.width / 2}" y="${firstY + lineGap}" text-anchor="middle" fill="#fff" font-family="Apple SD Gothic Neo, sans-serif" font-size="${titleSize}" font-weight="800">${xml(lines[1])}</text>
      <text x="${format.width / 2}" y="${firstY + lineGap + (format.platform === 'apple' ? 58 : 44)}" text-anchor="middle" fill="#fff" opacity="0.86" font-family="Apple SD Gothic Neo, sans-serif" font-size="${tagSize}" font-weight="700">${locale === 'ko' ? '소랑제주 · 사랑할수록 깊어지는 제주' : 'SORANG JEJU · LOVE JEJU DEEPER'}</text>
      <rect x="${phoneLeft}" y="${shadowY}" width="${format.phoneWidth}" height="${shadowHeight}" rx="${format.radius}" fill="#3A2115" opacity="0.22" filter="url(#shadow)"/>
    </svg>`);
}

for (const shot of shots) {
  const input = path.join(sourceRoot, `${shot.file}.png`);
  await access(input);
  for (const format of formats) {
    const phone = await roundedScreenshot(input, format.phoneWidth, format.radius);
    for (const locale of ['ko', 'en-US']) {
      const lines = locale === 'ko' ? shot.ko : shot.en;
      const outputDirectory = format.platform === 'apple'
        ? path.join(root, 'fastlane/screenshots', locale)
        : path.join(root, 'fastlane/metadata/android', locale === 'ko' ? 'ko-KR' : locale, 'images/phoneScreenshots');
      await mkdir(outputDirectory, { recursive: true });
      await sharp(backgroundSvg(format, shot, lines, locale, phone.height))
        .composite([{ input: phone.image, left: Math.round((format.width - format.phoneWidth) / 2), top: format.phoneTop }])
        .png({ compressionLevel: 9 })
        .toFile(path.join(outputDirectory, `${shot.file}.png`));
    }
  }
}

console.log('Generated 20 localized Apple and Google store screenshots from 5 real app captures.');
