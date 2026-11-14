import type { ClimateAssumption, ClimateDataset, CustomClimate } from "@/lib/types";

/**
 * Climate preparation: scenario adjustment, FAO-56 Penman–Monteith reference
 * evapotranspiration (ET0) on monthly inputs, and FAO/AGLW effective rainfall.
 */

/** Transparent sensitivity adjustments — NOT forecasts and NOT NASA products. */
export type PresetClimate = Exclude<ClimateAssumption, "custom">;

export const CLIMATE_ASSUMPTIONS: Record<PresetClimate, { precipFactor: number; deltaT: number }> = {
  baseline: { precipFactor: 1, deltaT: 0 },
  drier: { precipFactor: 0.8, deltaT: 0.5 },
  wetter: { precipFactor: 1.2, deltaT: 0 },
  warmer: { precipFactor: 1, deltaT: 1.5 },
};

/** Slider limits for the custom test (kept within ranges FAO-56 monthly inputs handle sensibly). */
export const CUSTOM_CLIMATE_LIMITS = { rainPct: { min: -40, max: 40, step: 5 }, deltaT: { min: 0, max: 3, step: 0.5 } } as const;
export const DEFAULT_CUSTOM_CLIMATE: CustomClimate = { rainPct: -10, deltaT: 1 };

/** Rainfall factor and warming applied to every month for a preset or the farmer's sliders. */
export function climateAdjustment(assumption: ClimateAssumption, custom?: CustomClimate | null) {
  if (assumption !== "custom") return CLIMATE_ASSUMPTIONS[assumption];
  const c = custom ?? DEFAULT_CUSTOM_CLIMATE;
  const L = CUSTOM_CLIMATE_LIMITS;
  const rain = Math.min(L.rainPct.max, Math.max(L.rainPct.min, c.rainPct));
  const dt = Math.min(L.deltaT.max, Math.max(L.deltaT.min, c.deltaT));
  return { precipFactor: 1 + rain / 100, deltaT: dt };
}

export interface PreparedMonth {
  year: number;
  month: number;
  precipMm: number;
  peffMm: number;
  et0Day: number;
  t2m: number;
  tmaxMean: number;
  gwetTop: number | null;
  gwetRoot: number | null;
}

export interface PreparedClimate {
  byKey: Map<string, PreparedMonth>;
  climatology: PreparedMonth[]; // index 0 = January
  years: number[];
  dataset: ClimateDataset;
  assumption: ClimateAssumption;
}

const MID_MONTH_DOY = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];

/** Extraterrestrial radiation Ra (MJ m⁻² day⁻¹), FAO-56 eq. 21. */
export function extraterrestrialRadiation(latDeg: number, doy: number) {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  const gsc = 0.082;
  return ((24 * 60) / Math.PI) * gsc * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}

const satVap = (t: number) => 0.6108 * Math.exp((17.27 * t) / (t + 237.3));

/** FAO-56 Penman–Monteith ET0 (mm/day) from monthly mean inputs. */
export function penmanMonteithET0(i: {
  t: number;
  range: number;
  rh: number;
  u2: number;
  rs: number;
  lat: number;
  doy: number;
  elevation: number;
  tPrev: number;
}) {
  const tmax = i.t + i.range / 2;
  const tmin = i.t - i.range / 2;
  const es = (satVap(tmax) + satVap(tmin)) / 2;
  const ea = (Math.max(5, Math.min(100, i.rh)) / 100) * es;
  const delta = (4098 * satVap(i.t)) / (i.t + 237.3) ** 2;
  const pressure = 101.3 * ((293 - 0.0065 * i.elevation) / 293) ** 5.26;
  const gamma = 0.000665 * pressure;
  const ra = extraterrestrialRadiation(i.lat, i.doy);
  const rso = (0.75 + 2e-5 * i.elevation) * ra;
  const rsRatio = Math.min(1, i.rs / Math.max(rso, 0.1));
  const sigma = 4.903e-9;
  const rnl =
    sigma * (((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * rsRatio - 0.35);
  const rn = 0.77 * i.rs - rnl;
  const g = 0.14 * (i.t - i.tPrev);
  const u2 = Math.max(0.5, i.u2);
  const et0 =
    (0.408 * delta * (rn - g) + gamma * (900 / (i.t + 273)) * u2 * (es - ea)) / (delta + gamma * (1 + 0.34 * u2));
  return Math.max(0, et0);
}

/** FAO/AGLW effective rainfall (mm/month). */
export function effectiveRainfall(p: number) {
  return p > 75 ? Math.max(0, 0.8 * p - 25) : Math.max(0, 0.6 * p - 10);
}

export function prepareClimate(dataset: ClimateDataset, assumption: ClimateAssumption, custom?: CustomClimate | null): PreparedClimate {
  const adj = climateAdjustment(assumption, custom);
  const byKey = new Map<string, PreparedMonth>();
  const sorted = [...dataset.months].sort((a, b) => a.year - b.year || a.month - b.month);
  let prevT = sorted[0]?.t2m ?? 27;
  for (const m of sorted) {
    const t = m.t2m + adj.deltaT;
    const precip = m.precipMm * adj.precipFactor;
    const et0Day = penmanMonteithET0({
      t,
      range: m.t2mRange,
      rh: m.rh2m,
      u2: m.ws2m,
      rs: m.rsMJ,
      lat: dataset.latitude,
      doy: MID_MONTH_DOY[m.month - 1],
      elevation: dataset.elevation,
      tPrev: prevT,
    });
    prevT = t;
    byKey.set(`${m.year}-${m.month}`, {
      year: m.year,
      month: m.month,
      precipMm: precip,
      peffMm: effectiveRainfall(precip),
      et0Day,
      t2m: t,
      tmaxMean: t + m.t2mRange / 2,
      gwetTop: m.gwetTop,
      gwetRoot: m.gwetRoot,
    });
  }
  const climatology: PreparedMonth[] = [];
  for (let month = 1; month <= 12; month++) {
    const rows = [...byKey.values()].filter((r) => r.month === month);
    const avg = (f: (r: PreparedMonth) => number) => rows.reduce((s, r) => s + f(r), 0) / Math.max(rows.length, 1);
    const precip = avg((r) => r.precipMm);
    const meanWet = (key: "gwetTop" | "gwetRoot") => {
      const values = rows.flatMap((r) => r[key] === null ? [] : [r[key]]);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    };
    climatology.push({
      year: 0,
      month,
      precipMm: precip,
      peffMm: avg((r) => r.peffMm),
      et0Day: avg((r) => r.et0Day),
      t2m: avg((r) => r.t2m),
      tmaxMean: avg((r) => r.tmaxMean),
      gwetTop: meanWet("gwetTop"),
      gwetRoot: meanWet("gwetRoot"),
    });
  }
  const years = [...new Set(sorted.map((m) => m.year))].sort((a, b) => a - b);
  return { byKey, climatology, years, dataset, assumption };
}

export function getMonth(c: PreparedClimate, year: number, month: number): PreparedMonth {
  return c.byKey.get(`${year}-${month}`) ?? c.climatology[month - 1];
}

export function quantile(values: number[], q: number) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}
