import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Bucket = {
  label: string;
  count: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

const toDbTimestamp = (date: Date) => {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-")
    + " "
    + [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join(":");
};

const formatHourKey = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}`;

const formatDayKey = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const formatMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;

const formatDayLabel = (date: Date) =>
  `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}`;

const formatMonthLabel = (date: Date) =>
  `${pad(date.getUTCMonth() + 1)}.${String(date.getUTCFullYear()).slice(2)}`;

const getCounts = (format: string, start: string, end: string) => {
  const rows = db
    .prepare(
      `
        SELECT strftime(?, created_at) as bucket, COUNT(*) as count
        FROM pageviews
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY bucket
      `
    )
    .all(format, start, end) as Array<{ bucket: string; count: number }>;

  const map = new Map<string, number>();
  rows.forEach((row) => map.set(row.bucket, row.count));
  return map;
};

const buildHourlyBuckets = (now: Date) => {
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  const start = new Date(end);
  start.setUTCHours(end.getUTCHours() - 23, 0, 0, 0);

  const counts = getCounts("%Y-%m-%d %H", toDbTimestamp(start), toDbTimestamp(end));
  const buckets: Bucket[] = [];

  for (let i = 0; i < 24; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCHours(start.getUTCHours() + i);
    const key = formatHourKey(cursor);
    buckets.push({
      label: pad(cursor.getUTCHours()),
      count: counts.get(key) ?? 0,
    });
  }

  return buckets;
};

const buildDailyBuckets = (now: Date, days: number) => {
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - (days - 1),
    0,
    0,
    0
  ));

  const counts = getCounts("%Y-%m-%d", toDbTimestamp(start), toDbTimestamp(end));
  const buckets: Bucket[] = [];

  for (let i = 0; i < days; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCDate(start.getUTCDate() + i);
    const key = formatDayKey(cursor);
    buckets.push({
      label: formatDayLabel(cursor),
      count: counts.get(key) ?? 0,
    });
  }

  return buckets;
};

const buildMonthlyBuckets = (now: Date) => {
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - 11,
    1,
    0,
    0,
    0
  ));

  const counts = getCounts("%Y-%m", toDbTimestamp(start), toDbTimestamp(end));
  const buckets: Bucket[] = [];

  for (let i = 0; i < 12; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCMonth(start.getUTCMonth() + i);
    const key = formatMonthKey(cursor);
    buckets.push({
      label: formatMonthLabel(cursor),
      count: counts.get(key) ?? 0,
    });
  }

  return buckets;
};

const buildDailyEventBuckets = (now: Date, days: number, name: string) => {
  const end = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  const start = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - (days - 1),
    0,
    0,
    0
  ));

  const rows = db
    .prepare(
      `
        SELECT strftime('%Y-%m-%d', created_at) as bucket, COUNT(*) as count
        FROM events
        WHERE created_at >= ? AND created_at <= ? AND name = ?
        GROUP BY bucket
      `
    )
    .all(toDbTimestamp(start), toDbTimestamp(end), name) as Array<{ bucket: string; count: number }>;

  const map = new Map<string, number>();
  rows.forEach((row) => map.set(row.bucket, row.count));
  const buckets: Bucket[] = [];

  for (let i = 0; i < days; i += 1) {
    const cursor = new Date(start);
    cursor.setUTCDate(start.getUTCDate() + i);
    const key = formatDayKey(cursor);
    buckets.push({
      label: formatDayLabel(cursor),
      count: map.get(key) ?? 0,
    });
  }

  return buckets;
};

const countEvents = (name: string, start?: string) => {
  if (start) {
    const row = db
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM events
          WHERE name = ? AND created_at >= ?
        `
      )
      .get(name, start) as { count: number };
    return row?.count ?? 0;
  }
  const row = db
    .prepare(
      `
        SELECT COUNT(*) as count
        FROM events
        WHERE name = ?
      `
    )
    .get(name) as { count: number };
  return row?.count ?? 0;
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const last24Hours = buildHourlyBuckets(now);
  const last7Days = buildDailyBuckets(now, 7);
  const last30Days = buildDailyBuckets(now, 30);
  const last365Days = buildMonthlyBuckets(now);
  const ctaLast7Buckets = buildDailyEventBuckets(now, 7, "cta_contact");
  const last7Start = toDbTimestamp(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0))
  );
  const last30Start = toDbTimestamp(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29, 0, 0, 0))
  );

  const total = (buckets: Bucket[]) =>
    buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return NextResponse.json({
    last24Hours: { buckets: last24Hours, total: total(last24Hours) },
    last7Days: { buckets: last7Days, total: total(last7Days) },
    last30Days: { buckets: last30Days, total: total(last30Days) },
    last365Days: { buckets: last365Days, total: total(last365Days) },
    events: {
      ctaTotal: countEvents("cta_contact"),
      ctaServicesTotal: countEvents("cta_services"),
      ctaLast7Days: countEvents("cta_contact", last7Start),
      ctaLast30Days: countEvents("cta_contact", last30Start),
      ctaLast7Buckets,
    },
  });
}
