/**
 * RothC-26.3 soil organic carbon model: monthly time step, pure functions, no I/O.
 *
 * Port of the official Rothamsted Python release (RothC_Py.py, Apache License 2.0,
 * https://github.com/Rothamsted-Models/RothC_Py, commit bd90ce3), itself translated from the Fortran code by
 * A. Milne, J. Prout and K. Coleman. The calculation order and constants follow that code so the results
 * match the reference output in data/rothc-reference. The equations are described in Coleman, Prout & Milne
 * (2024) "RothC – A model for the turnover of carbon in soil. Model description", sections 1.3–1.7.
 * Radiocarbon (section 1.8) is intentionally not modelled.
 *
 * Paddy-soil extension: Shirato & Yokozawa (2005), Soil Sci. Plant Nutr. 51:405–415,
 * doi:10.1111/j.1747-0765.2005.tb00046.x
 *  - "the decomposition rates of the original RothC were changed by multiplying by factors with a value of 0.2
 *    in summer (during the rice-growing period) and 0.6 in winter (period without rice-growing)" (Fig. 2 caption).
 *    The factor multiplies the original rate a·b·c; a, b and c are still calculated.
 *  - "Summer" runs from the month of transplanting until the month of harvest. "Winter" is every other period of
 *    a paddy field, whether it is fallow or carries a winter crop (Table 3, footnote a).
 *  - 0.2 / 0.6 is the best overall fit for nine Japanese plots. Optima for individual plots ranged 0–0.5 (summer)
 *    and 0.25–1 (winter) (Table 4), so treat the factors as uncertain outside Japan.
 *  - Not from the paper (our addition): a ponded field cannot have a topsoil moisture deficit, so the deficit is
 *    reset to 0 in `paddyFlooded` months. The paper's sites grew rice in the rainy Japanese summer, where rain
 *    alone keeps the deficit near 0. Dry-season rice in the Mekong Delta is irrigated, and counting rain alone
 *    would wrongly dry out a flooded field.
 */

/** Soil water regime of one month. `paddyFlooded`/`paddyDrained` select the Shirato & Yokozawa (2005) factors. */
export type WaterRegime = "upland" | "paddyFlooded" | "paddyDrained";

/** Site properties that drive soil water and the CO2 / (BIO+HUM) partition. */
export interface RothCSite {
  /** clay content, %, mean over the modelled layer */
  clayPercent: number;
  /** thickness of the modelled topsoil layer, cm */
  depthCm: number;
}

export interface RothCSoil extends RothCSite {
  /** total soil organic carbon including IOM, t C/ha, over `depthCm` */
  socStockTCHa: number;
  /** inert organic matter, t C/ha. Omit to estimate it with Falloon et al. (1998). */
  iomTCHa?: number;
}

export interface RothCMonth {
  /** mean air temperature, °C */
  tempC: number;
  /** monthly rainfall, mm */
  rainMm: number;
  /** monthly open-pan evaporation, mm; may be slightly negative (the model uses 0.75 × pan evaporation as evapotranspiration) */
  panEvapMm: number;
  /** living plant cover this month: c = 0.6 if vegetated, 1.0 if bare */
  vegetated: boolean;
  waterRegime: WaterRegime;
  /** plant residue carbon added at the end of the month, t C/ha */
  plantC: number;
  /** DPM/RPM ratio of `plantC`: 1.44 most crops and improved grassland, 0.67 unimproved grassland, 0.25 woodland */
  dpmRpm: number;
  /** farmyard manure carbon added at the end of the month, t C/ha */
  fymC: number;
}

export interface RothCPools { dpm: number; rpm: number; bio: number; hum: number; iom: number }

export interface RothCStep {
  /** pools at the end of the month, after inputs were added */
  pools: RothCPools;
  /** total soil organic carbon including IOM, t C/ha */
  totalC: number;
  /** accumulated topsoil moisture deficit at the end of the month, mm (≤ 0) */
  tsmd: number;
  /** carbon released as CO2 during the month, t C/ha */
  co2C: number;
  /** combined rate modifier a · b · c · paddy factor used this month */
  rateModifier: number;
}

/** Decomposition rate constants, year⁻¹ (section 1.5). */
export const RATE_CONSTANTS = { dpm: 10.0, rpm: 0.3, bio: 0.66, hum: 0.02 } as const;

/** Multipliers on the original decomposition rate (Shirato & Yokozawa 2005). */
export const PADDY_FACTOR: Record<WaterRegime, number> = { upland: 1, paddyFlooded: 0.2, paddyDrained: 0.6 };

const MONTH = 1 / 12;
const BIO_SHARE = 0.46;
const HUM_SHARE = 0.54;
const MAX_SPIN_UP_YEARS = 100_000;

/** Rate modifying factor for temperature, a (section 1.6). Zero below −5 °C, as in the official code. */
export function temperatureFactor(tempC: number) {
  return tempC < -5 ? 0 : 47.91 / (Math.exp(106.06 / (tempC + 18.27)) + 1);
}

/** Maximum topsoil moisture deficit for a layer of `depthCm`, mm (negative). */
export function maxTsmd(clayPercent: number, depthCm: number) {
  return (-(20 + 1.3 * clayPercent - 0.01 * clayPercent * clayPercent) * depthCm) / 23;
}

/** Accumulated topsoil moisture deficit after one month (section 1.6, official code order). */
export function nextTsmd(previous: number, month: Pick<RothCMonth, "rainMm" | "panEvapMm" | "vegetated">, site: RothCSite) {
  const max = maxTsmd(site.clayPercent, site.depthCm);
  const bare = 0.556 * max; // = max / 1.8
  const wetted = Math.min(0, previous + month.rainMm - 0.75 * month.panEvapMm);
  // Bare soil does not dry beyond the bare-soil limit, unless it was already drier.
  return Math.max(month.vegetated ? max : Math.min(bare, previous), wetted);
}

/** Rate modifying factor for moisture, b (section 1.6). */
export function moistureFactor(tsmd: number, site: RothCSite) {
  const max = maxTsmd(site.clayPercent, site.depthCm);
  const oneBar = 0.444 * max;
  return tsmd > oneBar ? 1 : 0.2 + (0.8 * (max - tsmd)) / (max - oneBar);
}

/** Soil cover rate modifying factor, c (section 1.6). */
export function coverFactor(vegetated: boolean) {
  return vegetated ? 0.6 : 1;
}

/** Ratio x = CO2 / (BIO + HUM) formed during decomposition (section 1.7). */
export function co2Ratio(clayPercent: number) {
  return 1.67 * (1.85 + 1.6 * Math.exp(-0.0786 * clayPercent));
}

/** Inert organic matter from total organic carbon, both t C/ha (Falloon et al., 1998). */
export function falloonIom(totalOrganicCarbon: number) {
  return 0.049 * totalOrganicCarbon ** 1.139;
}

export function totalCarbon(p: RothCPools) {
  return p.dpm + p.rpm + p.bio + p.hum + p.iom;
}

const activeCarbon = (p: RothCPools) => p.dpm + p.rpm + p.bio + p.hum;

/**
 * One month of decomposition with a known combined rate modifier, then end-of-month inputs
 * (section 1.4 and the official `decomp` routine).
 */
export function decomposeMonth(
  pools: RothCPools,
  rateModifier: number,
  clayPercent: number,
  input: Pick<RothCMonth, "plantC" | "dpmRpm" | "fymC">,
): { pools: RothCPools; co2C: number } {
  const k = RATE_CONSTANTS;
  const dpm = pools.dpm * Math.exp(-rateModifier * k.dpm * MONTH);
  const rpm = pools.rpm * Math.exp(-rateModifier * k.rpm * MONTH);
  const bio = pools.bio * Math.exp(-rateModifier * k.bio * MONTH);
  const hum = pools.hum * Math.exp(-rateModifier * k.hum * MONTH);
  const decomposed = (pools.dpm - dpm) + (pools.rpm - rpm) + (pools.bio - bio) + (pools.hum - hum);

  const x = co2Ratio(clayPercent);
  const plantDpm = (input.dpmRpm / (input.dpmRpm + 1)) * input.plantC;
  const plantRpm = (1 / (input.dpmRpm + 1)) * input.plantC;
  return {
    pools: {
      dpm: dpm + plantDpm + 0.49 * input.fymC,
      rpm: rpm + plantRpm + 0.49 * input.fymC,
      bio: bio + decomposed * (BIO_SHARE / (x + 1)),
      hum: hum + decomposed * (HUM_SHARE / (x + 1)) + 0.02 * input.fymC,
      iom: pools.iom,
    },
    co2C: decomposed * (x / (x + 1)),
  };
}

/** Advance the model by one month. */
export function stepMonth(site: RothCSite, pools: RothCPools, month: RothCMonth, tsmd: number): RothCStep {
  const flooded = month.waterRegime === "paddyFlooded";
  const nextDeficit = flooded ? 0 : nextTsmd(tsmd, month, site);
  const rateModifier = temperatureFactor(month.tempC) * moistureFactor(nextDeficit, site) *
    coverFactor(month.vegetated) * PADDY_FACTOR[month.waterRegime];
  const result = decomposeMonth(pools, rateModifier, site.clayPercent, month);
  return { pools: result.pools, totalC: totalCarbon(result.pools), tsmd: nextDeficit, co2C: result.co2C, rateModifier };
}

/** Run the model forward month by month from `start`. The soil is at field capacity unless `startTsmd` says otherwise. */
export function runRothC(site: RothCSite, start: RothCPools, months: RothCMonth[], startTsmd = 0): RothCStep[] {
  checkSite(site);
  months.forEach(checkMonth);
  const steps: RothCStep[] = [];
  let pools = start;
  let tsmd = startTsmd;
  for (const month of months) {
    const step = stepMonth(site, pools, month, tsmd);
    steps.push(step);
    pools = step.pools;
    tsmd = step.tsmd;
  }
  return steps;
}

/**
 * Forward run to equilibrium, as in the official code: start from empty active pools and repeat the 12-month
 * `year` until the active carbon changes by no more than `tolerance` t C/ha between consecutive years.
 * Returns the state at the end of the last December.
 */
export function equilibrium(site: RothCSite, year: RothCMonth[], iomTCHa: number, tolerance = 1e-6) {
  checkSite(site);
  checkYear(year);
  if (!(iomTCHa >= 0)) throw new RangeError("IOM must be ≥ 0 t C/ha");
  let pools: RothCPools = { dpm: 0, rpm: 0, bio: 0, hum: 0, iom: iomTCHa };
  let tsmd = 0;
  let previous = 0;
  for (let years = 1; years <= MAX_SPIN_UP_YEARS; years++) {
    for (const month of year) {
      const step = stepMonth(site, pools, month, tsmd);
      pools = step.pools;
      tsmd = step.tsmd;
    }
    const active = activeCarbon(pools);
    if (Math.abs(active - previous) <= tolerance) return { pools, tsmd, years };
    previous = active;
  }
  throw new RangeError(`RothC did not reach equilibrium within ${MAX_SPIN_UP_YEARS} years`);
}

/**
 * Inverse spin-up (section 2.1): find the annual plant input that holds the soil at `socStockTCHa` in
 * equilibrium under `year`, and the pool split at that equilibrium.
 *
 * `year[i].plantC` is read as the monthly distribution of the input: only the relative values matter. With no
 * manure, every active pool at equilibrium is proportional to the plant input, so one run with 1 t C/ha/year
 * scaled by (SOC − IOM) / active C gives the exact answer.
 */
export function spinUp(soil: RothCSoil, year: RothCMonth[]): { pools: RothCPools; annualPlantC: number; tsmd: number } {
  checkSite(soil);
  checkYear(year);
  if (!(soil.socStockTCHa > 0)) throw new RangeError("SOC stock must be > 0 t C/ha");
  if (year.some((m) => m.fymC !== 0)) throw new RangeError("Inverse spin-up supports plant inputs only (fymC must be 0)");
  const yearInput = year.reduce((sum, m) => sum + m.plantC, 0);
  if (!(yearInput > 0)) throw new RangeError("The spin-up year needs a plant input in at least one month");

  const iom = soil.iomTCHa ?? falloonIom(soil.socStockTCHa);
  const activeTarget = soil.socStockTCHa - iom;
  if (!(activeTarget > 0)) throw new RangeError("IOM must be smaller than the SOC stock");

  const unitYear = year.map((m) => ({ ...m, plantC: m.plantC / yearInput }));
  const unit = equilibrium(soil, unitYear, 0, 1e-12);
  const scale = activeTarget / activeCarbon(unit.pools);
  return {
    pools: { dpm: unit.pools.dpm * scale, rpm: unit.pools.rpm * scale, bio: unit.pools.bio * scale, hum: unit.pools.hum * scale, iom },
    annualPlantC: scale,
    tsmd: unit.tsmd,
  };
}

function checkSite(site: RothCSite) {
  if (!(site.clayPercent >= 0 && site.clayPercent <= 100)) throw new RangeError("Clay must be between 0 and 100 %");
  if (!(site.depthCm > 0 && Number.isFinite(site.depthCm))) throw new RangeError("Depth must be > 0 cm");
}

function checkYear(year: RothCMonth[]) {
  if (year.length !== 12) throw new RangeError("A spin-up year needs exactly 12 months");
  year.forEach(checkMonth);
}

function checkMonth(m: RothCMonth, index: number) {
  const finite = [m.tempC, m.rainMm, m.panEvapMm, m.plantC, m.dpmRpm, m.fymC].every(Number.isFinite);
  // Pan evaporation may be slightly negative (condensation): the official example input contains such months.
  if (!finite || m.rainMm < 0 || m.plantC < 0 || m.fymC < 0 || m.dpmRpm <= 0 || !(m.waterRegime in PADDY_FACTOR)) {
    throw new RangeError(`Invalid RothC input in month ${index + 1}`);
  }
}
