import snapshot from "@/data/power-snapshot-thoi-lai.json";
import dailySnapshot from "@/data/power-daily-thoi-lai.json";
import ndviSnapshot from "@/data/ndvi-thoi-lai.json";
import type { DailyExtremes, NdviSeries } from "@/lib/types";

import type { ClimateDataset, ClimateMonth } from "@/lib/types";
import { MODIS_SOURCE, POWER_SOURCE, monthPeriod } from "./evidence";
import { POWER_RESOLUTION } from "@/lib/services/power";

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/**
 * A REAL NASA POWER monthly snapshot for the demo farm location (10.07°N, 105.56°E),
 * retrieved from the public POWER API on the date stored in the file. It lets the demo
 * run offline without inventing measurements. It is labeled as cached historical reanalysis.
 */
export function getDemoSnapshot(): ClimateDataset {
  const s = snapshot as unknown as {
    lat: number;
    lon: number;
    elevation: number;
    retrievedAt: string;
    months: (number | null)[][];
    header: { api?: { version?: string } };
  };
  const months: ClimateMonth[] = s.months.map((r) => {
    const [year, month, prDay, t2m, range, rh, ws, rs, gTop, gRoot] = r as number[];
    return {
      year,
      month,
      precipMm: prDay * daysInMonth(year, month),
      t2m,
      t2mRange: range,
      rh2m: rh,
      ws2m: ws,
      rsMJ: rs,
      gwetTop: gTop ?? null,
      gwetRoot: gRoot ?? null,
    };
  });
  const period: [number, number] = [months[0].year, months.at(-1)!.year];
  return {
    status: "estimated",
    source: "NASA POWER (MERRA-2 + satellite-derived), monthly — cached snapshot",
    sourceUrl: "https://power.larc.nasa.gov/",
    retrievedAt: s.retrievedAt,
    cached: true,
    period,
    resolution: POWER_RESOLUTION,
    latitude: s.lat,
    longitude: s.lon,
    elevation: s.elevation,
    months,
    evidence: { provider: "NASA POWER", dataset: "MERRA-2 and CERES monthly point snapshot",
      productId: `NASA POWER ${s.header.api?.version ?? ""}`.trim(), geometry: { type: "Point", coordinates: [s.lon, s.lat] },
      period: [monthPeriod(period[0], 1)[0], monthPeriod(period[1], 12)[1]], resolution: POWER_RESOLUTION,
      retrievedAt: s.retrievedAt, sourceUrl: POWER_SOURCE + "monthly/", quality: "Bundled snapshot" },
  };
}

export const DEMO_LOCATION = { lat: 10.07, lon: 105.56 };

/** Seeded pseudo-random generator so illustrative data is stable between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ILLUSTRATIVE humid-tropical delta climate. NOT real satellite or station data.
 * Used only when live NASA POWER data cannot be fetched and the farm is far from the
 * cached demo snapshot. Every view that uses it shows an "Illustrative Demo Data" label.
 */
export function getIllustrativeClimate(lat: number, lon: number): ClimateDataset {
  const precip = [15, 6, 18, 55, 185, 220, 235, 250, 300, 285, 140, 50];
  const temp = [26.0, 26.8, 28.0, 29.2, 28.8, 28.0, 27.6, 27.5, 27.3, 27.2, 26.9, 26.1];
  const range = [9.5, 10.5, 10.8, 10.0, 7.5, 6.2, 5.6, 5.6, 5.5, 6.0, 7.2, 8.4];
  const rh = [76, 73, 71, 74, 81, 85, 86, 86, 87, 87, 84, 80];
  const ws = [2.6, 2.8, 2.6, 2.1, 1.7, 2.2, 2.5, 2.6, 1.8, 1.5, 1.9, 2.4];
  const rs = [18, 20, 21, 21, 18.5, 17.5, 17.5, 17.5, 16.5, 16.2, 16.3, 16.2];
  const gtop = [0.62, 0.48, 0.38, 0.36, 0.6, 0.8, 0.88, 0.9, 0.95, 0.97, 0.9, 0.76];
  const rnd = mulberry32(Math.round((lat + 90) * 1000 + (lon + 180) * 7));
  const months: ClimateMonth[] = [];
  for (let y = 2016; y <= 2025; y++) {
    const yearWet = 0.8 + rnd() * 0.4;
    const yearWarm = (rnd() - 0.5) * 0.8;
    for (let m = 1; m <= 12; m++) {
      const i = m - 1;
      const pr = precip[i] * yearWet * (0.85 + rnd() * 0.3);
      months.push({
        year: y,
        month: m,
        precipMm: pr,
        t2m: temp[i] + yearWarm + (rnd() - 0.5) * 0.4,
        t2mRange: range[i],
        rh2m: rh[i],
        ws2m: ws[i],
        rsMJ: rs[i],
        gwetTop: Math.min(1, gtop[i] * (0.9 + rnd() * 0.15)),
        gwetRoot: Math.min(1, gtop[i] * 1.05 * (0.92 + rnd() * 0.1)),
      });
    }
  }
  return {
    status: "illustrative",
    source: "Illustrative demo climate (synthetic) — not real satellite measurements",
    sourceUrl: "",
    retrievedAt: "",
    cached: true,
    period: [2016, 2025],
    resolution: "n/a (synthetic)",
    latitude: lat,
    longitude: lon,
    elevation: 2,
    months,
    note: "Synthetic values shaped like a humid tropical delta climate.",
  };
}

/** great-circle distance in km */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Use the bundled archive only for its original sampled coordinate. */
function samePoint(lat: number, lon: number, sampleLat: number, sampleLon: number) {
  return lat.toFixed(5) === sampleLat.toFixed(5) && lon.toFixed(5) === sampleLon.toFixed(5);
}
export function getOfflineClimate(lat: number, lon: number): ClimateDataset | null {
  return samePoint(lat, lon, DEMO_LOCATION.lat, DEMO_LOCATION.lon) ? getDemoSnapshot() : null;
}

/* ----------------------- daily extremes & NDVI snapshots ----------------------- */

/** REAL NASA POWER daily extremes for the demo location (cached snapshot). */
export function getDemoDaily(): DailyExtremes {
  return { ...(dailySnapshot as unknown as DailyExtremes), status: "estimated", cached: true };
}

/** REAL MODIS NDVI for the demo field's pixel (cached snapshot). */
export function getDemoNdvi(): NdviSeries {
  const series = ndviSnapshot as unknown as NdviSeries;
  return { ...series, cached: true, evidence: series.evidence ?? { provider: "NASA LP DAAC via ORNL DAAC",
    dataset: "MODIS Terra Vegetation Indices", productId: "MOD13Q1.061", geometry: { type: "Point", coordinates: [series.longitude, series.latitude] },
    period: [series.points[0].date, series.points.at(-1)!.date], resolution: series.resolution,
    retrievedAt: series.retrievedAt, sourceUrl: MODIS_SOURCE, quality: "Bundled snapshot; pixel QA was not recorded" } };
}

/** Offline fallbacks never invent observations: outside the demo area they return null (= unavailable). */
export function getOfflineDaily(lat: number, lon: number): DailyExtremes | null {
  return samePoint(lat, lon, dailySnapshot.latitude, dailySnapshot.longitude) ? getDemoDaily() : null;
}

export function getOfflineNdvi(lat: number, lon: number): NdviSeries | null {
  return samePoint(lat, lon, ndviSnapshot.latitude, ndviSnapshot.longitude) ? getDemoNdvi() : null;
}
