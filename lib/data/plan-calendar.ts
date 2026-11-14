import type { SeasonResult } from "../types";

const DAY = 86400000;
type SeasonTiming = Pick<SeasonResult, "year" | "startOffset" | "durationDays">;

/** Same UTC day convention as engine coverForYear: sowing day is day zero. */
export function planSeasonPeriod(season: SeasonTiming) {
  if (![season.year, season.startOffset, season.durationDays].every(Number.isFinite) || season.durationDays <= 0) return null;
  const start = new Date(Date.UTC(season.year, season.startOffset - 1, 1));
  const endExclusive = new Date(start.getTime() + season.durationDays * DAY);
  return { start, end: new Date(endExclusive.getTime() - DAY), endExclusive };
}

/** Nov(previous year)…Dec(current year). Equal month cells, exact partial months. */
export function planSeasonBar(season: SeasonTiming, cropYear: number) {
  const period = planSeasonPeriod(season);
  if (!period) return null;
  const firstMonth = cropYear * 12 - 2;
  const coordinate = (date: Date) => {
    const y = date.getUTCFullYear(), m = date.getUTCMonth();
    return y * 12 + m - firstMonth + (date.getUTCDate() - 1) / new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  };
  const rawStart = coordinate(period.start), rawEnd = coordinate(period.endExclusive);
  const start = Math.max(0, rawStart), end = Math.min(14, rawEnd);
  if (end <= start) return null;
  return { left: start / 14 * 100, width: (end - start) / 14 * 100,
    clippedStart: rawStart < 0, clippedEnd: rawEnd > 14 };
}
