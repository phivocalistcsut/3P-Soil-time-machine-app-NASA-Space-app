import { pointFromQuery } from "@/lib/data/evidence";
import { evidenceRoute, invalidEvidenceRequest } from "@/lib/services/evidence-route";
import { fetchSoilGrids } from "@/lib/services/soilgrids";

export const maxDuration = 25;

const soil = evidenceRoute("isric-soilgrids-2-wcs-0-30cm-v2", ({ lat, lon }) => fetchSoilGrids(lat, lon));

export async function GET(request: Request) {
  const point = pointFromQuery(new URL(request.url).searchParams);
  if (!point) return invalidEvidenceRequest();
  return soil(point, { start: "0cm", end: "30cm" });
}
