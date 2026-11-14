import type { FarmProfile, SourceTag } from "../types";

/** Empty/invalid measurements never become observations; zero remains a valid measurement. */
export function resolveSoilInput(input: string, estimate: number | null | undefined, source: string | undefined, max = Infinity) {
  const parsed = input.trim() ? Number(input.replace(",", ".")) : NaN;
  const observed = Number.isFinite(parsed) && parsed >= 0 && parsed <= max;
  const value = observed ? parsed : estimate ?? null;
  const tag: SourceTag = observed ? { status: "observed", source: "Farmer soil test · 0–30 cm" }
    : value !== null ? { status: "estimated", source: source ?? "ISRIC SoilGrids 2.0 · 0–30 cm" }
      : { status: "unavailable", source: "No complete 0–30 cm soil data" };
  return { value, tag };
}

/** Existing browser profiles predate RothC inputs. Do not infer them from texture or topsoil SOC %. */
export function withRothCSoil(farm: FarmProfile): FarmProfile {
  return {
    ...farm,
    clayPercent: farm.clayPercent ?? null,
    socStockTCHa: farm.socStockTCHa ?? null,
    soilSources: {
      ...farm.soilSources,
      clayPercent: farm.soilSources.clayPercent ?? { status: "unavailable", source: "Not provided · 0–30 cm" },
      socStockTCHa: farm.soilSources.socStockTCHa ?? { status: "unavailable", source: "Not provided · 0–30 cm" },
    },
  };
}
