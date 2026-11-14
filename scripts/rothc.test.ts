import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  co2Ratio, coverFactor, decomposeMonth, equilibrium, falloonIom, maxTsmd, moistureFactor, nextTsmd, PADDY_FACTOR,
  runRothC, spinUp, stepMonth, temperatureFactor, totalCarbon, type RothCMonth, type RothCPools, type RothCSite,
} from "../lib/engine/rothc";

const close = (actual: number, expected: number, tolerance: number, label: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected} ± ${tolerance}, got ${actual}`);

/* ----------------------- official Rothamsted reference run ----------------------- */

const referenceDir = new URL("../data/rothc-reference/", import.meta.url);
const inputLines = readFileSync(new URL("RothC_input.dat", referenceDir), "utf8").trim().split(/\r?\n/);
const [clay, depth, iom, nsteps] = inputLines[4].trim().split(/\s+/).map(Number);
const referenceSite: RothCSite = { clayPercent: clay, depthCm: depth };
const referenceMonths: RothCMonth[] = inputLines.slice(7).map((line) => {
  const [, , , tmp, rain, evap, cInp, fym, pc, dpmRpm] = line.trim().split(/\s+/).map(Number);
  return { tempC: tmp, rainMm: rain, panEvapMm: evap, vegetated: pc === 1, waterRegime: "upland", plantC: cInp, dpmRpm, fymC: fym };
});
const readCsv = (name: string) => readFileSync(new URL(name, referenceDir), "utf8").trim().split(/\r?\n/).slice(1)
  .map((line) => line.split(",").map(Number));
const monthResults = readCsv("month_results.csv");
const yearResults = readCsv("year_results.csv");
const poolsOf = (row: number[]): RothCPools => ({ dpm: row[2], rpm: row[3], bio: row[4], hum: row[5], iom: row[6] });

test("reference input file is complete", () => {
  assert.deepEqual([clay, depth, iom, nsteps], [13, 25, 3.0041, 840]);
  assert.equal(referenceMonths.length, nsteps);
  assert.equal(monthResults.length, nsteps - 12);
});

const referenceEquilibrium = equilibrium(referenceSite, referenceMonths.slice(0, 12), iom);

test("equilibrium run matches the official RothC_Py spin-up", () => {
  const [, months, ...expected] = yearResults[0];
  // The official loop stops after 19,872 months; the same stopping rule must stop in the same year.
  assert.equal(referenceEquilibrium.years * 12, months);
  const pools = poolsOf(yearResults[0]);
  for (const key of ["dpm", "rpm", "bio", "hum", "iom"] as const) close(referenceEquilibrium.pools[key], pools[key], 1e-9, key);
  close(totalCarbon(referenceEquilibrium.pools), expected[5], 1e-9, "SOC");
});

test("monthly forward run matches every official RothC_Py month (1939–2007)", () => {
  const steps = runRothC(referenceSite, referenceEquilibrium.pools, referenceMonths.slice(12), referenceEquilibrium.tsmd);
  assert.equal(steps.length, monthResults.length);
  let worst = 0;
  steps.forEach((step, i) => {
    const expected = poolsOf(monthResults[i]);
    for (const key of ["dpm", "rpm", "bio", "hum", "iom"] as const) worst = Math.max(worst, Math.abs(step.pools[key] - expected[key]));
    worst = Math.max(worst, Math.abs(step.totalC - monthResults[i][7]));
  });
  assert.ok(worst < 1e-9, `largest difference from the official output: ${worst} t C/ha`);
});

test("inverse spin-up recovers the official plant input and pools", () => {
  const soc = yearResults[0][7];
  const result = spinUp({ ...referenceSite, socStockTCHa: soc, iomTCHa: iom }, referenceMonths.slice(0, 12));
  // The reference file adds 1.74 t C/ha every August. The official run stops within 1e-6 t C/ha/year of
  // equilibrium, so the recovered input differs from 1.74 only in the sixth significant digit.
  close(result.annualPlantC, 1.74, 1e-4, "annual plant input");
  close(totalCarbon(result.pools), soc, 1e-9, "SOC");
  const expected = poolsOf(yearResults[0]);
  for (const key of ["dpm", "rpm", "bio", "hum"] as const) close(result.pools[key], expected[key], 1e-3, key);
});

/* --------------------- worked numbers in the RothC description --------------------- */

test("TSMD table for Rothamsted (description p. 11)", () => {
  const rain = [74, 59, 62, 51, 52, 57, 34, 55, 58, 56, 75, 71];
  const pan = [8, 10, 27, 49, 83, 99, 103, 91, 69, 34, 16, 8];
  const expected = [0, 0, 0, 0, -10.25, -27.5, -44.94, -44.94, -38.69, -8.19, 0, 0];
  const site = { clayPercent: 23.4, depthCm: 23 };
  let tsmd = 0;
  rain.forEach((r, i) => {
    tsmd = nextTsmd(tsmd, { rainMm: r, panEvapMm: pan[i], vegetated: true }, site);
    close(tsmd, expected[i], 0.01, `month ${i + 1}`);
  });
});

test("maximum TSMD, clay partition and IOM equations (description pp. 10, 13, 16, 18)", () => {
  close(maxTsmd(23.4, 23), -44.94, 0.01, "max TSMD at Rothamsted");
  close(maxTsmd(23.4, 46), 2 * maxTsmd(23.4, 23), 1e-12, "max TSMD scales with depth / 23");
  close(co2Ratio(23.4), 3.51, 0.01, "CO2/(BIO+HUM) at 23.4 % clay");
  close(falloonIom(33.8), 2.7, 0.01, "Hoosfield IOM");
});

test("IOM values in Shirato & Yokozawa (2005) Table 1 follow Falloon et al. (1998)", () => {
  const sites: [number, number][] = [[21.4, 1.6], [25.2, 1.9], [24.9, 1.9], [28.5, 2.2], [19.1, 1.4]];
  for (const [soc, iomTable] of sites) close(falloonIom(soc), iomTable, 0.05, `SOC ${soc}`);
});

test("one month of decomposition at Hoosfield, January 1852 (description pp. 20–22)", () => {
  const start = { dpm: 0.1533, rpm: 4.4852, bio: 0.6671, hum: 25.8576, iom: 2.7 };
  const { pools, co2C } = decomposeMonth(start, 0.3561, 23.4, { plantC: 0, dpmRpm: 1.44, fymC: 0 });
  // The description truncates every intermediate value to 4 decimals (e.g. DPM loses 0.039361 → "0.0393") and
  // uses x = 3.51. Pools are compared within 2e-4. The CO2 row sums four truncated values, so it can be up to
  // 4 × 1e-4 low.
  close(pools.dpm, 0.114, 2e-4, "DPM");
  close(pools.rpm, 4.4455, 2e-4, "RPM");
  close(pools.bio, 0.6651, 2e-4, "BIO");
  close(pools.hum, 25.8551, 2e-4, "HUM");
  close(co2C, 0.0307 + 0.0308 + 0.01 + 0.0119, 4e-4, "CO2-C");
});

test("rate modifying factors", () => {
  assert.equal(temperatureFactor(-6), 0);
  for (let t = -5; t < 40; t++) assert.ok(temperatureFactor(t + 1) > temperatureFactor(t), `a increases at ${t} °C`);
  assert.equal(coverFactor(true), 0.6);
  assert.equal(coverFactor(false), 1);
  const site = { clayPercent: 23.4, depthCm: 23 };
  const max = maxTsmd(23.4, 23);
  assert.equal(moistureFactor(0, site), 1);
  assert.equal(moistureFactor(0.444 * max + 0.01, site), 1);
  close(moistureFactor(max, site), 0.2, 1e-12, "b at the maximum deficit");
});

test("bare soil dries only to the bare-soil limit unless it is already drier", () => {
  const site = { clayPercent: 23.4, depthCm: 23 };
  const bareLimit = 0.556 * maxTsmd(23.4, 23);
  const dry = { rainMm: 0, panEvapMm: 200, vegetated: false };
  close(nextTsmd(0, dry, site), bareLimit, 1e-12, "bare limit");
  close(nextTsmd(-40, dry, site), -40, 1e-12, "already drier than the bare limit");
});

/* ------------------------------ paddy extension ------------------------------ */

const dryMonth: RothCMonth = {
  tempC: 27, rainMm: 5, panEvapMm: 180, vegetated: true, waterRegime: "upland", plantC: 0, dpmRpm: 1.44, fymC: 0,
};
const somePools: RothCPools = { dpm: 0.2, rpm: 3, bio: 0.6, hum: 25, iom: 2.5 };

test("paddy factors multiply the original RothC rate (Shirato & Yokozawa 2005)", () => {
  assert.deepEqual(PADDY_FACTOR, { upland: 1, paddyFlooded: 0.2, paddyDrained: 0.6 });
  const site = { clayPercent: 40, depthCm: 30 };
  const upland = stepMonth(site, somePools, dryMonth, -10);
  const drained = stepMonth(site, somePools, { ...dryMonth, waterRegime: "paddyDrained" }, -10);
  close(drained.rateModifier, 0.6 * upland.rateModifier, 1e-12, "drained = 0.6 × original");
  assert.equal(drained.tsmd, upland.tsmd);
  assert.ok(drained.co2C < upland.co2C);
});

test("a flooded month has no moisture deficit and decomposes at 0.2 × the moist upland rate", () => {
  const site = { clayPercent: 40, depthCm: 30 };
  // Dry weather and a dry start: without the flood the deficit would reach its maximum.
  const flooded = stepMonth(site, somePools, { ...dryMonth, waterRegime: "paddyFlooded" }, -30);
  assert.equal(flooded.tsmd, 0);
  close(flooded.rateModifier, 0.2 * temperatureFactor(27) * 1 * coverFactor(true), 1e-12, "flooded rate");
  const moistUpland = stepMonth(site, somePools, { ...dryMonth, rainMm: 300 }, 0);
  assert.equal(moistUpland.tsmd, 0);
  close(flooded.rateModifier, 0.2 * moistUpland.rateModifier, 1e-12, "0.2 × moist upland");
  assert.ok(flooded.co2C < moistUpland.co2C);
});

/* ---------------------------- invariants and guards ---------------------------- */

test("carbon is conserved: change in SOC = inputs − CO2", () => {
  const months = referenceMonths.slice(12, 120).map((m, i) => ({
    ...m, fymC: i % 12 === 1 ? 3 : 0, waterRegime: (["upland", "paddyFlooded", "paddyDrained"] as const)[i % 3],
  }));
  const steps = runRothC(referenceSite, referenceEquilibrium.pools, months, referenceEquilibrium.tsmd);
  const inputs = months.reduce((s, m) => s + m.plantC + m.fymC, 0);
  const co2 = steps.reduce((s, x) => s + x.co2C, 0);
  close(steps.at(-1)!.totalC - totalCarbon(referenceEquilibrium.pools), inputs - co2, 1e-9, "carbon balance");
});

test("after spin-up, repeating the same year keeps SOC at the target", () => {
  const year: RothCMonth[] = referenceMonths.slice(0, 12).map((m, i) => ({
    ...m, plantC: i === 3 || i === 9 ? 1 : 0, waterRegime: i >= 4 && i <= 7 ? "paddyFlooded" : "paddyDrained",
  }));
  const soil = { clayPercent: 45, depthCm: 30, socStockTCHa: 60 };
  const spun = spinUp(soil, year);
  close(totalCarbon(spun.pools), 60, 1e-9, "SOC after spin-up");
  close(spun.pools.iom, falloonIom(60), 1e-12, "IOM from Falloon");
  const scaled = year.map((m) => ({ ...m, plantC: (m.plantC / 2) * spun.annualPlantC }));
  const after = runRothC(soil, spun.pools, [...scaled, ...scaled, ...scaled], spun.tsmd);
  close(after.at(-1)!.totalC, 60, 1e-6, "SOC after three more years");
});

test("invalid inputs are rejected", () => {
  const year = referenceMonths.slice(0, 12);
  assert.throws(() => spinUp({ ...referenceSite, socStockTCHa: 30 }, year.slice(0, 11)), /12 months/);
  assert.throws(() => spinUp({ ...referenceSite, socStockTCHa: 30 }, year.map((m) => ({ ...m, plantC: 0 }))), /plant input/);
  assert.throws(() => spinUp({ ...referenceSite, socStockTCHa: 30 }, year.map((m) => ({ ...m, fymC: 1 }))), /fymC/);
  assert.throws(() => spinUp({ ...referenceSite, socStockTCHa: 30, iomTCHa: 30 }, year), /IOM/);
  assert.throws(() => spinUp({ ...referenceSite, socStockTCHa: 0 }, year), /SOC/);
  assert.throws(() => runRothC({ clayPercent: 120, depthCm: 30 }, somePools, year), /Clay/);
  assert.throws(() => runRothC({ clayPercent: 30, depthCm: 0 }, somePools, year), /Depth/);
  assert.throws(() => runRothC(referenceSite, somePools, [{ ...dryMonth, rainMm: Number.NaN }]), /month 1/);
  assert.throws(() => equilibrium(referenceSite, year.map((m) => ({ ...m, tempC: -10 })), iom), /equilibrium/);
});
