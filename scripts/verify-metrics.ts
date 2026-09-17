import assert from "node:assert";
import { computeMetrics, hasRecentActivity, isWithinDays } from "./lib/metrics";
import { parseIso8601Duration } from "./lib/duration";
import type { Video } from "../src/lib/types";

const now = new Date("2026-09-17T00:00:00Z").getTime();

assert.strictEqual(parseIso8601Duration("PT45S"), 45);
assert.strictEqual(parseIso8601Duration("PT4M13S"), 253);
assert.strictEqual(parseIso8601Duration("PT1H2M3S"), 3723);
assert.strictEqual(parseIso8601Duration("PT0S"), 0);

assert.strictEqual(isWithinDays(new Date(now - 10 * 86400000).toISOString(), 30, now), true);
assert.strictEqual(isWithinDays(new Date(now - 40 * 86400000).toISOString(), 30, now), false);

const videos: Video[] = Array.from({ length: 35 }, (_, i) => ({
  id: `v${i}`,
  channelId: "c1",
  publishedAt: new Date(now - i * 2 * 86400000).toISOString(), // 0,2,4,...68 days ago
  viewCount: 1000 + i,
  duration: 300,
  isShort: false,
  isLiveArchive: false,
}));

assert.strictEqual(hasRecentActivity(videos, now), true);
assert.strictEqual(hasRecentActivity([], now), false);

const metrics = computeMetrics(videos, now);
// last 30 videos (most recent by publishedAt) -> indices 0..29, viewCounts 1000..1029
const expectedLast30Avg = Math.round(
  Array.from({ length: 30 }, (_, i) => 1000 + i).reduce((a, b) => a + b, 0) / 30
);
assert.strictEqual(metrics.avgViewsLast30Videos, expectedLast30Avg);

// within 30 days: i*2 <= 30 -> i <= 15 -> 16 videos (i=0..15)
assert.strictEqual(metrics.last30DaysVideoCount, 16);
const expectedLast30DaysAvg = Math.round(
  Array.from({ length: 16 }, (_, i) => 1000 + i).reduce((a, b) => a + b, 0) / 16
);
assert.strictEqual(metrics.avgViewsLast30Days, expectedLast30DaysAvg);

assert.deepStrictEqual(computeMetrics([], now), {
  avgViewsLast30Videos: 0,
  avgViewsLast30Days: 0,
  last30DaysVideoCount: 0,
});

console.log("All metrics assertions passed.");
