import { createDemoFarm, buildDefaultScenarios, weightsFromPriorities } from "../lib/data/demo";
import { getDemoSnapshot } from "../lib/data/climate-datasets";
import { runEngine } from "../lib/engine/simulate";
import type { ClimateAssumption, SimulationSettings } from "../lib/types";

const farm = createDemoFarm();
const climate = getDemoSnapshot();
const settings: SimulationSettings = { startYear: 2026, horizon: 5, climateAssumption: "baseline",
  weights: weightsFromPriorities(farm.farmerPriorities), economics: {}, customClimate: { rainPct: -10, deltaT: 1 } };
// Hold rotations fixed while changing climate to isolate the climate assumption.
const scenarios = buildDefaultScenarios(farm, climate, settings);
const summaries = (["baseline", "drier", "wetter", "warmer", "custom"] as ClimateAssumption[]).map((assumption) => {
  const out = runEngine({ farm, scenarios, climate, settings: { ...settings, climateAssumption: assumption } });
  return { assumption, engineVersion: out.engineVersion, inputGap: out.reference.years[0].soilCarbonInputs,
    models: [out.reference, ...scenarios.map((s) => out.results[s.id])].map((simulation) => ({
      id: simulation.scenarioId,
      years: simulation.years.map((year) => ({ year: year.year, ...year.soilImprovementPotential,
        status: year.dataStatus.soilImprovementPotential, overallScore: year.overallScore })),
    })) };
});

if (process.argv.includes("--json")) console.log(JSON.stringify({ farm: farm.id, initialSocTCHa: farm.socStockTCHa,
  scenarios: scenarios.map((s) => ({ id: s.id, name: s.name, sequence: s.seasonalCropSequence })), summaries }, null, 2));
else {
  console.log("RothC SOC (t C/ha, 0–30 cm), estimated. First year = initial stock; following years end in November.");
  console.log("No direction-of-change assertion: results depend on climate, residue inputs and paddy assumptions.");
  for (const summary of summaries) {
    console.log("\n== Climate:", summary.assumption, "· engine", summary.engineVersion);
    console.log("Inverse spin-up and current-practice residue inputs:", summary.inputGap);
    console.table(Array.from({ length: settings.horizon + 1 }, (_, i) => ({
      year: settings.startYear + i,
      ...Object.fromEntries(summary.models.map((m) => [m.id, m.years[i].socTCHa?.toFixed(4) ?? "unavailable"])),
    })));
  }
}
