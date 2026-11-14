import { createDemoFarm, buildDefaultScenarios, weightsFromPriorities } from "../lib/data/demo";
import { getDemoSnapshot } from "../lib/data/climate-datasets";
import { runEngine, climateSummary, screenCrops } from "../lib/engine/simulate";
import type { SimulationSettings } from "../lib/types";
const farm = createDemoFarm();
const climate = getDemoSnapshot();
for (const assumption of ["baseline","drier"] as const) {
const settings: SimulationSettings = { startYear: 2026, horizon: 5, climateAssumption: assumption, weights: weightsFromPriorities(farm.farmerPriorities), economics: {} };
const scenarios = buildDefaultScenarios(farm, climate, settings);
if (assumption==="baseline") { console.log(scenarios.map(s => s.name + ": " + s.seasonalCropSequence.map(x => x.yearIndex+x.season+"="+x.cropId).join(" ")).join("\n"));
const scr = screenCrops(farm, climate, settings); for (const s of ["S1","S2","S3"] as const) console.log(s, scr[s].map(c=>`${c.cropId}:${c.suitability.toFixed(0)}/${c.irrigation.toFixed(0)}mm`).join(" "));
const cs = climateSummary(climate); console.log("annual P", cs.meanAnnualPrecip.toFixed(0), "T", cs.meanT.toFixed(2), "ET0 by month", cs.months.map(m=>m.et0.toFixed(0)).join(","), "P", cs.months.map(m=>m.precip.toFixed(0)).join(","));}
const out = runEngine({ farm, scenarios, climate, settings });
console.log("== climate", assumption);
for (const id of Object.keys(out.results)) {
  for (const y of out.results[id].years) {
    console.log(id, y.year, "irr", y.waterDemand.median.toFixed(0), `[${y.waterDemand.p10.toFixed(0)}-${y.waterDemand.p90.toFixed(0)}]`, "risk", y.waterRisk.level, "suit", y.cropSuitability.score.toFixed(0), "H", y.rotationDiversity.shannon.toFixed(2), "soilL", y.soilImprovementPotential.level, y.soilImprovementPotential.index.toFixed(2), "N", y.nitrogenNeed, "score", y.overallScore.toFixed(1), "seasons", y.seasons.map(s=>`${s.season}:${s.cropId}:${s.irrigation.median.toFixed(0)}:${s.stressLevel}:${isNaN(s.suitability.score)?'-':s.suitability.score.toFixed(0)}${s.suitability.limiting?'('+s.suitability.limiting+')':''}${s.overlap?'!OV':''}`).join(" "));
  }
}}
