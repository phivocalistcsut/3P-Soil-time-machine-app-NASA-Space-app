import assert from "node:assert/strict";
import test from "node:test";
import { writeArrayBuffer } from "geotiff";
import { CROPS } from "../lib/data/crops";
import { resolveSoilInput, withRothCSoil } from "../lib/data/farm-soil";
import soilSnapshot from "../data/soilgrids-thoi-lai.json";
import { fetchSoilGrids } from "../lib/services/soilgrids";
import { historyYears, monthPeriod, pointFromQuery, vegetationDates, type EnvironmentalSeries } from "../lib/data/evidence";
import { getDemoSnapshot, getOfflineClimate } from "../lib/data/climate-datasets";
import { fieldBoundary } from "../lib/data/geometry";
import { buildDefaultScenarios, createDemoFarm, weightsFromPriorities, ILLUSTRATIVE_ECONOMICS } from "../lib/data/demo";
import { climateWithImerg, smapWetMonths } from "../lib/engine/environment";
import { runEngine } from "../lib/engine/simulate";
import { prepareClimate, penmanMonteithET0 } from "../lib/engine/climate";
import { temperatureTrend } from "../lib/engine/statistics";
import { annualTemperatures } from "../lib/services/climate-trend";
import { era5HotYears, type Era5Daily } from "../lib/services/weather-crosscheck";
import { ndviSeasonPeaks } from "../lib/engine/ndvi-seasons";
import { parseGeocoding, geocode, parsePhoton, geocodePhoton } from "../lib/services/geocoding";
import { OVERLAYS, overlayDateFor } from "../lib/data/layers";
import { planSeasonBar, planSeasonPeriod } from "../lib/data/plan-calendar";
import { buildCalendar } from "../lib/engine/insights";
import ndviSnapshot from "../data/ndvi-thoi-lai.json";
import type { NdviSeries } from "../lib/types";
import { rothCMonths, soilCarbonRating } from "../lib/engine/soil-carbon";
import { ProviderError, upstreamJson } from "../lib/services/http";
import { aggregateImerg } from "../lib/services/imerg";
import { fetchNdviSeries, normalizeNdvi } from "../lib/services/ndvi";
import { parsePowerMonthly, type PowerJson } from "../lib/services/power";
import { normalizeSmap } from "../lib/services/smap";
import type { FarmProfile, SimulationSettings } from "../lib/types";

const farm = createDemoFarm();
const settings: SimulationSettings = { startYear: 2026, horizon: 3, climateAssumption: "baseline",
  weights: weightsFromPriorities(farm.farmerPriorities), economics: {} };

test("FAO-56 Example 17 Bangkok monthly ET0 matches 5.72 mm/day", () => {
  // FAO Irrigation & Drainage Paper 56, Ch.4 Example 17 (April):
  // https://www.fao.org/4/x0490e/x0490e08.htm — actual vapour pressure=2.85 kPa.
  // Convert the given vapour pressure to equivalent mean RH for this app's input contract.
  const es = (0.6108 * Math.exp(17.27 * 34.8 / (34.8 + 237.3)) + 0.6108 * Math.exp(17.27 * 25.6 / (25.6 + 237.3))) / 2;
  const et0 = penmanMonteithET0({t:30.2,range:9.2,rh:100*2.85/es,u2:2,rs:22.65,lat:13+44/60,doy:105,elevation:2,tPrev:29.2});
  assert.ok(Math.abs(et0 - 5.72) < 0.05, `ET0=${et0}`); // Printed table values are rounded.
});

test("Mann–Kendall corrects ties and Sen uses elapsed years", () => {
  const up = temperatureTrend(Array.from({length:10},(_,i)=>({year:2000+i*2,temperature:i})))!;
  assert.equal(up.s,45); assert.equal(up.variance,125); assert.equal(up.slopePerYear,0.5);
  assert.ok(Math.abs(up.p-0.00008303)<0.0000002);
  const flat = temperatureTrend(Array.from({length:10},(_,i)=>({year:2000+i,temperature:2})))!;
  assert.equal(flat.variance,0); assert.equal(flat.slopePerYear,0); assert.ok(flat.p>0.999999);
  const tied = temperatureTrend(Array.from({length:8},(_,i)=>({year:2000+i,temperature:Math.floor(i/2)})))!;
  assert.ok(Math.abs(tied.variance-61.3333333333)<1e-8);
  assert.equal(temperatureTrend([{year:2000,temperature:1}]),null);
});

test("annual temperature means weight leap days and reject partial years", () => {
  const values=Object.fromEntries(Array.from({length:24},(_,i)=>[`${2000+Math.floor(i/12)}${String(i%12+1).padStart(2,"0")}`,i===1?1:0]));
  const json:PowerJson={parameters:{T2M:{units:"C"}},properties:{parameter:{T2M:values}}};
  assert.ok(Math.abs(annualTemperatures(json,2000,2001)[0].temperature-29/366)<1e-12);
  delete values["200105"];
  assert.deepEqual(annualTemperatures(json,2000,2001).map(p=>p.year),[2000]);
  assert.throws(()=>annualTemperatures({...json,parameters:{T2M:{units:"F"}}},2000,2001));
});

test("geocoding validates coordinates, deduplicates and submits complete addresses", async () => {
  const payload={features:[{place_name:"Field address",center:[105.5,10],place_type:["address"]},{place_name:"Duplicate",center:[105.5,10]},
    {place_name:"Invalid",center:[999,10]},{place_name:"String coordinate",center:["105",10]}]};
  assert.deepEqual(parseGeocoding(payload),[{name:"Field address",lon:105.5,lat:10,zoom:17}]);
  let calls=0;
  const fetcher:typeof fetch=async(input)=>{calls++; const url=new URL(String(input));
    assert.equal(url.searchParams.get("language"),"vi"); assert.equal(url.searchParams.get("autocomplete"),"false");
    assert.match(decodeURIComponent(url.pathname),/Cờ Đỏ/); return Response.json(payload);};
  assert.equal((await geocode("Cờ Đỏ, Cần Thơ","vi","test-key",fetcher)).length,1); assert.equal(calls,1);
  await assert.rejects(geocode("test","en","test-key",async()=>new Response("",{status:403})));
});

test("Photon handles local OSM addresses and rejects invalid or duplicate coordinates", async () => {
  const point = (coordinates: unknown[], properties: object) => ({ geometry: { type: "Point", coordinates }, properties });
  const payload = { features: [point([108.05, 12.68], { name: "Buôn Ma Thuột", city: "Buôn Ma Thuột", state: "Đắk Lắk", country: "Việt Nam", type: "city" }),
    point([105.5, 10], { housenumber: "12", street: "Nguyễn Trãi", city: "Cần Thơ" }),
    point([105.5, 10], { name: "Duplicate" }), point(["105", 10], { name: "String coordinate" }),
    point([999, 10], { name: "Outside world" }), point([0, 0], {})] };
  assert.deepEqual(parsePhoton(payload), [
    { name: "Buôn Ma Thuột, Đắk Lắk, Việt Nam", lat: 12.68, lon: 108.05, zoom: 12 },
    { name: "12 Nguyễn Trãi, Cần Thơ", lat: 10, lon: 105.5, zoom: 17 },
  ]);
  let calls = 0;
  const fetcher: typeof fetch = async (input, init) => {
    calls++; const url = new URL(String(input));
    assert.equal(url.searchParams.get("q"), "Buôn Ma Thuột");
    assert.equal(url.searchParams.has("key"), false);
    assert.equal(url.searchParams.has("lang"), false); // local OSM names, not unsupported vi
    assert.match(String((init?.headers as Record<string,string>)["User-Agent"]), /SoilTimeMachine/);
    return Response.json(payload);
  };
  assert.equal((await geocodePhoton("Buôn Ma Thuột", "vi", fetcher)).length, 2);
  assert.equal(calls, 1);
  await assert.rejects(geocodePhoton("test", "en", async () => new Response(null, { status: 429 })));
  assert.throws(() => parsePhoton({ features: null }));
});

test("NASA timeline keeps product-specific dates and caps the requested month", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  assert.deepEqual(OVERLAYS.map(o => overlayDateFor(o, null, now)), ["2026-11-11", "2026-11-10", "2026-10-01"]);
  assert.deepEqual(OVERLAYS.map(o => overlayDateFor(o, "2016-03", now)), ["2016-03-15", "2016-03-15", "2016-03-01"]);
  assert.deepEqual(OVERLAYS.map(o => overlayDateFor(o, "2026-12", now)), ["2026-11-11", "2026-11-10", "2026-10-01"]);
});

test("planner dates preserve the engine's inclusive days across the crop year and leap day", () => {
  const period = planSeasonPeriod({ year: 2028, startOffset: 0, durationDays: 100 })!;
  assert.equal(period.start.toISOString().slice(0,10), "2027-12-01");
  assert.equal(period.end.toISOString().slice(0,10), "2028-03-09");
  assert.equal((period.endExclusive.getTime()-period.start.getTime())/86400000, 100);
  const leap = planSeasonPeriod({ year: 2028, startOffset: 1, durationDays: 60 })!;
  assert.equal(leap.end.toISOString().slice(0,10), "2028-02-29");
  const december = planSeasonBar({ year: 2028, startOffset: 0, durationDays: 31 },2028)!;
  assert.ok(Math.abs(december.left - 100/14) < 1e-10);
  assert.ok(Math.abs(december.width - 100/14) < 1e-10);
});

test("planner clips long seasons to the visible window and never invents a fallow duration", () => {
  assert.deepEqual(planSeasonBar({year:2028,startOffset:-2,durationDays:600},2028), {left:0,width:100,clippedStart:true,clippedEnd:true});
  assert.equal(planSeasonBar({year:2026,startOffset:0,durationDays:30},2028),null);
  assert.equal(planSeasonPeriod({year:2028,startOffset:0,durationDays:0}),null);
  assert.equal(planSeasonPeriod({year:2028,startOffset:NaN,durationDays:30}),null);
});

test("NDVI screening ignores rejected QA and cannot bridge cloud gaps", () => {
  const series:NdviSeries={...ndviSnapshot,evidence:undefined,status:"observed",points:[
    {date:"2024-01-01",ndvi:0.3,quality:"good"},{date:"2024-01-17",ndvi:0.8,quality:"good"},
    {date:"2024-02-02",ndvi:0.3,quality:"good"},{date:"2024-02-18",ndvi:0.95,quality:"rejected"},
    {date:"2024-06-01",ndvi:0.9,quality:"good"},{date:"2024-06-17",ndvi:0.2,quality:"good"}]};
  assert.deepEqual(ndviSeasonPeaks(series).peaks,[{date:"2024-01-17",ndvi:0.8}]);
});

test("ERA5 cross-check validates units and excludes incomplete years", () => {
  const time=Array.from({length:366},(_,i)=>new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10));
  const json:Era5Daily={latitude:10,longitude:105,timezone:"Asia/Ho_Chi_Minh",daily_units:{temperature_2m_max:"°C"},
    daily:{time,temperature_2m_max:time.map((_,i)=>i<20?35:34.9)}};
  assert.deepEqual(era5HotYears(json,2024,2024),[{year:2024,days:366,hotDays:20}]);
  json.daily!.temperature_2m_max[25]=null;
  assert.deepEqual(era5HotYears(json,2024,2024),[]);
  assert.throws(()=>era5HotYears({...json,daily_units:{temperature_2m_max:"°F"}},2024,2024));
});

test("bare and fallow rain cells describe wash-off and fixed soil texture changes water demand", () => {
  const climate=getDemoSnapshot();
  const run=(soilType:FarmProfile["soilType"])=>runEngine({farm:{...farm,soilType},climate,scenarios:[],settings}).reference.years[0];
  assert.ok(run("loam").waterDemand.median>run("clay").waterDemand.median);
  const result={...run(farm.soilType),monthlyCover:Array(12).fill("fallow")};
  const calendar=buildCalendar({result,farm,climate,assumption:"baseline",extremes:null});
  assert.ok(calendar.rows.find(r=>r.id==="rain")!.cells.every(c=>c.risk?.en==="Wash-off"));
});

test("demo economics remain illustrative with explicit source/assumption records", () => {
  for(const crop of CROPS) {
    const data=ILLUSTRATIVE_ECONOMICS[crop.id];
    assert.equal(data.status,"illustrative"); assert.ok(data.source);
    assert.ok([data.yieldT,data.priceVnd,data.costMVnd].every(v=>Number.isFinite(v)&&v>=0));
  }
  const climate=getDemoSnapshot(),scenarios=buildDefaultScenarios(farm,climate,settings);
  const result=runEngine({farm,climate,scenarios,settings:{...settings,economics:ILLUSTRATIVE_ECONOMICS}});
  for(const simulation of [result.reference,...Object.values(result.results)])for(const year of simulation.years) {
    assert.equal(year.economics?.status,"illustrative"); assert.ok(Number.isFinite(year.economics?.grossMargin));
  }
});

// Tiny georeferenced GeoTIFFs exercise the WCS request, decoder, pixel lookup AND unit conversion.
const SOIL_RAW: Record<string, number> = {
  "phh2o_0-5cm_mean": 60, "sand_0-5cm_mean": 300,
  "soc_0-5cm_mean": 200, "soc_5-15cm_mean": 100, "soc_15-30cm_mean": 50,
  "clay_0-5cm_mean": 200, "clay_5-15cm_mean": 300, "clay_15-30cm_mean": 400,
  "bdod_0-5cm_mean": 100, "bdod_5-15cm_mean": 120, "bdod_15-30cm_mean": 140,
};

function soilFetcher(overrides: Record<string, number | null> = {}, ids: string[] = []): typeof fetch {
  return async (request) => {
    const q = new URL(String(request)).searchParams;
    const id = q.get("COVERAGEID")!;
    ids.push(id);
    assert.equal(q.get("VERSION"), "2.0.1");
    assert.equal(q.getAll("SUBSET").length, 2);
    assert.ok(id in SOIL_RAW, `Unexpected coverage ${id}`);
    if (id in overrides && overrides[id] === null) return new Response(null, { status: 404 });
    const value = overrides[id] ?? SOIL_RAW[id];
    const bytes = writeArrayBuffer(new Float32Array([value]), {
      width: 1, height: 1, ModelPixelScale: [0.02, 0.02, 0], ModelTiepoint: [0, 0, 0, 104.99, 10.01, 0],
      GeographicTypeGeoKey: 4326, GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 1, GDAL_NODATA: "-9999",
    });
    return new Response(bytes, { headers: { "content-type": "image/tiff" } });
  };
}

test("SoilGrids reads eleven WCS layers, preserving topsoil fields and computing 0–30 cm stock", async () => {
  const ids: string[] = [];
  const soil = await fetchSoilGrids(10, 105, soilFetcher({}, ids));
  assert.equal(new Set(ids).size, 11);
  assert.equal(soil.ph, 6);
  assert.equal(soil.socPercent, 2); // 200 dg/kg = 20 g/kg = 2%
  assert.equal(soil.clayPercent, 20);
  assert.equal(soil.sandPercent, 30);
  assert.equal(soil.texture, "loam");
  assert.equal(soil.socStockTCHa, 32.5); // 20*1*5*.1 + 10*1.2*10*.1 + 5*1.4*15*.1
  assert.equal(soil.clayPercent0to30, 1000 / 30); // (20*5 + 30*10 + 40*15)/30
  assert.equal(soil.layers[2].bulkDensityGCm3, 1.4);
});

test("SoilGrids does not interpolate missing SOC, density or clay depths", async () => {
  for (const id of ["soc_5-15cm_mean", "bdod_15-30cm_mean", "clay_0-5cm_mean"]) {
    const soil = await fetchSoilGrids(10, 105, soilFetcher({ [id]: null }));
    assert.equal(soil.socStockTCHa, id.startsWith("clay") ? 32.5 : null);
    assert.equal(soil.clayPercent0to30, id.startsWith("clay") ? null : 1000 / 30);
    assert.equal(soil.ph, 6);
  }
  const nodata = await fetchSoilGrids(10, 105, soilFetcher({ "bdod_5-15cm_mean": -9999 }));
  assert.equal(nodata.socStockTCHa, null);
  const zeroDensity = await fetchSoilGrids(10, 105, soilFetcher({ "bdod_5-15cm_mean": 0 }));
  assert.equal(zeroDensity.socStockTCHa, null);
  const zeroCarbon = await fetchSoilGrids(10, 105, soilFetcher({ "soc_0-5cm_mean": 0 }));
  assert.equal(zeroCarbon.socPercent, 0);
  assert.equal(zeroCarbon.socStockTCHa, 22.5);
  await assert.rejects(fetchSoilGrids(10, 105, soilFetcher(Object.fromEntries(Object.keys(SOIL_RAW).map((id) => [id, null])))), { message: "unavailable" });
});

test("farmer 0–30 cm measurements take priority, retain zero and never invent missing soil inputs", () => {
  assert.deepEqual(resolveSoilInput("38,5", 30, "SoilGrids", 100), { value: 38.5, tag: { status: "observed", source: "Farmer soil test · 0–30 cm" } });
  assert.equal(resolveSoilInput("0", 30, "SoilGrids").value, 0);
  assert.equal(resolveSoilInput("", 30, "SoilGrids").tag.status, "estimated");
  assert.equal(resolveSoilInput("NaN", null, undefined).tag.status, "unavailable");
  assert.equal(resolveSoilInput("101", null, undefined, 100).value, null);
  const legacy = JSON.parse(JSON.stringify(farm));
  delete legacy.clayPercent;
  delete legacy.socStockTCHa;
  delete legacy.soilSources.clayPercent;
  delete legacy.soilSources.socStockTCHa;
  const upgraded = withRothCSoil(legacy);
  assert.equal(upgraded.clayPercent, null);
  assert.equal(upgraded.socStockTCHa, null);
  assert.equal(upgraded.soilSources.clayPercent.status, "unavailable");
  assert.equal(upgraded.soilOrganicCarbon, farm.soilOrganicCarbon);
  assert.equal(farm.clayPercent, soilSnapshot.clayPercent0to30);
  assert.equal(farm.socStockTCHa, soilSnapshot.socStockTCHa);
  assert.equal(farm.soilSources.socStockTCHa.status, farm.socStockTCHa === null ? "unavailable" : "estimated");
});

test("all catalog crops have sourced, non-negative estimated RothC residue inputs", () => {
  for (const crop of CROPS) {
    assert.ok(Number.isFinite(crop.rothc.residueCTHa) && crop.rothc.residueCTHa >= 0, crop.id);
    assert.equal(crop.rothc.status, "estimated");
    assert.ok(crop.rothc.dpmRpm > 0);
    assert.ok(crop.rothc.source.includes("https://"));
  }
  assert.equal(CROPS.find((c) => c.id === "fallow")!.rothc.residueCTHa, 0);
  const rice = CROPS.find((c) => c.id === "rice")!.rothc;
  assert.match(rice.source, /Only roots \+ stubble/);
  assert.ok(Math.abs(rice.residueCTHa - 1.074058592549) < 0.000001);
  // Non-tuber roots are based on vine biomass; harvested sweet-potato tubers cannot be credited as roots.
  assert.ok(Math.abs(CROPS.find((c) => c.id === "sweetpotato")!.rothc.residueCTHa - 0.55743036096) < 0.000001);
});

test("RothC integration anchors the initial stock, shares spin-up and is deterministic", () => {
  const climate = getDemoSnapshot();
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  const input = { farm, climate, scenarios, settings: { ...settings, climateAssumption: "drier" as const } };
  const result = runEngine(input);
  assert.deepEqual(runEngine(input), result);
  const all = [result.reference, ...Object.values(result.results), ...Object.values(result.baselineClimate)];
  for (const simulation of all) {
    const start = simulation.years[0];
    assert.ok(start.isBaselineYear);
    assert.ok(Math.abs(start.soilImprovementPotential!.socTCHa - farm.socStockTCHa!) / farm.socStockTCHa! < 0.01);
    assert.equal(start.soilImprovementPotential!.deltaTCHa, 0);
    assert.equal(start.soilImprovementPotential!.deltaPctPerYear, 0);
    assert.equal(start.soilCarbonInputs!.equilibriumPlantC, result.reference.years[0].soilCarbonInputs!.equilibriumPlantC);
    for (const year of simulation.years) {
      assert.equal(year.dataStatus.soilImprovementPotential, "estimated");
      assert.ok(Number.isFinite(year.soilImprovementPotential!.socTCHa));
      assert.ok(Number.isFinite(year.overallScore));
      const soil = year.soilImprovementPotential!;
      assert.ok(Math.abs(year.criteriaScores.soil! - (0.7 * soil.score + 0.3 * year.rotationDiversity.score)) < 1e-10);
    }
  }
});

test("missing soil or an unidentifiable bare-fallow spin-up excludes the soil criterion", () => {
  const climate = getDemoSnapshot();
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  for (const patch of [{ clayPercent: null }, { socStockTCHa: null }, { cropHistory: { ...farm.cropHistory, typicalPattern: { S1: "fallow", S2: "fallow", S3: "fallow" } } }]) {
    const result = runEngine({ farm: { ...farm, ...patch }, scenarios, climate, settings });
    for (const simulation of [result.reference, ...Object.values(result.results)]) for (const year of simulation.years) {
      assert.equal(year.soilImprovementPotential, null);
      assert.equal(year.criteriaScores.soil, null);
      assert.equal(year.dataStatus.soilImprovementPotential, "unavailable");
      assert.equal(year.contributions.soil, 0);
      assert.ok(Number.isFinite(year.overallScore));
    }
  }
});

test("RothC months align Dec–Nov climate, leap days and cross-year harvest carbon", () => {
  const climate = getDemoSnapshot();
  const prepared = prepareClimate(climate, "baseline");
  const initial = runEngine({ farm, climate, scenarios: [], settings }).reference.years[0];
  const next = { year: 2028, monthlyCover: Array(12).fill(null) as (string | null)[] };
  next.monthlyCover[0] = "rice";
  const crop = CROPS.find((c) => c.id === "rice")!;
  const carry = { ...initial.seasons[0], year: 2027, startOffset: 10, durationDays: 100, cropId: "rice" };
  const months = rothCMonths(next, prepared, [carry], true);
  assert.equal(months[0].tempC, prepared.climatology[11].t2m);
  assert.equal(months[0].panEvapMm, prepared.climatology[11].et0Day * 31 / 0.75);
  assert.equal(months[2].panEvapMm, prepared.climatology[1].et0Day * 29 / 0.75);
  assert.equal(months[0].waterRegime, "paddyFlooded");
  assert.equal(months[1].waterRegime, "paddyDrained");
  assert.equal(rothCMonths(next, prepared, [], false)[1].waterRegime, "upland");
  assert.ok(Math.abs(months[1].plantC - crop.rothc.residueCTHa) < 1e-12); // Oct 1 + 99 days -> Jan 8.
  assert.ok(Math.abs(months.reduce((sum, m) => sum + m.plantC, 0) - crop.rothc.residueCTHa) < 1e-12);
  assert.ok(months.every((m) => m.fymC === 0));
});

test("SOC levels and score follow the disclosed 4-per-1000 reference scale", () => {
  assert.equal(soilCarbonRating(-0.401).level, 1);
  assert.equal(soilCarbonRating(-0.4).level, 2);
  assert.equal(soilCarbonRating(-0.1).level, 2);
  assert.equal(soilCarbonRating(0).level, 3);
  assert.equal(soilCarbonRating(0.1).level, 4);
  assert.equal(soilCarbonRating(0.4).level, 5);
  assert.equal(soilCarbonRating(-2).score, 0);
  assert.equal(soilCarbonRating(0).score, 50);
  assert.equal(soilCarbonRating(2).score, 100);
});

test("point coordinates and historical dates reject invalid values", () => {
  const now = new Date("2026-11-14T00:00:00Z");
  assert.equal(pointFromQuery(new URLSearchParams("lon=0")), null);
  assert.equal(pointFromQuery(new URLSearchParams("lat=&lon=105")), null);
  assert.equal(pointFromQuery(new URLSearchParams("lat=91&lon=105")), null);
  assert.deepEqual(pointFromQuery(new URLSearchParams("lat=0&lon=0")), { lat: 0, lon: 0 });
  assert.equal(historyYears(new URLSearchParams("start=2026&end=2027"), 1984, now), null);
  assert.equal(historyYears(new URLSearchParams("start=2000&end=2025"), 1984, now), null);
  assert.equal(vegetationDates(new URLSearchParams("start=2024-02-30&end=2024-04-01"), now), null);
  assert.deepEqual(monthPeriod(2024, 2), ["2024-02-01", "2024-02-29"]);
  assert.equal(getOfflineClimate(16.4852, 107.493), null);
});

test("field geometry rejects self-crossings and returns a validated location for concave fields", () => {
  assert.equal(fieldBoundary([[0, 0], [0.001, 0.001], [0, 0.001], [0.001, 0]]), null);
  assert.equal(fieldBoundary([[0, 0], [0.001, 0], [0, 0]]), null);
  const field = fieldBoundary([[105, 10], [105.002, 10], [105.002, 10.001], [105.001, 10.001], [105.001, 10.002], [105, 10.002]]);
  assert.ok(field && field.areaHa > 2 && field.areaHa < 5);
  assert.ok(field.lat < 10.001 || field.lon < 105.001);
});

test("POWER checks reported units and never fills required inputs", () => {
  const units = { PRECTOTCORR: "mm/day", T2M: "C", T2M_RANGE: "C", RH2M: "%", WS2M: "m/s", ALLSKY_SFC_SW_DWN: "MJ/m^2/day" };
  const data: PowerJson = {
    geometry: { coordinates: [105, 10, 12] },
    parameters: Object.fromEntries(Object.entries(units).map(([k, unit]) => [k, { units: unit }])),
    properties: { parameter: Object.fromEntries(Object.keys(units).map((k) => [k, Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`2024${String(i + 1).padStart(2, "0")}`, k === "PRECTOTCORR" ? 3 : 20]),
    )])) },
  };
  const opts = { lat: 10, lon: 105, start: 2024, end: 2024, retrievedAt: "2026-11-14T00:00:00Z", cached: false };
  const climate = parsePowerMonthly(data, opts);
  assert.equal(climate.months[1].precipMm, 87);
  assert.equal(climate.status, "estimated");
  data.properties!.parameter!.RH2M["202402"] = -999;
  assert.throws(() => parsePowerMonthly(data, opts), { message: "unavailable" });
  data.parameters!.PRECTOTCORR.units = "in/day";
  assert.throws(() => parsePowerMonthly(data, opts), { message: "upstream" });
});

test("ORNL one-pixel sample joins and masks quality bands", async () => {
  assert.equal(normalizeNdvi("2024-01-01", -2000, 0, 0).ndvi, -0.2);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 1, 0).quality, "marginal");
  assert.equal(normalizeNdvi("2024-01-01", 7000, 1, 0).ndvi, 0.7);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 2, 0).ndvi, null);
  assert.equal(normalizeNdvi("2024-01-01", 7000, 0, 1 << 10).ndvi, null);
  assert.equal(normalizeNdvi("2024-01-01", -3000, 0, 0).ndvi, null);
  const date = { modis_date: "A2024001", calendar_date: "2024-01-01" };
  const mock: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    const band = url.searchParams.get("band");
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band, data: [band?.endsWith("_NDVI") ? 7500 : 0] }] });
  };
  const ndvi = await fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, mock);
  assert.equal(ndvi.points[0].ndvi, 0.75);
  assert.equal(ndvi.evidence?.productId, "MOD13Q1.061");
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2025-01-01", end: "2025-01-31" }, mock), { message: "unavailable" });
  // every composite cloudy: an empty series must not be returned (and cached) as an observation
  const cloudy: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    const band = url.searchParams.get("band");
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band, data: [band?.endsWith("_NDVI") ? 7500 : band?.endsWith("_reliability") ? 3 : 0] }] });
  };
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, cloudy), { message: "unavailable" });
  // a provider outage on most requests is thrown, not returned as gaps
  const flaky: typeof fetch = async (request) => {
    const url = new URL(String(request));
    if (url.pathname.endsWith("/dates")) return Response.json({ dates: [date] });
    if (!url.searchParams.get("band")?.endsWith("_NDVI")) return new Response("busy", { status: 400 });
    return Response.json({ nrows: 1, ncols: 1, subset: [{ ...date, band: url.searchParams.get("band"), data: [7500] }] });
  };
  await assert.rejects(fetchNdviSeries(10, 105, { start: "2024-01-01", end: "2024-01-01" }, flaky));
});

test("IMERG requires named source and rejects monthly totals with missing days", () => {
  const values = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`202401${String(i + 1).padStart(2, "0")}`, 2]));
  const json: PowerJson = { properties: { parameter: { IMERG_PRECTOT: values } },
    header: { sources: ["IMERG"], time_standard: "UTC" }, parameters: { IMERG_PRECTOT: { units: "mm/day" } } };
  const dataset = aggregateImerg(json, 10, 105, 2024, 2024);
  assert.equal(dataset.observations[0].value, 62);
  assert.equal(dataset.observations[1].value, null);
  json.header!.sources = ["MERRA2"];
  assert.throws(() => aggregateImerg(json, 10, 105, 2024, 2024), { message: "unavailable" });
});

test("SMAP scale, no-data and three-year climatology", () => {
  assert.equal(normalizeSmap(-99956, 100, 1000), 0.44);
  assert.equal(normalizeSmap(NaN, 100, 1000), null);
  assert.equal(normalizeSmap(-9999, 100, 1000), null);
  const archive = getDemoSnapshot();
  const series: EnvironmentalSeries = {
    status: "estimated", cached: false,
    evidence: { provider: "NASA", dataset: "SMAP", productId: "SMAP", geometry: { type: "Point", coordinates: [farm.longitude, farm.latitude] },
      period: ["2016-01-01", "2025-12-31"], resolution: "9 km", retrievedAt: archive.retrievedAt, sourceUrl: "", quality: "" },
    observations: archive.months.map((m) => ({ variable: "root_zone_soil_moisture", unit: "m³/m³", quality: "valid",
      period: monthPeriod(m.year, m.month), value: [8, 9, 10].includes(m.month) ? 0.5 : 0.2 })),
  };
  assert.deepEqual([...smapWetMonths(series, farm)], [8, 9, 10]);
  assert.equal(smapWetMonths({ ...series, observations: series.observations.slice(0, 24) }, farm).size, 0);
});

test("rate limits and upstream outages give controlled errors", async () => {
  let attempts = 0;
  const transient: typeof fetch = async () => (++attempts === 1 ? new Response(null, { status: 503 }) : Response.json({ ok: true }));
  assert.deepEqual(await upstreamJson("https://example.test", 2000, transient), { ok: true });
  const limited: typeof fetch = async () => new Response(null, { status: 429, headers: { "Retry-After": "120" } });
  await assert.rejects(upstreamJson("https://example.test", 1000, limited), (e: unknown) =>
    e instanceof ProviderError && e.code === "rate_limited");
  const unauthorized: typeof fetch = async () => new Response("provider response never forwarded", { status: 401 });
  await assert.rejects(upstreamJson("https://example.test", 1000, unauthorized), { message: "upstream" });
});

test("three plans are distinct and complete, same-point IMERG changes the model", () => {
  const climate = { ...getDemoSnapshot(), latitude: farm.latitude, longitude: farm.longitude };
  const imerg: EnvironmentalSeries = {
    status: "observed", cached: false,
    evidence: { provider: "NASA", dataset: "IMERG", productId: "IMERG", geometry: { type: "Point", coordinates: [farm.longitude, farm.latitude] },
      period: ["2016-01-01", "2025-12-31"], resolution: "0.1 degree", retrievedAt: climate.retrievedAt, sourceUrl: "", quality: "" },
    observations: climate.months.map((m) => ({ variable: "precipitation", unit: "mm/month", quality: "valid",
      period: monthPeriod(m.year, m.month), value: m.precipMm * 0.2 })),
  };
  const scenarios = buildDefaultScenarios(farm, climate, settings);
  const sequences = scenarios.map((s) => s.seasonalCropSequence.slice(0, 3).map((slot) => slot.cropId).join(","));
  assert.equal(new Set([Object.values(farm.cropHistory.typicalPattern).join(","), ...sequences]).size, 4);
  const original = runEngine({ farm, scenarios, climate, settings });
  const modelClimate = climateWithImerg(climate, imerg);
  const withImerg = runEngine({ farm, scenarios, climate: modelClimate, settings });
  assert.ok(withImerg.reference.years[1].waterDemand.median > original.reference.years[1].waterDemand.median);
  assert.equal(climateWithImerg(climate, { ...imerg, observations: imerg.observations.slice(1) }), climate);
  const missingSoil: FarmProfile = { ...farm, soilPH: null, soilOrganicCarbon: null, drainage: "poor" };
  assert.ok(Number.isFinite(runEngine({ farm: missingSoil, scenarios, climate, settings }).reference.years[1].overallScore));
  const overlap = { ...scenarios[0], seasonalCropSequence: scenarios[0].seasonalCropSequence.map((slot) => (
    { ...slot, cropId: "rice", plantingMonth: slot.season === "S1" ? 1 : slot.season === "S2" ? 3 : 9 }
  )) };
  assert.ok(runEngine({ farm, scenarios: [overlap], climate, settings }).results[overlap.id].years[1].seasons.some((s) => s.overlap));
});
