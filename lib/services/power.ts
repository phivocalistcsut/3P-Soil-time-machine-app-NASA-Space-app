import { monthPeriod, POWER_SOURCE } from "@/lib/data/evidence";
import { ProviderError } from "./http";
import type { ClimateDataset, ClimateMonth } from "@/lib/types";

/**
 * NASA POWER (Prediction Of Worldwide Energy Resources) monthly point API.
 * Docs: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
 * No API key is required. Values are derived from MERRA-2 reanalysis and
 * satellite products on a ~0.5° × 0.625° grid — regional, not field scale.
 */
export const POWER_PARAMS = [
  "PRECTOTCORR",
  "T2M",
  "T2M_RANGE",
  "RH2M",
  "WS2M",
  "ALLSKY_SFC_SW_DWN",
  "GWETTOP",
  "GWETROOT",
] as const;

export const POWER_RESOLUTION = "MERRA-2 0.5° × 0.625°; CERES solar 1°";

export function powerMonthlyUrl(lat: number, lon: number, start: number, end: number) {
  const p = new URLSearchParams({
    parameters: POWER_PARAMS.join(","),
    community: "AG",
    latitude: lat.toFixed(5),
    longitude: lon.toFixed(5),
    start: String(start),
    end: String(end),
    format: "JSON",
  });
  return `https://power.larc.nasa.gov/api/temporal/monthly/point?${p.toString()}`;
}

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

export type PowerJson = {
  geometry?: { coordinates?: number[] };
  properties?: { parameter?: Record<string, Record<string, number>> };
  header?: { fill_value?: number; api?: { version?: string }; sources?: string[]; time_standard?: string };
  parameters?: Record<string, { units?: string }>;
};

/** Convert a POWER monthly JSON response into a normalized ClimateDataset. */
export function parsePowerMonthly(
  json: PowerJson,
  opts: { lat: number; lon: number; start: number; end: number; retrievedAt: string; cached: boolean },
): ClimateDataset {
  const p = json.properties?.parameter;
  const expected = { PRECTOTCORR: "mm/day", T2M: "C", T2M_RANGE: "C", RH2M: "%", WS2M: "m/s", ALLSKY_SFC_SW_DWN: "MJ/m^2/day" };
  if (!p || Object.entries(expected).some(([name, unit]) => json.parameters?.[name]?.units !== unit)) throw new ProviderError("upstream");
  const fill = json.header?.fill_value ?? -999;
  const months: ClimateMonth[] = [];
  const val = (param: string, key: string) => {
    const v = p[param]?.[key];
    return typeof v !== "number" || !Number.isFinite(v) || v === fill || v <= -990 ? null : v;
  };
  for (let y = opts.start; y <= opts.end; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}${String(m).padStart(2, "0")}`;
      const pr = val("PRECTOTCORR", key);
      const t = val("T2M", key);
      const t2mRange = val("T2M_RANGE", key);
      const rh2m = val("RH2M", key);
      const ws2m = val("WS2M", key);
      const rsMJ = val("ALLSKY_SFC_SW_DWN", key);
      if (pr === null || pr < 0 || t === null || t2mRange === null || t2mRange < 0 ||
          rh2m === null || rh2m < 0 || rh2m > 100 || ws2m === null || ws2m < 0 || rsMJ === null || rsMJ < 0) continue;
      months.push({
        year: y,
        month: m,
        precipMm: pr * daysInMonth(y, m),
        t2m: t,
        t2mRange,
        rh2m,
        ws2m,
        rsMJ,
        gwetTop: val("GWETTOP", key),
        gwetRoot: val("GWETROOT", key),
      });
    }
  }
  const complete = months.filter(({ year }) => months.filter((m) => m.year === year).length === 12);
  if (!complete.length) throw new ProviderError("unavailable");
  const period: [number, number] = [complete[0].year, complete.at(-1)!.year];
  const elevation = json.geometry?.coordinates?.[2];
  if (typeof elevation !== "number" || !Number.isFinite(elevation) || elevation <= -990) throw new ProviderError("unavailable");
  return {
    status: "estimated",
    source: "NASA POWER (MERRA-2 + satellite-derived), monthly",
    sourceUrl: "https://power.larc.nasa.gov/",
    retrievedAt: opts.retrievedAt,
    cached: opts.cached,
    period,
    resolution: POWER_RESOLUTION,
    latitude: opts.lat,
    longitude: opts.lon,
    elevation,
    months: complete,
    evidence: {
      provider: "NASA POWER",
      dataset: "MERRA-2 meteorology and CERES solar radiation",
      productId: `Monthly point API ${json.header?.api?.version ?? ""}`.trim(),
      geometry: { type: "Point", coordinates: [opts.lon, opts.lat] },
      period: [monthPeriod(period[0], 1)[0], monthPeriod(period[1], 12)[1]],
      resolution: POWER_RESOLUTION,
      retrievedAt: opts.retrievedAt,
      sourceUrl: POWER_SOURCE + "monthly/",
      quality: `${complete.length}/${(opts.end - opts.start + 1) * 12} requested months retained in complete years; provider time standard ${json.header?.time_standard ?? "unknown"}`,
    },
  };
}
