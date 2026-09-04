export const ANALYTICS_TIME_ZONE = "Asia/Shanghai";
const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export function analyticsDay(value) {
  const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function analyticsWindow(now) {
  const today = analyticsDay(now);
  const midnight = new Date(`${today}T00:00:00.000Z`).getTime();
  const days = Array.from({ length: 7 }, (_, index) => new Date(midnight - (6 - index) * 86_400_000).toISOString().slice(0, 10));
  const monthStart = `${today.slice(0, 7)}-01`;
  return { today, days, monthStart, from: days[0] < monthStart ? days[0] : monthStart };
}

export function summarizeVisits(rows, trackingStartedAt, now) {
  const { today, days, monthStart } = analyticsWindow(now);
  const counts = new Map(rows.map(row => [typeof row.day === "string" ? row.day.slice(0, 10) : new Date(row.day).toISOString().slice(0, 10), Number(row.resource_views) + Number(row.article_views)]));
  const trackingDay = analyticsDay(trackingStartedAt);
  const monthViews = [...counts].reduce((sum, [day, views]) => sum + (day >= monthStart && day <= today ? views : 0), 0);
  return {
    monthViews,
    trend: days.map(day => ({ day, views: day < trackingDay ? null : (counts.get(day) || 0) })),
    trackingStartedAt: new Date(trackingStartedAt).toISOString(),
    updatedAt: new Date(now).toISOString(),
    timeZone: ANALYTICS_TIME_ZONE,
  };
}
