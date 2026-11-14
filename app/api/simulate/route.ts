import { runEngine, type EngineInput } from "@/lib/engine/simulate";

/**
 * POST /api/simulate — runs the same engine used in the browser. The JSON contract
 * (EngineInput → EngineOutput) is the interface a future FastAPI service would implement.
 */
export async function POST(request: Request) {
  try {
    const input = (await request.json()) as EngineInput;
    if (!input?.farm || !Array.isArray(input.scenarios) || !input.climate?.months?.length || !input.settings) {
      return Response.json({ error: "Body must include farm, scenarios, climate and settings" }, { status: 400 });
    }
    return Response.json(runEngine(input));
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Simulation failed" }, { status: 500 });
  }
}
