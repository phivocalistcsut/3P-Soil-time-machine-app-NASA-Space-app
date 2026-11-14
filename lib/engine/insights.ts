import { getCrop, SEASONS } from "@/lib/data/crops";
import { extremesClimatology } from "@/lib/services/power-daily";
import type {
  ClimateAssumption,
  CustomClimate,
  ClimateDataset,
  Confidence,
  DailyExtremes,
  DataStatus,
  FarmProfile,
  Localized,
  NdviSeries,
  RotationScenario,
  SimulationResult,
} from "@/lib/types";
import { prepareClimate } from "./climate";
import { translateMessage } from "../i18n/messages";

/* ============================================================================
 * Insights built on top of engine results:
 *  - U1: 12-month "bare soil & vulnerable periods" calendar
 *  - U2: evidence · information gaps · questions for local experts
 * Pure functions, bilingual output.
 * ========================================================================== */

const Lx = (en: string, vi: string): Localized => ({ en, vi });
const shortName = (id: string | null) => {
  const c = getCrop(id);
  if (!c) return Lx("Bare", "Đất trống");
  return { en: c.name.en.replace(/\s*\(.*\)$/, ""), vi: c.name.vi.replace(/\s*\(.*\)$/, "") };
};

/** Crop-year months: index 0 = December of the previous year … 11 = November. */
export const CROP_YEAR_MONTHS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export type RowId = "cover" | "water" | "rain" | "heat" | "salinity" | "frost";
export interface CalendarCell {
  level: 0 | 1 | 2 | 3;
  cropId: string | null;
  value: Localized;
}
export interface CalendarRow {
  id: RowId;
  name: Localized;
  help: Localized;
  status: DataStatus;
  cells: CalendarCell[];
}
export interface VulnerabilityCalendar {
  rows: CalendarRow[];
  bareMonths: number[]; // month numbers 1–12
  worstMonths: number[]; // month numbers, most vulnerable first
  totals: number[]; // risk sum per crop-year month
}

const lv = (n: number): 0 | 1 | 2 | 3 => (n <= 0 ? 0 : n >= 3 ? 3 : (Math.round(n) as 1 | 2));

export function buildCalendar(input: {
  result: SimulationResult;
  farm: FarmProfile;
  climate: ClimateDataset;
  assumption: ClimateAssumption;
  custom?: CustomClimate | null;
  extremes: DailyExtremes | null;
}): VulnerabilityCalendar {
  const { result, farm, extremes } = input;
  const clim = prepareClimate(input.climate, input.assumption, input.custom).climatology;
  const ext = extremes ? extremesClimatology(extremes) : null;
  const climateStatus: DataStatus = input.climate.status === "illustrative" ? "illustrative" : "estimated";

  const cover: CalendarRow = {
    id: "cover",
    name: Lx("What is in the field", "Trên ruộng có gì"),
    help: Lx("Crop occupying most of the month; 'Bare' = no living crop for at least half the month.", "Cây chiếm phần lớn tháng; “Đất trống” = không có cây sống ít nhất nửa tháng."),
    status: "estimated",
    cells: CROP_YEAR_MONTHS.map((_, k) => {
      const crop = result.monthlyCover[k] ?? null;
      const bare = result.monthlyBare[k] ?? 1;
      return { cropId: crop, level: crop ? (bare > 0.2 ? 1 : 0) : 2, value: shortName(crop) };
    }),
  };

  const water: CalendarRow = {
    id: "water",
    name: Lx("Irrigation needed", "Cần tưới"),
    help: Lx("Median irrigation need of the crops in that month (mm).", "Lượng nước tưới trung vị của cây trong tháng (mm)."),
    status: climateStatus,
    cells: CROP_YEAR_MONTHS.map((_, k) => {
      const mm = result.monthlyIrrigation[k + 1] ?? 0;
      return { cropId: result.monthlyCover[k], level: mm < 10 ? 0 : mm < 60 ? 1 : mm < 120 ? 2 : 3, value: Lx(`${Math.round(mm)} mm`, `${Math.round(mm)} mm`) };
    }),
  };

  const rain: CalendarRow = {
    id: "rain",
    name: Lx("Heavy rain & waterlogging", "Mưa lớn, ngập úng"),
    help: Lx(
      "Wet months hurt upland crops that dislike waterlogging, and wash nutrients out of bare soil.",
      "Tháng mưa nhiều làm hại cây màu kỵ úng và rửa trôi dinh dưỡng khỏi đất trống.",
    ),
    status: ext ? "observed" : climateStatus,
    cells: CROP_YEAR_MONTHS.map((m, k) => {
      const p = clim[m - 1].precipMm;
      const heavy = ext?.[m - 1].heavyRainDays ?? 0;
      const crop = getCrop(result.monthlyCover[k]);
      let level = 0;
      if (!crop) level = p > 250 ? 2 : p > 150 ? 1 : 0;
      else if (crop.waterloggingTolerance === "low") level = p > 250 ? 3 : p > 150 ? 2 : p > 100 ? 1 : 0;
      else if (crop.waterloggingTolerance === "moderate") level = p > 250 ? 2 : p > 150 ? 1 : 0;
      if (heavy >= 0.5) level += 1;
      const value = ext ? Lx(`${Math.round(p)} mm · ${heavy.toFixed(1)} heavy days`, `${Math.round(p)} mm · ${heavy.toFixed(1).replace(".", ",")} ngày mưa lớn`) : Lx(`${Math.round(p)} mm`, `${Math.round(p)} mm`);
      return { cropId: result.monthlyCover[k], level: lv(level), value };
    }),
  };

  const heat: CalendarRow = {
    id: "heat",
    name: Lx("Heat stress", "Nắng nóng"),
    help: Lx(
      "Days with a daily maximum of 35 °C or more while a crop is in the field (NASA POWER daily; this reanalysis can run warmer than local stations).",
      "Số ngày nhiệt độ cao nhất từ 35 °C khi có cây trên ruộng (NASA POWER theo ngày; số liệu này có thể nóng hơn trạm đo địa phương).",
    ),
    status: ext ? "observed" : "unavailable",
    cells: CROP_YEAR_MONTHS.map((m, k) => {
      const crop = getCrop(result.monthlyCover[k]);
      const hot = ext?.[m - 1].hotDays ?? null;
      if (hot === null) return { cropId: result.monthlyCover[k], level: 0, value: Lx("—", "—") };
      const level = !crop ? 0 : hot < 1 ? 0 : hot < 5 ? 1 : hot < 15 ? 2 : 3;
      return { cropId: result.monthlyCover[k], level: lv(level), value: Lx(`${hot.toFixed(0)} days`, `${hot.toFixed(0)} ngày`) };
    }),
  };

  const rows: CalendarRow[] = [cover, water, rain, heat];

  if (farm.salinityRisk !== "none") {
    rows.push({
      id: "salinity",
      name: Lx("Salinity intrusion", "Xâm nhập mặn"),
      help: Lx("Feb–May, when canal water can turn salty in the dry season (from your farm profile).", "Tháng 2–5, khi nước kênh có thể nhiễm mặn mùa khô (theo hồ sơ trang trại)."),
      status: "estimated",
      cells: CROP_YEAR_MONTHS.map((m, k) => {
        const crop = getCrop(result.monthlyCover[k]);
        const inSeason = [2, 3, 4, 5].includes(m);
        if (!inSeason || !crop) return { cropId: result.monthlyCover[k], level: 0, value: Lx(inSeason ? "no crop" : "—", inSeason ? "không có cây" : "—") };
        const base = farm.salinityRisk === "frequent" ? 2 : 1;
        const level = base + (crop.salinityTolerance === "sensitive" ? 1 : 0);
        return { cropId: crop.id, level: lv(level), value: Lx(crop.salinityTolerance === "sensitive" ? "sensitive crop" : "watch", crop.salinityTolerance === "sensitive" ? "cây nhạy mặn" : "cần theo dõi") };
      }),
    });
  }

  if (ext && ext.some((e) => e.frostDays >= 0.2)) {
    rows.push({
      id: "frost",
      name: Lx("Frost", "Sương giá"),
      help: Lx("Days with a minimum temperature at or below 0 °C.", "Số ngày nhiệt độ thấp nhất từ 0 °C trở xuống."),
      status: "observed",
      cells: CROP_YEAR_MONTHS.map((m, k) => {
        const f = ext[m - 1].frostDays;
        const crop = getCrop(result.monthlyCover[k]);
        return { cropId: result.monthlyCover[k], level: lv(!crop ? 0 : f < 0.5 ? 0 : f < 3 ? 2 : 3), value: Lx(`${f.toFixed(1)} days`, `${f.toFixed(1).replace(".", ",")} ngày`) };
      }),
    });
  }

  const totals = CROP_YEAR_MONTHS.map((_, k) => rows.filter((r) => r.id !== "cover").reduce((s, r) => s + r.cells[k].level, 0) + (cover.cells[k].level >= 2 ? 1 : 0));
  const order = CROP_YEAR_MONTHS.map((m, k) => ({ m, t: totals[k] })).sort((a, b) => b.t - a.t);
  return {
    rows,
    bareMonths: CROP_YEAR_MONTHS.filter((_, k) => !result.monthlyCover[k]),
    worstMonths: order.filter((o) => o.t >= 3).map((o) => o.m).slice(0, 3),
    totals,
  };
}

/* -------------------------------- evidence -------------------------------- */

export interface EvidenceItem {
  label: Localized;
  value: Localized;
  status: DataStatus;
  confidence: Confidence;
  source: Localized;
}
export interface Evidence {
  why: Localized[];
  evidence: EvidenceItem[];
  gaps: Localized[];
  askExpert: Localized[];
}

const MONTH_VI = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthsText = (ms: number[]) => Lx(ms.map((m) => MONTH_EN[m - 1]).join(", "), ms.map((m) => MONTH_VI[m - 1]).join(", "));

export function buildEvidence(input: {
  scenario: RotationScenario;
  result: SimulationResult;
  reference: SimulationResult;
  farm: FarmProfile;
  climate: ClimateDataset;
  extremes: DailyExtremes | null;
  ndvi: NdviSeries | null;
  calendar: VulnerabilityCalendar;
  hasEconomics: boolean;
}): Evidence {
  const { scenario, result: r, reference: ref, farm, climate, extremes, ndvi, calendar } = input;
  const soilMessage = (key: string, values?: Record<string, string | number>): Localized =>
    ({ en: translateMessage("en", key, values), vi: translateMessage("vi", key, values) });
  const why: Localized[] = [];
  const kind = scenario.kind;
  if (kind === "conventional") why.push(Lx("Compare the crops and planting dates with your current practice.", "So sánh cây và lịch gieo của phương án này với cách đang trồng."));
  if (kind === "fit") why.push(Lx("Built for climate fit: it keeps the main rice season and puts the best-fitting upland crop in the season with the highest irrigation need.", "Xây theo mức hợp khí hậu: giữ vụ lúa chính và đưa cây màu hợp nhất vào vụ cần tưới nhiều nhất."));
  if (kind === "water") why.push(Lx("Built to lower irrigation demand: the engine picked the upland crops that need the least water among those that fit this field.", "Tạo ra để giảm nước tưới: mô hình chọn cây màu cần ít nước nhất trong số cây hợp với ruộng này."));
  if (kind === "soil") why.push(Lx("Built to rest the soil: it adds legume seasons and a green-manure crop that suit this field's soil and seasons.", "Tạo ra để đất được nghỉ: thêm vụ cây họ đậu và cây phân xanh hợp với đất và mùa vụ của ruộng này."));
  if (kind === "custom") why.push(Lx("Your own rotation.", "Luân canh do anh/chị tự xây dựng."));
  r.seasons.forEach((s, i) => {
    const o = ref.seasons[i];
    if (!o || o.cropId === s.cropId) return;
    const d = Math.round(s.irrigation.median - o.irrigation.median);
    const from = shortName(o.cropId);
    const to = shortName(s.cropId);
    const season = SEASONS[s.season].name;
    why.push(
      Lx(
        `${season.en}: ${from.en} → ${to.en} (${d > 0 ? "+" : ""}${d} mm irrigation${getCrop(s.cropId)?.agronomicProperties.nFixing ? ", fixes nitrogen" : ""}).`,
        `${season.vi}: ${from.vi} → ${to.vi} (${d > 0 ? "+" : ""}${d} mm nước tưới${getCrop(s.cropId)?.agronomicProperties.nFixing ? ", cố định đạm" : ""}).`,
      ),
    );
  });
  if (r.pestBreak.cls !== "low") why.push(Lx(`Changes crop family ${r.pestBreak.breaks} times in 3 years, which interrupts pest and disease cycles.`, `Đổi họ cây ${r.pestBreak.breaks} lần trong 3 năm, giúp cắt vòng đời sâu bệnh.`));

  const climObs = climate.status !== "illustrative";
  const usableNdvi = ndvi?.points.filter((p) => p.ndvi !== null).length ?? 0;
  const evidence: EvidenceItem[] = [
    {
      label: Lx("Climate record", "Chuỗi khí hậu"),
      value: Lx(`${climate.period[0]}–${climate.period[1]}, monthly`, `${climate.period[0]}–${climate.period[1]}, theo tháng`),
      status: climate.status,
      confidence: climObs ? "medium" : "low",
      source: Lx(`${climate.source} · ${climate.resolution}`, `${climate.source} · ${climate.resolution}`),
    },
    {
      label: Lx("Irrigation need", "Nhu cầu tưới"),
      value: Lx(`${Math.round(r.waterDemand.median)} mm/yr (${Math.round(r.waterDemand.p10)}–${Math.round(r.waterDemand.p90)})`, `${Math.round(r.waterDemand.median)} mm/năm (${Math.round(r.waterDemand.p10)}–${Math.round(r.waterDemand.p90)})`),
      status: r.dataStatus.waterDemand,
      confidence: r.uncertainty.waterDemand,
      source: Lx("FAO-56 Penman–Monteith + crop coefficients, every historical year", "FAO-56 Penman–Monteith + hệ số cây, tính cho từng năm lịch sử"),
    },
    {
      label: Lx("Heavy rain & heat days", "Ngày mưa lớn, ngày nắng nóng"),
      value: extremes ? Lx(`${extremes.period[0]}–${extremes.period[1]}, daily`, `${extremes.period[0]}–${extremes.period[1]}, theo ngày`) : Lx("not loaded", "chưa tải được"),
      status: extremes?.status ?? "unavailable",
      confidence: extremes ? "medium" : "low",
      source: Lx("NASA POWER daily", "NASA POWER theo ngày"),
    },
    {
      label: Lx("Observed greenness (NDVI)", "Độ xanh thực tế (NDVI)"),
      value: ndvi && usableNdvi ? Lx(`${usableNdvi} usable composites since ${ndvi.points[0]?.date}`, `${usableNdvi} kỳ ảnh dùng được từ ${ndvi.points[0]?.date}`) : Lx("no usable composites", "chưa có kỳ ảnh dùng được"),
      status: usableNdvi ? "observed" : "unavailable",
      confidence: usableNdvi ? "medium" : "low",
      source: Lx("NASA MODIS MOD13Q1, 250 m pixel", "NASA MODIS MOD13Q1, điểm ảnh 250 m"),
    },
    {
      label: Lx("Soil", "Đất"),
      value: Lx(farm.soilSources.soilType.source, farm.soilSources.soilType.source),
      status: farm.soilSources.soilType.status,
      confidence: farm.soilSources.soilType.status === "observed" ? "medium" : "low",
      source: Lx("Farm profile", "Hồ sơ trang trại"),
    },
    {
      label: soilMessage("rothc.title"),
      value: r.soilImprovementPotential ? Lx(`${r.soilImprovementPotential.socTCHa.toFixed(2)} t C/ha`, `${r.soilImprovementPotential.socTCHa.toFixed(2)} t C/ha`) : soilMessage(r.metricSources.soilImprovementPotential),
      status: r.dataStatus.soilImprovementPotential,
      confidence: "low",
      source: soilMessage("rothc.evidenceSource"),
    },
  ];

  const gaps: Localized[] = [];
  if (r.soilCarbonInputs) gaps.push(soilMessage("rothc.inputGap", {
    equilibrium: r.soilCarbonInputs.equilibriumPlantC.toFixed(2), residues: r.soilCarbonInputs.referencePlantC.toFixed(2),
    ratio: (r.soilCarbonInputs.inputRatio * 100).toFixed(1),
  }));
  else gaps.push(soilMessage(r.metricSources.soilImprovementPotential));
  gaps.push(soilMessage("rothc.limit"));
  if (farm.soilSources.soilPH.status !== "observed") gaps.push(Lx("No soil test for pH: crop fit on acidic soil is uncertain.", "Chưa có xét nghiệm pH đất: mức hợp của cây trên đất chua chưa chắc chắn."));
  if (farm.soilSources.soilType.status !== "observed") gaps.push(Lx("Soil texture is an estimate, not a field description.", "Loại đất là ước tính, chưa phải mô tả thực tế của ruộng."));
  if (!usableNdvi) gaps.push(Lx("No satellite greenness record for this field yet.", "Chưa có chuỗi độ xanh vệ tinh cho ruộng này."));
  if (!extremes) gaps.push(Lx("Daily extremes (heavy rain, heat) could not be loaded.", "Chưa tải được số liệu cực đoan theo ngày (mưa lớn, nắng nóng)."));
  if (!input.hasEconomics) gaps.push(Lx("No local yields, prices or costs: income is not compared.", "Chưa có năng suất, giá, chi phí địa phương: chưa so được thu nhập."));
  gaps.push(Lx("Water supply per season is an assumption, not canal or pump data.", "Lượng nước cấp mỗi vụ là giả định, chưa phải số liệu kênh hay trạm bơm."));
  gaps.push(Lx("Field slope is unknown (no elevation data yet); erosion uses rain on bare soil only.", "Chưa biết độ dốc ruộng (chưa có dữ liệu độ cao); xói mòn chỉ tính theo mưa trên đất trống."));
  gaps.push(Lx("Crop durations are typical values, not the varieties you plant.", "Thời gian sinh trưởng là giá trị điển hình, chưa theo giống anh/chị trồng."));

  const ask: Localized[] = [];
  ask.push(soilMessage("rothc.gapAction"));
  const newCrops = [...new Set(r.seasons.map((s) => s.cropId).filter((c): c is string => !!c && c !== "fallow" && !Object.values(farm.cropHistory.typicalPattern).includes(c)))];
  newCrops.forEach((id) => {
    const c = getCrop(id)!;
    if (farm.soilPH !== null && farm.soilPH < c.phRange.min)
      ask.push(Lx(`Can ${c.name.en.toLowerCase()} grow on this acidic soil (pH ${farm.soilPH})? Is liming or raised beds needed?`, `${c.name.vi} có trồng được trên đất chua pH ${String(farm.soilPH).replace(".", ",")} không? Có cần bón vôi hay lên liếp?`));
    if (c.category !== "green_manure") ask.push(Lx(`Who buys ${c.name.en.toLowerCase()} locally, and at what price?`, `Ở địa phương ai thu mua ${c.name.vi.toLowerCase()}, giá bao nhiêu?`));
    if (c.category === "green_manure") ask.push(Lx("Where to get Sesbania seed, and how much labour to cut and incorporate it?", "Mua giống điền thanh ở đâu, công cắt và vùi tốn bao nhiêu?"));
  });
  if (calendar.rows.find((x) => x.id === "rain")?.cells.some((c) => c.level >= 3 && getCrop(c.cropId)?.waterloggingTolerance === "low"))
    ask.push(Lx("Does the field drain fast enough in the wettest months? Are drainage furrows or raised beds needed?", "Ruộng có thoát nước kịp trong tháng mưa nhiều không? Có cần làm rãnh hay lên liếp?"));
  if (farm.salinityRisk !== "none") ask.push(Lx("What is this year's salinity forecast and sluice-gate schedule for the dry season?", "Dự báo xâm nhập mặn và lịch đóng mở cống mùa khô năm nay thế nào?"));
  const stressed = r.seasons.filter((s) => s.stressLevel >= 2);
  stressed.forEach((s) => ask.push(Lx(`How much water can the pump station or cooperative supply for the ${SEASONS[s.season].name.en} season?`, `Trạm bơm hoặc hợp tác xã cấp được bao nhiêu nước cho vụ ${SEASONS[s.season].name.vi}?`)));
  if (r.seasons.some((s) => s.overlap)) ask.push(Lx("Which short-duration varieties would fit this calendar?", "Giống ngắn ngày nào giúp kịp lịch thời vụ này?"));
  if (calendar.bareMonths.length >= 2) ask.push(Lx(`Can a cover crop or straw mulch protect the soil in ${monthsText(calendar.bareMonths).en}?`, `Có thể gieo cây che phủ hoặc phủ rơm để giữ đất trong ${monthsText(calendar.bareMonths).vi} không?`));
  ask.push(Lx("Does this match your family's and neighbours' experience on similar fields?", "Kết quả này có khớp kinh nghiệm của gia đình và hàng xóm trên ruộng tương tự không?"));

  return { why, evidence, gaps, askExpert: ask };
}
