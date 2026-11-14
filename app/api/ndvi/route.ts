import { pointFromQuery, vegetationDates } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { fetchNdviSeries } from "@/lib/services/ndvi";

export const maxDuration = 60;

const ndvi = evidenceRoute("ornl-mod13q1-061-point-ndvi-qa-v2", ({ lat, lon }, period) => fetchNdviSeries(lat, lon, period));

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const point = pointFromQuery(query);
  const period = vegetationDates(query);
  if (!point || !period) return invalidEvidenceRequest();
  return ndvi(point, period);
}
