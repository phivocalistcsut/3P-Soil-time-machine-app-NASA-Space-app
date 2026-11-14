import { isoDay, monthPeriod, POWER_SOURCE } from "@/lib/data/evidence";
import { ProviderError } from "./http";
import type { PowerJson } from "./power";
import type { DailyExtremes, DailyMonthStat } from "@/lib/types";

/**
 * NASA POWER daily point API → monthly counts of weather extremes.
 * Docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
 * No API key. Values come from a ≈0.5° grid (regional, not a field station).
 */
export const DAILY_THRESHOLDS = { heavyRainMm: 50, veryHeavyRainMm: 100, hotC: 35, frostC: 0 };

export function powerDailyUrl(lat: number, lon: number, startYear: number, endYear: number) {
  const p = new URLSearchParams({
    parameters: "PRECTOTCORR,T2M_MAX,T2M_MIN",
    community: "AG",
    latitude: lat.toFixed(5),
    longitude: lon.toFixed(5),
    start: `${startYear}0101`,
    end: `${endYear}1231`,
    format: "JSON",
  });
  return `https://power.larc.nasa.gov/api/temporal/daily/point?${p.toString()}`;
}



export function aggregateDaily(
  json: PowerJson,
  opts: { lat: number; lon: number; start: number; end: number; retrievedAt: string; cached: boolean },
): DailyExtremes {
  const p = json.properties?.parameter;
  if (!p?.PRECTOTCORR || !p.T2M_MAX || !p.T2M_MIN || json.parameters?.PRECTOTCORR?.units !== "mm/day" ||
      json.parameters?.T2M_MIN?.units !== "C" || json.parameters?.T2M_MAX?.units !== "C") throw new ProviderError("upstream");
  const fill = json.header?.fill_value ?? -999;
  const ok = (v: number | undefined) => typeof v === "number" && Number.isFinite(v) && v !== fill && v > -990;
  const byMonth = new Map<string, DailyMonthStat>();
  for (const key of Object.keys(p.PRECTOTCORR)) {
    const year = Number(key.slice(0, 4));
    const month = Number(key.slice(4, 6));
    const date = `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6)}`;
    if (year < opts.start || year > opts.end || !isoDay(date)) continue;
    const pr = p.PRECTOTCORR[key];
    const tx = p.T2M_MAX[key];
    const tn = p.T2M_MIN[key];
    if (!ok(pr) || pr < 0 || !ok(tx) || !ok(tn) || tx < tn) continue;
    const k = `${year}-${month}`;
    let s = byMonth.get(k);
    if (!s) {
      s = { year, month, days: 0, heavyRainDays: 0, veryHeavyRainDays: 0, hotDays: 0, frostDays: 0, maxRainMm: 0, maxTmax: tx, minTmin: tn };
      byMonth.set(k, s);
    }
    s.days += 1;
    if (ok(pr)) {
      if (pr >= DAILY_THRESHOLDS.heavyRainMm) s.heavyRainDays += 1;
      if (pr >= DAILY_THRESHOLDS.veryHeavyRainMm) s.veryHeavyRainDays += 1;
      s.maxRainMm = Math.max(s.maxRainMm, pr);
    }
    if (ok(tx)) {
      if (tx >= DAILY_THRESHOLDS.hotC) s.hotDays += 1;
      s.maxTmax = Math.max(s.maxTmax, tx);
    }
    if (ok(tn)) {
      if (tn <= DAILY_THRESHOLDS.frostC) s.frostDays += 1;
      s.minTmin = Math.min(s.minTmin, tn);
    }
  }
  const complete = [...byMonth.values()].filter((m) => m.days === new Date(Date.UTC(m.year, m.month, 0)).getUTCDate());
  const months = complete.filter((m) => complete.filter((n) => n.year === m.year).length === 12)
    .sort((a, b) => a.year - b.year || a.month - b.month);
  if (!months.length) throw new ProviderError("unavailable");
  const period: [number, number] = [months[0].year, months.at(-1)!.year];
  return {
    status: "estimated",
    source: "NASA POWER daily (MERRA-2 + satellite-derived)",
    retrievedAt: opts.retrievedAt,
    cached: opts.cached,
    period,
    resolution: "≈0.5° × 0.625° (≈55 km)",
    latitude: opts.lat,
    longitude: opts.lon,
    evidence: {
      provider: "NASA POWER", dataset: "MERRA-2 daily rainfall and temperature",
      productId: `Daily point API ${json.header?.api?.version ?? ""}`.trim(),
      geometry: { type: "Point", coordinates: [opts.lon, opts.lat] },
      period: [monthPeriod(period[0], 1)[0], monthPeriod(period[1], 12)[1]],
      resolution: "0.5° × 0.625°", retrievedAt: opts.retrievedAt, sourceUrl: POWER_SOURCE + "daily/",
      quality: `${months.length}/${(opts.end - opts.start + 1) * 12} requested months retained in complete years`,
    },
    thresholds: DAILY_THRESHOLDS,
    months,
  };
}

/** Average count per calendar month across all years (index 0 = January). */
export function extremesClimatology(ext: DailyExtremes) {
  return Array.from({ length: 12 }, (_, i) => {
    const rows = ext.months.filter((m) => m.month === i + 1);
    const n = Math.max(rows.length, 1);
    const avg = (f: (m: DailyMonthStat) => number) => rows.reduce((s, m) => s + f(m), 0) / n;
    return {
      month: i + 1,
      heavyRainDays: avg((m) => m.heavyRainDays),
      veryHeavyRainDays: avg((m) => m.veryHeavyRainDays),
      hotDays: avg((m) => m.hotDays),
      frostDays: avg((m) => m.frostDays),
      maxRainMm: Math.max(0, ...rows.map((m) => m.maxRainMm)),
      maxTmax: Math.max(-99, ...rows.map((m) => m.maxTmax)),
    };
  });
}

/** Totals per year (for the "year by year" view). */
export function extremesByYear(ext: DailyExtremes) {
  const years = [...new Set(ext.months.map((m) => m.year))].sort((a, b) => a - b);
  return years.map((year) => {
    const rows = ext.months.filter((m) => m.year === year);
    return {
      year,
      heavyRainDays: rows.reduce((s, m) => s + m.heavyRainDays, 0),
      hotDays: rows.reduce((s, m) => s + m.hotDays, 0),
      frostDays: rows.reduce((s, m) => s + m.frostDays, 0),
    };
  });
}
