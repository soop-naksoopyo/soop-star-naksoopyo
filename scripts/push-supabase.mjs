import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetMonth = process.argv[2]?.slice(0, 7) || (() => {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
})();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Push Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const archivePath = path.join(root, 'src/data/viewershipSnapshots.ts');
const content = fs.readFileSync(archivePath, 'utf8');
const match = content.match(/export const VIEWERSHIP_MONTHLY_SNAPSHOTS:\s*Record<string,\s*ViewershipMonthlySnapshot>\s*=\s*(\{[\s\S]*?\});\s*$/m);
if (!match) {
  console.error('[Push Supabase] Could not parse VIEWERSHIP_MONTHLY_SNAPSHOTS');
  process.exit(1);
}

const snapshots = JSON.parse(match[1]);
const monthSnapshot = snapshots[targetMonth];

if (!monthSnapshot || !Array.isArray(monthSnapshot.streamers)) {
  console.error(`[Push Supabase] No streamers found for month ${targetMonth}`);
  process.exit(1);
}

const records = monthSnapshot.streamers.map((s) => ({
  year_month: targetMonth,
  soop_id: s.soopId,
  nickname: s.nickname,
  profile_image_url: s.profileImageUrl || null,
  crew_name: s.crewName || null,
  average_viewers: s.averageViewers || 0,
  total_viewers: s.totalViewers || 0,
  peak_viewers: s.peakViewers || 0,
  broadcast_minutes: s.broadcastMinutes || 0,
  viewer_ship: s.viewerShip || 0,
  total_stars: s.totalStars || 0,
  stars_source: s.starsSource || 'canonical',
  fetched_at: s.fetchedAt || new Date().toISOString(),
  viewership_status: s.viewershipStatus || 'available',
  collection_status: s.collectionStatus || 'available',
}));

console.log(`[Push Supabase] Pushing ${records.length} records for ${targetMonth} to Supabase...`);

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
  console.error(`[Push Supabase] Failed: HTTP ${res.status}:`, await res.text());
  process.exit(1);
}

console.log(`[Push Supabase] Successfully synced ${records.length} records for ${targetMonth} to Supabase!`);
