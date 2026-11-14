import { pointFromQuery } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { upstreamJson, ProviderError } from "@/lib/services/http";
import { annualTemperatures, type TemperatureHistory } from "@/lib/services/climate-trend";
import type { PowerJson } from "@/lib/services/power";

export const maxDuration = 30;
const history = evidenceRoute("power-longterm-t2m-v1", async ({ lat, lon }, period): Promise<TemperatureHistory> => {
  const params = new URLSearchParams({ parameters: "T2M", community: "AG", latitude: String(lat), longitude: String(lon),
    start: period.start, end: period.end, format: "JSON" });
  const json = await upstreamJson<PowerJson>(`https://power.larc.nasa.gov/api/temporal/monthly/point?${params}`);
  const points = annualTemperatures(json, Number(period.start), Number(period.end));
  if (points.length < 30) throw new ProviderError("unavailable");
  return { points, requestedStart: Number(period.start), requestedEnd: Number(period.end), latitude: lat, longitude: lon,
    status: "estimated", cached: false, retrievedAt: new Date().toISOString(), source: "NASA POWER T2M · MERRA-2 · 0.5° × 0.625°" };
});

export async function GET(request: Request) {
  const point = pointFromQuery(new URL(request.url).searchParams);
  if (!point) return invalidEvidenceRequest();
  return history(point, { start: "1984", end: String(new Date().getUTCFullYear() - 1) });
}
