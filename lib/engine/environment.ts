import type { EnvironmentalSeries } from "@/lib/data/evidence";
import type { ClimateDataset, FarmProfile } from "@/lib/types";

/** Change the rainfall input only when IMERG covers the entire POWER model window.
 * Keeping one product across all years makes the scenario comparison reproducible.
 */
export function climateWithImerg(climate: ClimateDataset, imerg: EnvironmentalSeries | null | undefined): ClimateDataset {
  if (climate.status === "illustrative" || !imerg || imerg.status !== "observed") return climate;
  const [lon, lat] = imerg.evidence.geometry.coordinates;
  if (Math.abs(climate.latitude - lat) > 0.00001 || Math.abs(climate.longitude - lon) > 0.00001) return climate;
  const monthly = new Map(imerg.observations
    .filter((o) => o.variable === "precipitation" && o.unit === "mm/month" && o.quality === "valid" && o.value !== null)
    .map((o) => [o.period[0].slice(0, 7), o.value!]));
  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  if (!climate.months.every((m) => monthly.has(key(m.year, m.month)))) return climate;
  return { ...climate, note: "Model rainfall: GPM IMERG daily UTC totals. Other climate variables: NASA POWER MERRA-2 and CERES.", months: climate.months.map((m) => ({ ...m, precipMm: monthly.get(key(m.year, m.month))! })) };
}

/** Relative wet months are useful for drainage screening, with no universal moisture threshold. */
export function smapWetMonths(series: EnvironmentalSeries | null | undefined, farm: FarmProfile): Set<number> {
  if (!series || series.status !== "estimated") return new Set();
  const [lon, lat] = series.evidence.geometry.coordinates;
  if (Math.abs(farm.latitude - lat) > 0.00001 || Math.abs(farm.longitude - lon) > 0.00001) return new Set();
  const byMonth = Array.from({ length: 12 }, () => [] as number[]);
  for (const obs of series.observations) {
    if (obs.variable !== "root_zone_soil_moisture" || obs.quality !== "valid" || obs.unit !== "m³/m³" || obs.value === null) continue;
    byMonth[Number(obs.period[0].slice(5, 7)) - 1]?.push(obs.value);
  }
  if (byMonth.some((values) => values.length < 3)) return new Set();
  const average = byMonth.map((values, i) => ({ month: i + 1, value: values.reduce((a, b) => a + b, 0) / values.length }));
  const ranked = average.sort((a, b) => b.value - a.value);
  return new Set(ranked.slice(0, 3).filter((m) => m.value > ranked[9].value).map((m) => m.month));
}
