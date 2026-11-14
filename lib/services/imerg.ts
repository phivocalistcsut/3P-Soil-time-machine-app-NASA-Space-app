import { IMERG_SOURCE, monthPeriod, type EnvironmentalSeries } from "@/lib/data/evidence";
import { ProviderError, upstreamJson } from "./http";
import type { PowerJson } from "./power";

export function aggregateImerg(json: PowerJson, lat: number, lon: number, start: number, end: number): EnvironmentalSeries {
  const values = json.properties?.parameter?.IMERG_PRECTOT;
  if (!values || !json.header?.sources?.includes("IMERG") || json.header.time_standard !== "UTC" ||
      json.parameters?.IMERG_PRECTOT?.units !== "mm/day") throw new ProviderError("unavailable");
  const observations: EnvironmentalSeries["observations"] = [];
  for (let year = start; year <= end; year++) {
    for (let month = 1; month <= 12; month++) {
      const period = monthPeriod(year, month);
      const prefix = period[0].slice(0, 7).replace("-", "");
      const days = Number(period[1].slice(-2));
      let total = 0;
      let valid = 0;
      for (let day = 1; day <= days; day++) {
        const value = values[prefix + String(day).padStart(2, "0")];
        if (!Number.isFinite(value) || value < 0 || value === json.header.fill_value) continue;
        total += value;
        valid++;
      }
      observations.push({
        variable: "precipitation", value: valid === days ? Math.round(total * 100) / 100 : null,
        unit: "mm/month", period, quality: valid === days ? "valid" : "missing",
      });
    }
  }
  const usable = observations.filter((o) => o.value !== null);
  if (!usable.length) throw new ProviderError("unavailable");
  return {
    status: "observed", cached: false, observations,
    evidence: {
      provider: "NASA GPM via NASA POWER", dataset: "Integrated Multi-satellitE Retrievals for GPM (IMERG)",
      productId: "IMERG_PRECTOT, daily UTC (run/collection not supplied by API)",
      geometry: { type: "Point", coordinates: [lon, lat] },
      period: [usable[0].period[0], usable.at(-1)!.period[1]],
      resolution: "0.1° × 0.1° (~10 km)", retrievedAt: new Date().toISOString(), sourceUrl: IMERG_SOURCE,
      quality: `${usable.length}/${observations.length} months with every daily value; no per-pixel QA provided`,
    },
  };
}

export async function fetchImerg(lat: number, lon: number, start: number, end: number, fetcher: typeof fetch = fetch) {
  const query = new URLSearchParams({
    parameters: "IMERG_PRECTOT", community: "AG", latitude: lat.toFixed(5), longitude: lon.toFixed(5),
    start: `${start}0101`, end: `${end}1231`, format: "JSON", "time-standard": "UTC",
  });
  const json = await upstreamJson<PowerJson>(`https://power.larc.nasa.gov/api/temporal/daily/point?${query}`, 19000, fetcher);
  return aggregateImerg(json, lat, lon, start, end);
}
