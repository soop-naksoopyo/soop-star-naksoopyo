import { describe, expect, it } from 'vitest';
import { getShardIndexForMinute, getShardRange, getShardWindowStart } from './sharding';

describe('getShardRange', () => {
  it('distributes 238 streamers across five shards without gaps or overlap', () => {
    const ranges = Array.from({ length: 5 }, (_, shard) => getShardRange(238, shard, 5));

    expect(ranges.map(({ start, end }) => end - start)).toEqual([48, 48, 48, 47, 47]);
    expect(ranges[0].start).toBe(0);
    expect(ranges[4].end).toBe(238);
    expect(ranges.slice(1).map((range, index) => range.start - ranges[index].end)).toEqual([0, 0, 0, 0]);
  });

  it('assigns fewer rows to the final shard when the roster is smaller', () => {
    const ranges = Array.from({ length: 5 }, (_, shard) => getShardRange(222, shard, 5));

    expect(ranges.map(({ start, end }) => end - start)).toEqual([45, 45, 44, 44, 44]);
  });

  it('rejects shard indices outside the configured range', () => {
    expect(() => getShardRange(236, 5, 5)).toThrow(RangeError);
  });

  it('rotates one auto shard each minute and aligns seven-minute windows', () => {
    const periodMs = 7 * 60_000;
    const firstWindow = Math.floor(Date.UTC(2026, 9, 4, 12, 0) / periodMs) * periodMs;
    const timestamps = Array.from({ length: 7 }, (_, minute) => firstWindow + minute * 60_000);

    expect(new Set(timestamps.map((timestamp) => getShardIndexForMinute(timestamp, 7))).size).toBe(7);
    expect(timestamps.map((timestamp) => getShardWindowStart(timestamp, 7))).toEqual(Array(7).fill(firstWindow));
    expect(getShardWindowStart(firstWindow + periodMs, 7)).toBe(firstWindow + periodMs);
  });

  it('divides the current 237-streamer roster evenly into seven shards', () => {
    const ranges = Array.from({ length: 7 }, (_, shard) => getShardRange(237, shard, 7));

    expect(ranges.map(({ start, end }) => end - start)).toEqual([34, 34, 34, 34, 34, 34, 33]);
    expect(ranges[0].start).toBe(0);
    expect(ranges[6].end).toBe(237);
  });
});
