import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const excludedSoopIds = new Set();

function getTargetMonth() {
  const argument = process.argv[2]?.slice(0, 7);
  if (argument && monthPattern.test(argument)) return argument;
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
}

function readArrayExport(filePath, exportName, typePattern = 'StarCrewGroup\\[\\]') {
  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`export const ${exportName}:\\s*${typePattern}\\s*=\\s*(\\[[\\s\\S]*?\\]);\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) throw new Error(`Could not read ${exportName}`);
  return { content, pattern, data: JSON.parse(match[1]) };
}

function readObjectExport(filePath, exportName, typePattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`export const ${exportName}:\\s*${typePattern}\\s*=\\s*(\\{[\\s\\S]*?\\});\\s*$`, 'm');
  const match = content.match(pattern);
  if (!match) throw new Error(`Could not read ${exportName}`);
  return { content, pattern, data: JSON.parse(match[1]) };
}

function getRoster(yearMonth) {
  const septemberArchive = yearMonth === '2026-09';
  const crews = readArrayExport(
    path.join(root, septemberArchive ? 'src/data/septemberStarCrews.ts' : 'src/lib/starCrewsData.ts'),
    septemberArchive ? 'SEPTEMBER_2026_STAR_CREWS' : 'OFFICIAL_STAR_CREWS',
  ).data;
  const independentByMonth = readObjectExport(
    path.join(root, 'src/data/independentStreamers.ts'),
    'INDEPENDENT_STREAMERS_BY_MONTH',
    'Record<string,\\s*StreamerRowData\\[\\]>',
  ).data;
  const nicknameOverrides = septemberArchive
    ? readObjectExport(
      path.join(root, 'src/data/septemberCurrentNicknames.ts'),
      'SEPTEMBER_CURRENT_NICKNAMES',
      'Record<string,\\s*string>',
    ).data
    : {};
  const byId = new Map();

  for (const crew of crews) {
    for (const member of crew.members) {
      const soopId = member.soopId.toLowerCase();
      if (excludedSoopIds.has(soopId)) continue;
      byId.set(soopId, {
        soopId,
        nickname: nicknameOverrides[soopId] || member.nickname,
        profileImageUrl: member.profileImageUrl || null,
        crewName: crew.crewName,
      });
    }
  }

  for (const member of independentByMonth[yearMonth] || []) {
    const soopId = member.soopId.toLowerCase();
    if (excludedSoopIds.has(soopId)) continue;
    if (!byId.has(soopId)) {
      byId.set(soopId, {
        soopId,
        nickname: member.nickname,
        profileImageUrl: member.profileImageUrl || null,
        crewName: null,
      });
    }
  }

  return Array.from(byId.values());
}

async function fetchViewership(streamer, yearMonth, retryCount = 0) {
  const [targetYear, targetMonthNum] = yearMonth.split('-');

  const statsUrl = `https://soopscope.com/api/streamer/${encodeURIComponent(streamer.soopId)}/stats?year=${targetYear}&month=${Number(targetMonthNum)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  const headers = {
    'User-Agent': userAgent,
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': `https://soopscope.com/streamer/${encodeURIComponent(streamer.soopId)}`,
    'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  try {
    const statsRes = await fetch(statsUrl, { headers, signal: controller.signal });

    if (!statsRes.ok) return { error: `http_${statsRes.status}` };

    const payload = await statsRes.json();
    if (!payload || typeof payload !== 'object' || !('current' in payload)) return { error: 'missing_current' };
    const current = payload.current && typeof payload.current === 'object' ? payload.current : {};

    const numberOrZero = (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
    };

    const totalStars = numberOrZero(current.totalStars);

    const averageViewers = numberOrZero(current.avgViewers);
    const broadcastMinutes = numberOrZero(current.minutes);

    return { row: {
      ...streamer,
      totalStars,
      starsSource: 'stats',
      averageViewers,
      totalViewers: numberOrZero(current.totalViewers),
      peakViewers: numberOrZero(current.peak),
      broadcastMinutes,
      viewerShip: Math.round((averageViewers * broadcastMinutes) / 60),
      fetchedAt: new Date().toISOString(),
      collectionStatus: 'available',
      viewershipStatus: 'available',
    } };
  } catch (error) {
    if (retryCount < 2) {
      clearTimeout(timeout);
      await new Promise((resolve) => setTimeout(resolve, 3000 * (retryCount + 1)));
      return fetchViewership(streamer, yearMonth, retryCount + 1);
    }
    return { error: error?.name === 'AbortError' ? 'timeout' : 'network_or_json_error' };
  } finally {
    clearTimeout(timeout);
  }
}

async function saveAndSyncSnapshots({
  yearMonth,
  roster,
  newlyFetchedIds,
  mergedMap,
  archives,
  content,
  pattern,
  archivePath,
  durationSeconds = 60,
  completedShards = 1,
  expectedShards = 1,
  failures = new Map(),
}) {
  const currentMonth = (() => {
    const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
  })();

  const rosterIds = new Set(roster.map((r) => r.soopId.toLowerCase()));
  const streamers = Array.from(mergedMap.values()).filter((s) => rosterIds.has(s.soopId.toLowerCase()));
  console.log(`[SoopScope Sync] Processing ${streamers.length}/${roster.length} streamers (newly fetched: ${newlyFetchedIds.size}) for ${yearMonth}`);

  if (newlyFetchedIds.size > 0) {
    archives[yearMonth] = {
      yearMonth,
      updatedAt: new Date().toISOString(),
      requestedCount: roster.length,
      fetchedCount: newlyFetchedIds.size,
      failedCount: Math.max(0, roster.length - newlyFetchedIds.size),
      streamers: streamers.sort((a, b) =>
        (a.crewName || '\uffff').localeCompare(b.crewName || '\uffff', 'ko')
        || a.nickname.localeCompare(b.nickname, 'ko')),
    };

    const updatedContent = content.replace(
      pattern,
      `export const VIEWERSHIP_MONTHLY_SNAPSHOTS: Record<string, ViewershipMonthlySnapshot> = ${JSON.stringify(archives, null, 2)};\n`,
    );
    fs.writeFileSync(archivePath, updatedContent, 'utf8');
    console.log(`[SoopScope Sync] Saved ${streamers.length} streamers to ${archivePath}`);
  } else {
    console.warn(`[SoopScope Sync] ⚠️ 0 streamers fetched in this run. Retaining existing snapshot without touching updatedAt.`);
  }

  let runLogEntry = null;
  // 1. Sync Log 기록 (src/data/syncLogs.ts)
  try {
    const logPath = path.join(root, 'src/data/syncLogs.ts');
    let existingLogs = [];
    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      const match = logContent.match(/export const SYNC_LOG_HISTORY:\s*SyncLogEntry\[\]\s*=\s*(\[[\s\S]*?\]);\s*$/m);
      if (match) {
        try {
          existingLogs = JSON.parse(match[1]);
        } catch {
          try {
            existingLogs = new Function(`return ${match[1]}`)();
          } catch (err) {
            console.warn('[Sync Log] Fallback parse failed:', err.message);
          }
        }
      }
    }

    const uncollectedStreamers = [];
    for (const r of roster) {
      if (!newlyFetchedIds.has(r.soopId.toLowerCase())) {
        uncollectedStreamers.push({
          soopId: r.soopId,
          nickname: r.nickname,
          crewName: r.crewName || '무소속',
          reason: failures.get(r.soopId.toLowerCase()) || '수집 실패',
        });
      }
    }

    const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const kstTime = kstDate.toISOString().replace('T', ' ').slice(0, 19);
    const isManual = Boolean(process.argv[2] && process.env.GITHUB_EVENT_NAME === 'workflow_dispatch');

    const entryStatus = newlyFetchedIds.size === 0
      ? 'failed'
      : newlyFetchedIds.size >= roster.length
        ? 'success'
        : 'partial';

    const effectiveFetchedCount = newlyFetchedIds.size;
    const effectiveFailedCount = roster.length - newlyFetchedIds.size;

    const newLogEntry = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toISOString(),
      kstTime,
      yearMonth,
      trigger: isManual ? 'manual' : 'schedule',
      status: entryStatus,
      requestedCount: roster.length,
      fetchedCount: effectiveFetchedCount,
      failedCount: effectiveFailedCount,
      failedStreamers: uncollectedStreamers.slice(0, 50),
      durationSeconds,
      note: Array.from(failures.values()).some((reason) => reason.includes('http_403'))
        ? `${yearMonth} SoopScope API가 HTTP 403을 반환해 수집을 중단하고 기존 스냅샷을 유지함`
        : Array.from(failures.values()).some((reason) => reason.includes('http_429'))
          ? `${yearMonth} SoopScope API가 HTTP 429를 반환해 수집을 중단하고 기존 스냅샷을 유지함`
          : newlyFetchedIds.size === 0
            ? `${yearMonth} 수집 실패 (0명 수집됨)`
            : newlyFetchedIds.size < roster.length
              ? `${yearMonth} 부분 수집 (${newlyFetchedIds.size}/${roster.length}명 성공)`
              : `${yearMonth} 전원 정상 수집 완료 (${newlyFetchedIds.size}명)`,
    };
    runLogEntry = newLogEntry;

    const updatedLogs = [newLogEntry, ...existingLogs.filter((l) => l.id !== newLogEntry.id)].slice(0, 200);
    const newLogContent = `import type { SyncLogEntry } from '@/types/sync';\nexport type { SyncLogEntry, FailedStreamerInfo } from '@/types/sync';\n\nexport const SYNC_LOG_HISTORY: SyncLogEntry[] = ${JSON.stringify(updatedLogs, null, 2)};\n`;
    fs.writeFileSync(logPath, newLogContent, 'utf8');
    console.log(`[Sync Log] Recorded run log: ${entryStatus} (${newlyFetchedIds.size}/${roster.length}) to ${logPath}`);
  } catch (logErr) {
    console.warn('[Sync Log] Failed writing sync log:', logErr.message);
  }

  // 2. starCrewsData.ts & independentStreamers.ts 동기화
  if (yearMonth === currentMonth && newlyFetchedIds.size > 0) {
    const starCrewsPath = path.join(root, 'src/lib/starCrewsData.ts');
    const soopMap = new Map(streamers.map((s) => [s.soopId.toLowerCase(), s]));
    const { content: starCrewsContent, pattern: starPattern, data: starCrews } = readArrayExport(
      starCrewsPath,
      'OFFICIAL_STAR_CREWS',
    );
    for (const crew of starCrews) {
      for (const member of crew.members) {
        const official = soopMap.get(member.soopId.toLowerCase());
        if (official) {
          member.totalStars = official.totalStars || 0;
          member.broadcastHours = official.broadcastMinutes > 0 ? Math.round((official.broadcastMinutes / 60) * 10) / 10 : 0;
        }
      }
    }
    const updatedCrewContent = starCrewsContent.replace(
      starPattern,
      `export const OFFICIAL_STAR_CREWS: StarCrewGroup[] = ${JSON.stringify(starCrews, null, 2)};\n`,
    );
    fs.writeFileSync(starCrewsPath, updatedCrewContent, 'utf8');
    console.log(`[SoopScope Sync] Synchronized ${starCrewsPath} with latest ${yearMonth} data!`);

    const indepPath = path.join(root, 'src/data/independentStreamers.ts');
    const { content: indepContent, pattern: indepPattern, data: indepMap } = readObjectExport(
      indepPath,
      'INDEPENDENT_STREAMERS_BY_MONTH',
      'Record<string,\\s*StreamerRowData\\[\\]>',
    );
    if (Array.isArray(indepMap[yearMonth])) {
      for (const member of indepMap[yearMonth]) {
        const official = soopMap.get(member.soopId.toLowerCase());
        if (official) {
          member.totalStars = official.totalStars || 0;
          member.broadcastHours = official.broadcastMinutes > 0 ? Math.round((official.broadcastMinutes / 60) * 10) / 10 : 0;
        }
      }
      const updatedIndepContent = indepContent.replace(
        indepPattern,
        `export const INDEPENDENT_STREAMERS_BY_MONTH: Record<string, StreamerRowData[]> = ${JSON.stringify(indepMap, null, 2)};\n`,
      );
      fs.writeFileSync(indepPath, updatedIndepContent, 'utf8');
      console.log(`[SoopScope Sync] Synchronized ${indepPath} with latest ${yearMonth} data!`);
    }
  }

  // 3. Supabase 원격 DB 동기화
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      if (newlyFetchedIds.size > 0) {
        const records = streamers.map((s) => ({
          year_month: yearMonth,
          soop_id: s.soopId,
          nickname: s.nickname,
          profile_image_url: s.profileImageUrl || null,
          crew_name: s.crewName || null,
          average_viewers: s.averageViewers || 0,
          total_viewers: s.totalViewers || 0,
          peak_viewers: s.peakViewers || 0,
          broadcast_minutes: s.broadcastMinutes || 0,
          stars_broadcast_minutes: s.broadcastMinutes || 0,
          viewer_ship: s.viewerShip || 0,
          total_stars: s.totalStars || 0,
          stars_source: s.starsSource || 'canonical',
          fetched_at: s.fetchedAt || new Date().toISOString(),
          viewership_status: 'available',
          collection_status: 'available',
        }));

        const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_monthly_snapshots?on_conflict=year_month,soop_id`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(records),
        });

        if (!res.ok) {
          console.error(`[SoopScope Sync] Supabase REST API error (${res.status}):`, await res.text());
        } else {
          console.log(`[SoopScope Sync] Successfully synced ${records.length} records to Supabase (${yearMonth})!`);
        }
      }

    } catch (err) {
      console.error('[SoopScope Sync] Failed syncing to Supabase:', err.message);
    }
  }

  if (supabaseUrl && supabaseKey && runLogEntry) {
    const logResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/soopscope_sync_logs?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{ id: runLogEntry.id, timestamp: runLogEntry.timestamp, payload: runLogEntry }]),
    });
    if (!logResponse.ok) throw new Error(`[Sync Log] Database write failed (HTTP ${logResponse.status})`);
    console.log(`[Sync Log] Persisted ${runLogEntry.id} to Supabase.`);
  } else if (process.env.GITHUB_ACTIONS === 'true') {
    throw new Error('[Sync Log] Supabase credentials or run log are unavailable.');
  }
}

async function main() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentMonth = `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
  const yearMonth = getTargetMonth();
  const roster = getRoster(yearMonth);
  if (roster.length === 0) throw new Error(`No viewership roster for ${yearMonth}`);

  const archivePath = path.join(root, 'src/data/viewershipSnapshots.ts');
  const { content, pattern, data: archives } = readObjectExport(
    archivePath,
    'VIEWERSHIP_MONTHLY_SNAPSHOTS',
    'Record<string,\\s*ViewershipMonthlySnapshot>',
  );

  // 1. Shards 병합 모드 (--merge=dir)
  const mergeArg = process.argv.find((a) => a.startsWith('--merge='));
  if (mergeArg) {
    const mergeDir = path.resolve(root, mergeArg.split('=')[1]);
    const files = fs.readdirSync(mergeDir, { recursive: true })
      .filter((f) => typeof f === 'string' && f.endsWith('.json'))
      .map((f) => path.join(mergeDir, f));

    console.log(`[SoopScope Merge] Found ${files.length} shard files in ${mergeDir}`);
    const previous = archives[yearMonth];
    const mergedMap = new Map((previous?.streamers || []).map((s) => [s.soopId.toLowerCase(), s]));
    const newlyFetchedIds = new Set();
    for (const file of files) {
      try {
        const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (Array.isArray(rows)) {
          for (const row of rows) {
            if (row && row.soopId && !excludedSoopIds.has(row.soopId.toLowerCase())) {
              const soopId = row.soopId.toLowerCase();
              newlyFetchedIds.add(soopId);
              const existing = mergedMap.get(soopId);
              if (existing) {
                // 누적 지표(별풍선, 방송시간) 보호: 일시 장애로 0이 반환될 경우 기존 최대치 보존
                if ((row.totalStars || 0) < (existing.totalStars || 0) && (existing.totalStars || 0) > 0) {
                  row.totalStars = existing.totalStars;
                  row.starsSource = existing.starsSource;
                }
                if ((row.broadcastMinutes || 0) < (existing.broadcastMinutes || 0) && (existing.broadcastMinutes || 0) > 0) {
                  row.broadcastMinutes = existing.broadcastMinutes;
                }
                if ((row.averageViewers || 0) === 0 && (existing.averageViewers || 0) > 0) {
                  row.averageViewers = existing.averageViewers;
                }
                row.viewerShip = Math.round(((row.averageViewers || 0) * (row.broadcastMinutes || 0)) / 60);
              }
              mergedMap.set(soopId, row);
            }
          }
        }
      } catch (err) {
        console.warn(`[SoopScope Merge] Failed reading ${file}:`, err.message);
      }
    }

    const rosterIds = new Set(roster.map((r) => r.soopId.toLowerCase()));
    const streamers = Array.from(mergedMap.values()).filter((s) => rosterIds.has(s.soopId.toLowerCase()));
    console.log(`[SoopScope Merge] Merged ${streamers.length}/${roster.length} unique streamers (newly fetched: ${newlyFetchedIds.size}) for ${yearMonth}`);

    await saveAndSyncSnapshots({
      yearMonth,
      roster,
      newlyFetchedIds,
      mergedMap,
      archives,
      content,
      pattern,
      archivePath,
      completedShards: files.length || 10,
      expectedShards: 10,
    });
    return;
  }

  // 2. 단일 또는 샤드별 수집 모드
  const shardArg = process.argv.find((a) => a.startsWith('--shard='));
  let targetRoster = roster;
  if (shardArg) {
    const [indexStr, totalStr] = shardArg.split('=')[1].split('/');
    const shardIndex = parseInt(indexStr, 10);
    const totalShards = parseInt(totalStr, 10);
    const chunkSize = Math.ceil(roster.length / totalShards);
    const start = shardIndex * chunkSize;
    const end = Math.min(start + chunkSize, roster.length);
    targetRoster = roster.slice(start, end);
    console.log(`[SoopScope Shard ${shardIndex + 1}/${totalShards}] Roster ${start + 1} ~ ${end} (${targetRoster.length} streamers)`);
  }

  const collectedRows = [];
  const failures = new Map();
  const startTime = Date.now();
  let stoppedByLimit = false;
  const previousSnapshot = archives[yearMonth];
  const existingMap = new Map((previousSnapshot?.streamers || []).map((s) => [s.soopId.toLowerCase(), s]));

  console.log(`[Sync Engine] Fetching ${targetRoster.length} streamers from SoopScope stats API sequentially...`);
  for (let index = 0; index < targetRoster.length; index += 1) {
    const streamer = targetRoster[index];
    const soopId = streamer.soopId.toLowerCase();
    const existing = existingMap.get(soopId);
    const result = await fetchViewership(streamer, yearMonth);

    if (result.error) {
      failures.set(soopId, result.error);
      console.warn(`[SoopScope API] ${soopId}: ${result.error}`);
      if (result.error === 'http_403' || result.error === 'http_429') {
        stoppedByLimit = true;
        break;
      }
    } else {
      const row = result.row;
      if (existing) {
        row.totalStars = Math.max(row.totalStars || 0, existing.totalStars || 0);
        row.broadcastMinutes = Math.max(row.broadcastMinutes || 0, existing.broadcastMinutes || 0);
        row.viewerShip = Math.round(((row.averageViewers || 0) * (row.broadcastMinutes || 0)) / 60);
      }
      collectedRows.push(row);
    }

    if (index < targetRoster.length - 1) await new Promise((resolve) => setTimeout(resolve, 1250));
  }

  if (stoppedByLimit) {
    const stopSoopId = targetRoster.find((streamer) => failures.has(streamer.soopId.toLowerCase()))?.soopId.toLowerCase();
    const stopReason = failures.get(stopSoopId);
    console.warn(`[SoopScope API] ${stopReason} received; stopping this run and keeping the existing snapshot unchanged.`);
    collectedRows.length = 0;
    for (const streamer of targetRoster) {
      const existing = existingMap.get(streamer.soopId.toLowerCase());
      if (existing) collectedRows.push(existing);
    }
    failures.clear();
    for (const streamer of targetRoster) {
      const soopId = streamer.soopId.toLowerCase();
      failures.set(soopId, soopId === stopSoopId ? stopReason : `not_requested_after_${stopReason}`);
    }
  }

  // 3. Shard 개별 결과 파일 저장 (--output=path.json)
  const outputArg = process.argv.find((a) => a.startsWith('--output='));
  if (outputArg) {
    const outputPath = path.resolve(root, outputArg.split('=')[1]);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(collectedRows, null, 2), 'utf8');
    console.log(`[SoopScope Shard] Wrote ${collectedRows.length} rows to ${outputPath}`);
    return;
  }

  // 4. 단일 실행일 경우 로컬 스냅샷 + Supabase + 로그 통합 동기화
  const previous = archives[yearMonth];
  const mergedMap = new Map((previous?.streamers || []).map((s) => [s.soopId.toLowerCase(), s]));
  const newlyFetchedIds = new Set(collectedRows.filter((row) => !stoppedByLimit && !failures.has(row.soopId.toLowerCase())).map((row) => row.soopId.toLowerCase()));
  for (const row of collectedRows) {
    if (row && row.soopId && !excludedSoopIds.has(row.soopId.toLowerCase())) {
      const soopId = row.soopId.toLowerCase();
      const existing = mergedMap.get(soopId);
      if (existing) {
        if ((row.totalStars || 0) < (existing.totalStars || 0) && (existing.totalStars || 0) > 0) {
          row.totalStars = existing.totalStars;
          row.starsSource = existing.starsSource;
        }
        if ((row.broadcastMinutes || 0) < (existing.broadcastMinutes || 0) && (existing.broadcastMinutes || 0) > 0) {
          row.broadcastMinutes = existing.broadcastMinutes;
        }
        row.viewerShip = Math.round(((row.averageViewers || 0) * (row.broadcastMinutes || 0)) / 60);
      }
      mergedMap.set(soopId, row);
    }
  }

  const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
  await saveAndSyncSnapshots({
    yearMonth,
    roster,
    newlyFetchedIds,
    mergedMap,
    archives,
    content,
    pattern,
    archivePath,
    durationSeconds,
    completedShards: 1,
    expectedShards: 1,
    failures,
  });
  if (stoppedByLimit) process.exitCode = 1;
}

main().catch((error) => {
  console.error('[SoopScope Sync] failed:', error);
  process.exit(1);
});
