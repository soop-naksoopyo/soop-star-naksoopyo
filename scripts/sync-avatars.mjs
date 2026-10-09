import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const avatarsDir = path.join(root, 'public', 'avatars');
const crestsDir = path.join(root, 'public', 'crests');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch (_err) {
  console.warn('[Sync] sharp module not available, will save raw buffers.');
}

function extractAllSoopIds() {
  const ids = new Set();
  const files = [
    path.join(root, 'src/lib/starCrewsData.ts'),
    path.join(root, 'src/data/independentStreamers.ts'),
    path.join(root, 'src/lib/calmmonData.ts'),
    path.join(root, 'src/data/septemberStarCrews.ts'),
  ];

  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    for (const m of content.matchAll(/"soopId":\s*"([^"]+)"/g)) {
      ids.add(m[1].toLowerCase().trim());
    }
    for (const m of content.matchAll(/soopId:\s*['"]([^'"]+)['"]/g)) {
      ids.add(m[1].toLowerCase().trim());
    }
  }

  // 캄몬 수장 김윤환 보장
  ids.add('brainzerg7');

  return Array.from(ids).sort();
}

async function fetchAvatar(soopId) {
  const cleanId = soopId.toLowerCase().trim();
  const url = `https://profile.img.sooplive.co.kr/LOGO/${cleanId.slice(0, 2)}/${cleanId}/${cleanId}.jpg`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.sooplive.co.kr/',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, status: res.status, error: `HTTP ${res.status}` };
    }

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    if (rawBuffer.length < 50) {
      return { success: false, error: 'Empty image' };
    }

    let finalBuffer = rawBuffer;
    if (sharp) {
      finalBuffer = await sharp(rawBuffer)
        .resize(96, 96, { fit: 'cover' })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    }

    return { success: true, buffer: finalBuffer };
  } catch (err) {
    clearTimeout(timeoutId);
    return { success: false, error: err.message || 'Fetch error' };
  }
}

async function syncAvatars(options = {}) {
  const { force = false, targetId = null } = options;
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  const allIds = targetId ? [targetId] : extractAllSoopIds();
  console.log(`[Avatar Sync] Checking ${allIds.length} streamer avatars... (force=${force})`);

  let alreadyCached = 0;
  let newlyDownloaded = 0;
  let failed = 0;
  const failedList = [];

  const toFetch = [];
  for (const soopId of allIds) {
    const filePath = path.join(avatarsDir, `${soopId}.jpg`);
    if (!force && fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 100) {
        alreadyCached++;
        continue;
      }
    }
    toFetch.push(soopId);
  }

  console.log(`[Avatar Sync] ${alreadyCached} already cached. Downloading ${toFetch.length} missing avatars...`);

  const CONCURRENCY = 8;
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const chunk = toFetch.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (soopId) => {
        const filePath = path.join(avatarsDir, `${soopId}.jpg`);
        const result = await fetchAvatar(soopId);
        if (result.success) {
          fs.writeFileSync(filePath, result.buffer);
          newlyDownloaded++;
          process.stdout.write(`✓ ${soopId} `);
        } else {
          failed++;
          failedList.push({ soopId, error: result.error });
          process.stdout.write(`✗ ${soopId} `);
        }
      })
    );
  }

  console.log('\n--- Avatar Sync Finished ---');
  console.log(`Total: ${allIds.length} | Cached: ${alreadyCached} | Downloaded: ${newlyDownloaded} | Failed: ${failed}`);
  if (failedList.length > 0) {
    console.warn(`[Avatar Sync] Failed IDs:`, failedList);
  }
}

/**
 * 대학/크루 엠블럼 동기화
 */
async function syncCrests(options = {}) {
  const { force = false } = options;
  if (!fs.existsSync(crestsDir)) {
    fs.mkdirSync(crestsDir, { recursive: true });
  }

  console.log(`[Crest Sync] Checking university emblems from eloboard... (force=${force})`);

  try {
    const res = await fetch('https://eloboard.co.kr/', {
      headers: { 'User-Agent': USER_AGENT },
    });
    const html = await res.text();

    // Eloboard의 대학 목록 및 엠블럼 경로 파싱 (RSC JSON 이스케이프 지원)
    // 예: \"id\":90,\"name\":\"소병대\",\"image_path\":\"colleges/90_8507a5e5.png\"
    const collegePattern =
      /\\?"id\\?":\s*(\d+),\s*\\?"name\\?":\s*\\?"([^"\\]+)\\?",\s*\\?"image_path\\?":\s*\\?"colleges\/([^"\\]+)\\?"/g;
    const matches = [...html.matchAll(collegePattern)];

    console.log(`[Crest Sync] Found ${matches.length} colleges on eloboard.`);

    let crestDownloaded = 0;
    let crestCached = 0;

    for (const match of matches) {
      const collegeId = match[1];
      const collegeName = match[2];
      const imageFile = match[3];
      const localFileName = `${collegeId}.png`;
      const localFilePath = path.join(crestsDir, localFileName);

      if (!force && fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 100) {
        crestCached++;
        continue;
      }

      const imageUrl = `https://eloboard.co.kr/static/colleges/${imageFile}`;
      try {
        const imgRes = await fetch(imageUrl, {
          headers: { 'User-Agent': USER_AGENT, Referer: 'https://eloboard.co.kr/' },
        });
        if (imgRes.ok) {
          const rawBuffer = Buffer.from(await imgRes.arrayBuffer());
          let finalBuffer = rawBuffer;
          if (sharp) {
            finalBuffer = await sharp(rawBuffer)
              .resize(128, 128, { fit: 'inside' })
              .png({ compressionLevel: 9 })
              .toBuffer();
          }
          fs.writeFileSync(localFilePath, finalBuffer);
          crestDownloaded++;
          console.log(`✓ [Crest] ${collegeName} (#${collegeId}) -> /crests/${localFileName}`);
        }
      } catch (err) {
        console.warn(`✗ [Crest] Failed to download ${collegeName}:`, err.message);
      }
    }

    console.log(`--- Crest Sync Finished: Cached: ${crestCached} | Downloaded: ${crestDownloaded} ---`);
  } catch (err) {
    console.error(`[Crest Sync] Failed to fetch eloboard page:`, err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const targetId = args.find((a) => !a.startsWith('--'))?.toLowerCase().trim();
  const onlyCrests = args.includes('--crests');
  const onlyAvatars = args.includes('--avatars');

  if (onlyCrests) {
    await syncCrests({ force });
  } else if (onlyAvatars || targetId) {
    await syncAvatars({ force, targetId });
  } else {
    // 기본적으로 아바타와 엠블럼 둘 다 동기화
    await syncAvatars({ force });
    await syncCrests({ force });
  }
}

main().catch((err) => {
  console.error('[Asset Sync] Fatal error:', err);
  process.exit(1);
});
