export function getShardRange(totalCount: number, shardIndex: number, shardCount: number) {
  if (!Number.isInteger(totalCount) || totalCount < 0) throw new RangeError('totalCount must be a non-negative integer');
  if (!Number.isInteger(shardCount) || shardCount < 1) throw new RangeError('shardCount must be a positive integer');
  if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
    throw new RangeError('shardIndex must be within the shard count');
  }

  const baseSize = Math.floor(totalCount / shardCount);
  const remainder = totalCount % shardCount;
  const start = shardIndex * baseSize + Math.min(shardIndex, remainder);
  return { start, end: start + baseSize + (shardIndex < remainder ? 1 : 0) };
}

export function getShardIndexForMinute(timestampMs: number, shardCount: number) {
  if (!Number.isFinite(timestampMs) || timestampMs < 0) throw new RangeError('timestampMs must be non-negative');
  if (!Number.isInteger(shardCount) || shardCount < 1) throw new RangeError('shardCount must be a positive integer');
  return Math.floor(timestampMs / 60_000) % shardCount;
}

export function getShardWindowStart(timestampMs: number, shardCount: number) {
  if (!Number.isFinite(timestampMs) || timestampMs < 0) throw new RangeError('timestampMs must be non-negative');
  if (!Number.isInteger(shardCount) || shardCount < 1) throw new RangeError('shardCount must be a positive integer');
  const windowMs = shardCount * 60_000;
  return Math.floor(timestampMs / windowMs) * windowMs;
}
