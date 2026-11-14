import type { PowerJson } from "./power";
import { ProviderError } from "./http";

export interface TemperatureHistory {
  status: "estimated"; cached: boolean; retrievedAt: string;
  latitude: number; longitude: number; requestedStart: number; requestedEnd: number;
  source: string; points: { year: number; temperature: number }[];
}

/** Calendar-day-weighted annual means; exclude a whole year if any month is missing. */
export function annualTemperatures(json: PowerJson, start: number, end: number) {
  if (json.parameters?.T2M?.units !== "C" || !json.properties?.parameter?.T2M) throw new ProviderError("upstream");
  const values = json.properties.parameter.T2M;
  const points: TemperatureHistory["points"] = [];
  for (let year = start; year <= end; year++) {
    let sum = 0, days = 0, valid = true;
    for (let m = 1; m <= 12; m++) {
      const value = values[`${year}${String(m).padStart(2,"0")}`];
      if (typeof value !== "number" || !Number.isFinite(value) || value === json.header?.fill_value || value < -90 || value > 65) { valid = false; break; }
      const count = new Date(Date.UTC(year,m,0)).getUTCDate();
      sum += value * count; days += count;
    }
    if (valid) points.push({ year, temperature: sum / days });
  }
  return points;
}
