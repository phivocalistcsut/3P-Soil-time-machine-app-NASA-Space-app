import type { Crop, SeasonId } from "@/lib/types";

const IPCC_RESIDUES = "IPCC 2019 Refinement Vol.4 Ch.11 Table 11.1a, Eqs.11.6–11.7: https://www.ipcc-nggip.iges.or.jp/public/2019rf/pdf/4_Volume4/19R_V4_Ch11_Soils_N2O_CO2.pdf";
const CANTHO_YIELDS = "Can Tho Statistics Office, 2024 annual report, table 4 (2024 estimates; tạ/ha ÷ 10 -> t/ha): https://thongkecantho.gso.gov.vn/uploads/files/2025_01_cantho_so%20lieu%20ktxh%20nam%202024_02_1_2025.pdf";
const CROP_CARBON = "IPCC GPG 2000 Ch.4 Table 4.16 (residue C fraction, also used as a root-C proxy): https://www.ipcc-nggip.iges.or.jp/public/gp/english/4_Agriculture.pdf";
const HERBACEOUS_CARBON = "Generic herbaceous C fraction 0.47 transferred to crop residues/roots, IPCC 2006 Vol.4 Ch.6 §6.2.1.4: https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/4_Volume4/V4_06_Ch6_Grassland.pdf";
const DPM_RPM_SOURCE = "DPM/RPM=1.44, agricultural-crop default (including annual green manure, not woody vegetation), Coleman, Prout & Milne (Feb 2024), RothC Model Description §1.3: https://www.rothamsted.ac.uk/sites/default/files/Documents/RothC_description.pdf";

/** Seasonal carbon input, not a yield prediction or a RothC turnover calculation.
 * IPCC RAG is residue / dry harvested yield; RS is root / total shoot biomass.
 * For tubers, Table 11.1a note f defines RS against shoots, excluding harvested tubers.
 * Non-rice residues are retained: IPCC Ch.11 p.11.16 default of no removal when unknown.
 */
function residueEstimate(yieldT: number, dry: number, rag: number, rs: number, cf: number, source: string, retained = 1, tuber = false): Crop["rothc"] {
  const productDM = yieldT * dry;
  const residueDM = productDM * rag;
  const rootDM = (tuber ? residueDM : productDM + residueDM) * rs;
  return {
    residueCTHa: (residueDM * retained + rootDM) * cf,
    dpmRpm: 1.44,
    status: "estimated",
    source: `Estimated; Y=${yieldT} t/ha/crop, DRY=${dry}, RAG=${rag}, RS=${rs}, CF=${cf}, retained above-ground residue fraction=${retained}; roots=${tuber ? "residueDM" : "(productDM+residueDM)"}*RS. ${source}. ${IPCC_RESIDUES}. ${DPM_RPM_SOURCE}`,
  };
}

/**
 * Reusable crop catalog. Crop coefficients follow FAO Irrigation & Drainage Paper 56
 * (Allen et al., 1998, Table 12) unless marked "estimated". Temperature, pH, soil and
 * nitrogen values are typical agronomic ranges used for transparent rule-based screening —
 * they are not variety-specific and should be replaced with local extension guidance.
 */
export const CROPS: Crop[] = [
  {
    id: "rice",
    // TODO(source): validate the transferred 5.6% stubble fraction for Mekong harvest heights.
    rothc: residueEstimate((545891 + 415169 + 377976) / 212614, 0.89, 1.4, 0.16, 0.4144,
      `${CANTHO_YIELDS}; annual rice production / harvested area. ${CROP_CARBON}. Only roots + stubble; harvested straw removed/burned (Hong Van et al. 2015, not 2014, DOI:10.1080/00380768.2015.1041862). Stubble fraction 0.056 transferred from Hu et al. (2018), Eq.5, China: https://doi.org/10.1080/17583004.2018.1526625; no ash/char carbon credited`, 0.056),
    name: { en: "Rice (paddy)", vi: "Lúa" },
    category: "cereal",
    family: "Poaceae",
    icon: "wheat",
    color: "#B57B38",
    growingDuration: 100,
    suitableSeasons: ["S1", "S2", "S3"],
    waterRequirement: "very_high",
    kc: { ini: 1.05, mid: 1.2, end: 0.9 },
    kcSource: "FAO-56 Table 12",
    flooded: true,
    irrigated: true,
    temperatureRange: { min: 18, optMin: 24, optMax: 32, max: 36 },
    heatStressTmax: 35,
    phRange: { min: 4.5, max: 7.5 },
    soilCompatibility: { clay: 1, silty_clay: 1, clay_loam: 0.95, loam: 0.85, sandy_loam: 0.55, sand: 0.3 },
    waterloggingTolerance: "high",
    salinityTolerance: "moderate",
    nitrogenNeed: 90,
    nitrogenCredit: 0,
    agronomicProperties: {
      nFixing: false,
      rootDepthM: 0.3,
      residueReturn: "medium",
      note: {
        en: "Flooded crop: needs ponding water, land preparation and percolation losses.",
        vi: "Cây ngập nước: cần giữ nước mặt ruộng, làm đất và bù thất thoát do thấm.",
      },
    },
  },
  {
    id: "maize",
    rothc: residueEstimate(5.831, 0.87, 1, 0.22, 0.4709, `${CANTHO_YIELDS}. ${CROP_CARBON}. All stover retained, IPCC no-removal default`),
    name: { en: "Maize", vi: "Bắp (ngô)" },
    category: "cereal",
    family: "Poaceae",
    icon: "wheat",
    color: "#D9A441",
    growingDuration: 100,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "moderate",
    kc: { ini: 0.3, mid: 1.2, end: 0.6 },
    kcSource: "FAO-56 Table 12",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 15, optMin: 20, optMax: 32, max: 38 },
    heatStressTmax: 35,
    phRange: { min: 5.5, max: 7.8 },
    soilCompatibility: { clay: 0.6, silty_clay: 0.7, clay_loam: 0.85, loam: 1, sandy_loam: 0.9, sand: 0.5 },
    waterloggingTolerance: "low",
    salinityTolerance: "moderate",
    nitrogenNeed: 150,
    nitrogenCredit: 0,
    agronomicProperties: {
      nFixing: false,
      rootDepthM: 1.0,
      residueReturn: "high",
      note: {
        en: "Upland break crop: dry soil phase interrupts continuous flooding; deep roots.",
        vi: "Cây màu cạn: tạo giai đoạn đất khô, cắt chuỗi ngập liên tục; rễ ăn sâu.",
      },
    },
  },
  {
    id: "mungbean",
    rothc: residueEstimate(1.38, 0.91, 2.1, 0.19, 0.47,
      `Yield: mean of five varieties, Cho Moi, An Giang, Xuan He 2004, Table 6: https://sj.ctu.edu.vn/ql/docgia/download/baibao-4853/fn_19_lvdung.pdf; IPCC Beans and Pulses defaults. ${HERBACEOUS_CARBON}. All haulms retained, IPCC no-removal default`),
    name: { en: "Mung bean", vi: "Đậu xanh" },
    category: "legume",
    family: "Fabaceae",
    icon: "bean",
    color: "#5E9E62",
    growingDuration: 70,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "low",
    kc: { ini: 0.4, mid: 1.05, end: 0.35 },
    kcSource: "FAO-56 Table 12 (dry beans, approximated)",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 18, optMin: 25, optMax: 34, max: 38 },
    heatStressTmax: 37,
    phRange: { min: 5.5, max: 7.5 },
    soilCompatibility: { clay: 0.6, silty_clay: 0.7, clay_loam: 0.85, loam: 1, sandy_loam: 1, sand: 0.6 },
    waterloggingTolerance: "low",
    salinityTolerance: "sensitive",
    nitrogenNeed: 20,
    nitrogenCredit: 25,
    agronomicProperties: {
      nFixing: true,
      rootDepthM: 0.6,
      residueReturn: "medium",
      note: {
        en: "Legume: biological N fixation and soil cover between rice crops.",
        vi: "Cây họ đậu: cố định đạm sinh học và che phủ đất giữa các vụ lúa.",
      },
    },
  },
  {
    id: "soybean",
    rothc: residueEstimate(2.012, 0.91, 2.1, 0.19, 0.47, `${CANTHO_YIELDS}; Soybeans defaults. ${HERBACEOUS_CARBON}. All haulms retained, IPCC no-removal default`),
    name: { en: "Soybean", vi: "Đậu nành" },
    category: "legume",
    family: "Fabaceae",
    icon: "bean",
    color: "#7FA35B",
    growingDuration: 90,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "moderate",
    kc: { ini: 0.4, mid: 1.15, end: 0.5 },
    kcSource: "FAO-56 Table 12",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 15, optMin: 20, optMax: 32, max: 36 },
    heatStressTmax: 35,
    phRange: { min: 5.8, max: 7.5 },
    soilCompatibility: { clay: 0.65, silty_clay: 0.75, clay_loam: 0.9, loam: 1, sandy_loam: 0.85, sand: 0.5 },
    waterloggingTolerance: "moderate",
    salinityTolerance: "moderate",
    nitrogenNeed: 30,
    nitrogenCredit: 25,
    agronomicProperties: {
      nFixing: true,
      rootDepthM: 0.8,
      residueReturn: "medium",
      note: {
        en: "Legume: fixes nitrogen; more tolerant of short wet spells than mung bean.",
        vi: "Cây họ đậu: cố định đạm; chịu ẩm ngắn ngày tốt hơn đậu xanh.",
      },
    },
  },
  {
    id: "peanut",
    // TODO(source): replace the IPCC generic RS with a local peanut root measurement.
    rothc: residueEstimate(1.763, 0.94, 1, 0.22, 0.47,
      `${CANTHO_YIELDS}; Peanuts DRY and RAG; RS is unavailable in that row, so use generic-crops RS=0.22 per Table 11.1a note e. ${HERBACEOUS_CARBON}. All haulms retained; harvested pods excluded; IPCC no-removal default`),
    name: { en: "Peanut", vi: "Đậu phộng (lạc)" },
    category: "legume",
    family: "Fabaceae",
    icon: "bean",
    color: "#A88A57",
    growingDuration: 100,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "moderate",
    kc: { ini: 0.4, mid: 1.15, end: 0.6 },
    kcSource: "FAO-56 Table 12",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 18, optMin: 22, optMax: 32, max: 37 },
    heatStressTmax: 36,
    phRange: { min: 5.5, max: 7.2 },
    soilCompatibility: { clay: 0.35, silty_clay: 0.45, clay_loam: 0.65, loam: 0.85, sandy_loam: 1, sand: 0.8 },
    waterloggingTolerance: "low",
    salinityTolerance: "moderate",
    nitrogenNeed: 20,
    nitrogenCredit: 20,
    agronomicProperties: {
      nFixing: true,
      rootDepthM: 0.6,
      residueReturn: "medium",
      note: {
        en: "Legume best on light, well-drained soils; pods struggle in heavy clay.",
        vi: "Cây họ đậu hợp đất nhẹ, thoát nước tốt; khó tạo củ trên đất sét nặng.",
      },
    },
  },
  {
    id: "sesame",
    // TODO(source): replace generic crop residue/root/DRY factors with local sesame measurements.
    rothc: residueEstimate(1, 0.85, 1, 0.22, 0.47,
      `Yield: DH1 control, 10 ta/ha, Bui Quang Dinh et al. (2018), Vietnam J. Agricultural Science and Technology 8(93), Mekong Delta field trials: https://tapchi.vaas.vn/sites/tapchi.vaas.vn/files/tapchi/2021-08/tc20-2018_1.pdf; IPCC generic-crops row (sesame not listed). ${HERBACEOUS_CARBON}. All stalks retained, IPCC no-removal default`),
    name: { en: "Sesame", vi: "Mè (vừng)" },
    category: "oilseed",
    family: "Pedaliaceae",
    icon: "flower",
    color: "#C9A86A",
    growingDuration: 85,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "low",
    kc: { ini: 0.35, mid: 1.1, end: 0.25 },
    kcSource: "FAO-56 Table 12",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 20, optMin: 25, optMax: 35, max: 40 },
    heatStressTmax: 38,
    phRange: { min: 5.5, max: 8.0 },
    soilCompatibility: { clay: 0.55, silty_clay: 0.65, clay_loam: 0.85, loam: 1, sandy_loam: 1, sand: 0.7 },
    waterloggingTolerance: "low",
    salinityTolerance: "sensitive",
    nitrogenNeed: 60,
    nitrogenCredit: 0,
    agronomicProperties: {
      nFixing: false,
      rootDepthM: 0.9,
      residueReturn: "low",
      note: {
        en: "Drought-hardy dry-season crop; very sensitive to waterlogging.",
        vi: "Chịu hạn tốt cho mùa khô; rất nhạy cảm với ngập úng.",
      },
    },
  },
  {
    id: "sweetpotato",
    rothc: residueEstimate(12.491, 0.22, 0.4, 0.20, 0.4226,
      `${CANTHO_YIELDS}; Potatoes and Tubers defaults, note f: non-tuber roots only. ${CROP_CARBON}; potato CF transferred to sweet potato. Vines retained, marketable tubers exported, unmarketable tubers not credited`, 1, true),
    name: { en: "Sweet potato", vi: "Khoai lang" },
    category: "root",
    family: "Convolvulaceae",
    icon: "carrot",
    color: "#B5657A",
    growingDuration: 110,
    suitableSeasons: ["S1", "S2"],
    waterRequirement: "moderate",
    kc: { ini: 0.5, mid: 1.15, end: 0.65 },
    kcSource: "FAO-56 Table 12",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 15, optMin: 21, optMax: 30, max: 35 },
    heatStressTmax: 35,
    phRange: { min: 5.0, max: 7.0 },
    soilCompatibility: { clay: 0.4, silty_clay: 0.5, clay_loam: 0.7, loam: 0.9, sandy_loam: 1, sand: 0.75 },
    waterloggingTolerance: "low",
    salinityTolerance: "moderate",
    nitrogenNeed: 70,
    nitrogenCredit: 0,
    agronomicProperties: {
      nFixing: false,
      rootDepthM: 0.9,
      residueReturn: "medium",
      note: {
        en: "Root crop with dense ground cover; prefers raised beds on clay soils.",
        vi: "Cây lấy củ, che phủ đất tốt; nên lên luống cao trên đất sét.",
      },
    },
  },
  {
    id: "sesbania",
    // TODO(source): local Sesbania biomass and roots at the catalog's 55-day incorporation age.
    rothc: {
      residueCTHa: 4.6 * (1 + 0.22) * 0.47,
      dpmRpm: 1.44,
      status: "estimated",
      source: `Estimated; entire green-manure crop incorporated. 4.6 t shoot DM/ha at 60 days, Beri, Meelu & Khind (1989), Tropical Agriculture 66(3), India: https://journals.sta.uwi.edu/ojs/index.php/ta/article/view/1864; transferred to this 55-day crop without an unsupported age correction. Roots=shootDM*0.22 (generic annual-crops RS, ${IPCC_RESIDUES}); C=(4.6+4.6*0.22)*0.47. ${HERBACEOUS_CARBON}. ${DPM_RPM_SOURCE}`,
    },
    name: { en: "Sesbania (green manure)", vi: "Điền thanh (phân xanh)" },
    category: "green_manure",
    family: "Fabaceae",
    icon: "sprout",
    color: "#3F8F5A",
    growingDuration: 55,
    suitableSeasons: ["S2", "S3"],
    waterRequirement: "low",
    kc: { ini: 0.5, mid: 1.05, end: 1.0 },
    kcSource: "Estimated — not listed in FAO-56",
    flooded: false,
    irrigated: true,
    temperatureRange: { min: 18, optMin: 22, optMax: 35, max: 40 },
    heatStressTmax: 40,
    phRange: { min: 4.5, max: 8.5 },
    soilCompatibility: { clay: 1, silty_clay: 1, clay_loam: 1, loam: 1, sandy_loam: 0.9, sand: 0.7 },
    waterloggingTolerance: "high",
    salinityTolerance: "moderate",
    nitrogenNeed: 0,
    nitrogenCredit: 50,
    agronomicProperties: {
      nFixing: true,
      rootDepthM: 1.2,
      residueReturn: "high",
      note: {
        en: "Flood-tolerant legume grown to be incorporated as green manure (organic matter + N).",
        vi: "Cây họ đậu chịu ngập, trồng để vùi làm phân xanh (bổ sung chất hữu cơ và đạm).",
      },
    },
  },
  {
    id: "fallow",
    rothc: {
      residueCTHa: 0, dpmRpm: 1.44, status: "estimated",
      source: `Estimated management definition: bare fallow, no crop residue input (0 t C/ha/crop); spontaneous weeds are not modeled. RothC Model Description §2.1 sets plant input to zero in bare cultivated fallow. ${DPM_RPM_SOURCE}; ratio unused when input is zero`,
    },
    name: { en: "Fallow (rest)", vi: "Để đất nghỉ" },
    category: "fallow",
    family: "—",
    icon: "pause",
    color: "#A3ADA8",
    growingDuration: 60,
    suitableSeasons: ["S1", "S2", "S3"],
    waterRequirement: "none",
    kc: { ini: 0, mid: 0, end: 0 },
    kcSource: "Not irrigated",
    flooded: false,
    irrigated: false,
    temperatureRange: { min: -50, optMin: -50, optMax: 60, max: 60 },
    heatStressTmax: 60,
    phRange: { min: 0, max: 14 },
    soilCompatibility: { clay: 1, silty_clay: 1, clay_loam: 1, loam: 1, sandy_loam: 1, sand: 1 },
    waterloggingTolerance: "high",
    salinityTolerance: "tolerant",
    nitrogenNeed: 0,
    nitrogenCredit: 0,
    agronomicProperties: {
      nFixing: false,
      rootDepthM: 0,
      residueReturn: "low",
      note: {
        en: "No crop: no irrigation, no income; breaks pest cycles.",
        vi: "Không trồng: không cần tưới, không có thu nhập; cắt vòng đời sâu bệnh.",
      },
    },
  },
];

export const CROP_MAP: Record<string, Crop> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

export function getCrop(id: string | null | undefined): Crop | null {
  if (!id) return null;
  return CROP_MAP[id] ?? null;
}

/** Mekong Delta cropping calendar used as the seasonal frame. */
export const SEASONS: Record<
  SeasonId,
  { name: { en: string; vi: string }; short: { en: string; vi: string }; defaultMonth: number; months: number[] }
> = {
  S1: { name: { en: "Winter–Spring", vi: "Đông Xuân" }, short: { en: "W–S", vi: "ĐX" }, defaultMonth: 12, months: [11, 12, 1] },
  S2: { name: { en: "Summer–Autumn", vi: "Hè Thu" }, short: { en: "S–A", vi: "HT" }, defaultMonth: 4, months: [3, 4, 5] },
  S3: { name: { en: "Autumn–Winter", vi: "Thu Đông" }, short: { en: "A–W", vi: "TĐ" }, defaultMonth: 8, months: [7, 8, 9] },
};

export const SEASON_ORDER: SeasonId[] = ["S1", "S2", "S3"];
