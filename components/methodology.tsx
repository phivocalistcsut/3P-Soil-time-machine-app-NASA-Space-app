"use client";

import { BookOpen, Calculator, CalendarClock, Database, FlaskConical, Satellite, CircleSlash, Scale } from "lucide-react";
import { PageHeader } from "@/components/ui/sections";
import { BARE_SOIL_THRESHOLDS, PEST_BREAK_THRESHOLDS } from "@/lib/engine/simulate";
import { DAILY_THRESHOLDS } from "@/lib/services/power-daily";
import { useI18n } from "@/lib/i18n";
import { CROPS } from "@/lib/data/crops";
import { IMERG_SOURCE, SMAP_SOURCE } from "@/lib/data/evidence";
import { OVERLAYS } from "@/lib/data/layers";
import { CLIMATE_ASSUMPTIONS, CUSTOM_CLIMATE_LIMITS, type PresetClimate } from "@/lib/engine/climate";
import { LAND_PREP_MM, PERCOLATION_MM_DAY, SUPPLY_MM, ENGINE_VERSION, SOIL_LEVEL_THRESHOLDS, REF_IRRIGATION_MM, REF_NITROGEN } from "@/lib/engine/simulate";
import { CropIcon, StatusBadge } from "@/components/common";
import { Card, CardHeader } from "@/components/ui/primitives";
import type { DataStatus, SoilTexture } from "@/lib/types";

export function Methodology() {
  const { L, t, crop, lang } = useI18n();

  const sources: { name: string; provider: string; vars: string; res: string; use: string; limit: string; status: DataStatus; link: string }[] = [
    {
      name: "NASA POWER",
      provider: "NASA Langley Research Center",
      vars: L("Precipitation (corrected), 2 m temperature & diurnal range, humidity, wind, all-sky solar radiation, surface & root-zone soil wetness — monthly", "Mưa (hiệu chỉnh), nhiệt độ 2 m & biên độ ngày, độ ẩm, gió, bức xạ mặt trời, độ ẩm đất bề mặt & vùng rễ — theo tháng"),
      res: "MERRA-2 0.5° × 0.625° · CERES 1°",
      use: L("Primary climate input; live via /api/climate, cached snapshot for the demo location", "Đầu vào khí hậu chính; trực tuyến qua /api/climate, có bản lưu cho vị trí demo"),
      limit: L("Reanalysis/satellite blend; one value for a ~55 km cell; coastal delta pixels can be biased", "Kết hợp tái phân tích/vệ tinh; một giá trị cho ô ~55 km; điểm ven biển có thể sai lệch"),
      status: "estimated",
      link: "https://power.larc.nasa.gov/",
    },
    {
      name: "NASA POWER daily",
      provider: "NASA Langley Research Center",
      vars: L("Daily rainfall, maximum and minimum temperature → counts of heavy-rain, hot and frost days", "Mưa, nhiệt độ cao nhất và thấp nhất theo ngày → đếm số ngày mưa lớn, nắng nóng, sương giá"),
      res: "≈0.5° × 0.625°",
      use: L("Extreme-days charts, 12-month risk calendar, bare-soil index (/api/climate-daily)", "Biểu đồ ngày cực đoan, lịch rủi ro 12 tháng, chỉ số đất trống (/api/climate-daily)"),
      limit: L("Reanalysis can run warmer than local stations and smooths local downpours", "Số liệu tái phân tích có thể nóng hơn trạm đo và làm mượt các trận mưa cục bộ"),
      status: "estimated",
      link: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
    },
    {
      name: "NASA MODIS MOD13Q1.061 NDVI",
      provider: "NASA LP DAAC · served by ORNL DAAC",
      vars: L("Vegetation greenness (NDVI), 16-day composites with quality flags", "Độ xanh thực vật (NDVI), ảnh tổng hợp 16 ngày"),
      res: "250 m",
      use: L("Greenness-from-space chart; evidence card (/api/ndvi)", "Biểu đồ độ xanh từ vệ tinh; thẻ bằng chứng (/api/ndvi)"),
      limit: L("Pixel mixes neighbouring fields, canals and houses; clouds can lower values", "Điểm ảnh lẫn ruộng bên cạnh, kênh, nhà; mây có thể làm giá trị thấp đi"),
      status: "observed",
      link: "https://modis.ornl.gov/data/modis_webservice.html",
    },
    {
      name: "NASA GPM IMERG", provider: "NASA GPM via NASA POWER",
      vars: L("Daily UTC rainfall summed to monthly totals", "Mưa ngày UTC cộng theo tháng"),
      res: "0.1° × 0.1°", use: L("Model rainfall when coverage is complete", "Mưa đầu vào mô hình khi đủ dữ liệu"),
      limit: L("Regional satellite precipitation estimate. The API omits the run/version.", "Ước tính mưa vùng từ vệ tinh. API chưa cung cấp phiên bản."),
      status: "observed", link: IMERG_SOURCE,
    },
    {
      name: "NASA SMAP Level 4", provider: "NASA SMAP / NSIDC via NASA POWER",
      vars: L("Monthly surface and root-zone volumetric soil moisture", "Độ ẩm thể tích mặt đất và vùng rễ theo tháng"),
      res: "~9 km", use: L("Soil moisture chart and seasonal drainage warning", "Biểu đồ ẩm đất và cảnh báo thoát nước theo mùa"),
      limit: L("Satellite-assimilated land model. Local drainage and irrigation can differ.", "Mô hình đất kết hợp vệ tinh. Điều kiện thoát nước và tưới tại ruộng có thể khác."),
      status: "estimated", link: SMAP_SOURCE,
    },
    ...OVERLAYS.map((o) => ({
      name: o.name[lang],
      provider: "NASA GIBS",
      vars: o.product,
      res: o.resolution[lang],
      use: L("Map layer only (visual context, date-stamped)", "Chỉ dùng làm lớp bản đồ (bối cảnh trực quan, có ghi ngày)"),
      limit: o.desc[lang],
      status: o.status,
      link: "https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api",
    })),
    {
      name: "NASA ECOSTRESS",
      provider: "NASA JPL",
      vars: L("Land-surface temperature and evapotranspiration at ~70 m", "Nhiệt độ bề mặt và bốc thoát hơi ở ~70 m"),
      res: "≈70 m",
      use: L("Not yet integrated — planned field-scale ET validation (requires Earthdata login / AppEEARS)", "Chưa tích hợp — dự kiến dùng kiểm chứng ET quy mô ruộng (cần tài khoản Earthdata / AppEEARS)"),
      limit: L("Irregular overpass times; cloud gaps", "Thời điểm bay qua không đều; khoảng trống do mây"),
      status: "unavailable",
      link: "https://ecostress.jpl.nasa.gov/",
    },
    {
      name: "ISRIC SoilGrids v2.0",
      provider: L("ISRIC — World Soil Information (non-NASA)", "ISRIC — Thông tin Đất Thế giới (không thuộc NASA)"),
      vars: L("SOC, clay and bulk density at 0–5, 5–15 and 15–30 cm; pH and sand at 0–5 cm", "SOC, sét và dung trọng ở 0–5, 5–15 và 15–30 cm; pH và cát ở 0–5 cm"),
      res: "250 m",
      use: L("Optional regional soil estimate, 0–30 cm SOC stock and depth-weighted clay (Estimated); missing depths remain unavailable", "Ước tính đất theo vùng, trữ lượng SOC và sét trung bình theo độ sâu 0–30 cm (Ước tính); thiếu lớp thì chưa có dữ liệu"),
      limit: L("Machine-learning map, not a field sample; service availability varies", "Bản đồ học máy, không phải mẫu thực địa; dịch vụ có lúc gián đoạn"),
      status: "estimated",
      link: "https://docs.isric.org/globaldata/soilgrids/wcs.html",
    },
    {
      name: "Sentinel-2 cloudless 2023 (EOX)",
      provider: "EOX IT Services · Copernicus",
      vars: L("Cloud-free true-colour mosaic", "Ảnh ghép màu thật không mây"),
      res: "10 m",
      use: L("Satellite basemap only — never animated or treated as future imagery", "Chỉ là bản đồ nền vệ tinh — không bao giờ tạo hiệu ứng hay coi là ảnh tương lai"),
      limit: L("Single-year composite; CC BY-NC-SA 4.0 (non-commercial)", "Ảnh tổng hợp một năm; giấy phép CC BY-NC-SA 4.0 (phi thương mại)"),
      status: "observed",
      link: "https://s2maps.eu/",
    },
    {
      name: L("Farmer inputs", "Thông tin của nông dân"),
      provider: L("You", "Bạn"),
      vars: L("Location, crop history, soil tests, water source, priorities, local prices", "Vị trí, lịch sử cây trồng, xét nghiệm đất, nguồn nước, ưu tiên, giá địa phương"),
      res: L("Field", "Thửa ruộng"),
      use: L("Shapes every scenario; stored only in this browser", "Định hình mọi kịch bản; chỉ lưu trong trình duyệt này"),
      limit: L("Quality depends on what is entered", "Chất lượng phụ thuộc vào thông tin nhập"),
      status: "observed",
      link: "",
    },
  ];

  const statuses: { s: DataStatus; icon: typeof Satellite }[] = [
    { s: "observed", icon: Satellite },
    { s: "estimated", icon: Calculator },
    { s: "illustrative", icon: FlaskConical },
    { s: "unavailable", icon: CircleSlash },
  ];

  const soilPointsRows = [
    [L("Flooded rice after another flooded rice", "Lúa ngập sau một vụ lúa ngập"), "−0.6"],
    [L("Three flooded seasons in one year (extra)", "Ba vụ ngập trong một năm (thêm)"), "−0.3"],
    [L("Legume grain crop (mung bean, soybean, peanut)", "Cây họ đậu lấy hạt (đậu xanh, đậu nành, đậu phộng)"), "+0.9 … +1.0"],
    [L("Green manure incorporated (Sesbania)", "Vùi phân xanh (điền thanh)"), "+2.0"],
    [L("Upland cereal break crop (maize)", "Cây ngũ cốc cạn cắt vụ (bắp)"), "+0.4"],
    [L("Sesame / sweet potato", "Mè / khoai lang"), "+0.3"],
    [L("Fallow", "Để đất nghỉ"), "+0.1"],
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        tone="teal"
        icon={BookOpen}
        eyebrow={L("Data sources & methods", "Nguồn dữ liệu & phương pháp")}
        title={L("Where every number comes from", "Mỗi con số đến từ đâu")}
        desc={L(
          `Every number is computed by an open, rule-based engine (v${ENGINE_VERSION}). Nothing here is a machine-learning prediction, and NASA data are never presented as farm-level soil-health measurements.`,
          `Mọi con số được tính bởi một mô hình quy tắc minh bạch (v${ENGINE_VERSION}). Không có dự báo học máy, và dữ liệu NASA không bao giờ được trình bày như số đo sức khỏe đất cấp ruộng.`,
        )}
      />

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Database className="h-4 w-4 text-forest" aria-hidden />
          {L("Data status labels", "Nhãn trạng thái dữ liệu")}
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {statuses.map(({ s }) => (
            <div key={s} className="rounded-xl border border-line p-3">
              <StatusBadge status={s} withTip={false} />
              <p className="mt-2 text-xs leading-relaxed text-ink-2">{t(`status.${s}.tip`)}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title={L("Data sources", "Nguồn dữ liệu")} icon={<Satellite className="h-4 w-4" aria-hidden />} />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[960px] text-xs">
            <thead>
              <tr className="text-left text-ink-2">
                {[L("Source", "Nguồn"), L("Variables", "Biến"), L("Resolution", "Độ phân giải"), L("How it is used", "Cách sử dụng"), L("Limitations", "Giới hạn"), L("Status", "Trạng thái")].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.name} className="border-t border-line align-top">
                  <td className="px-3 py-2.5">
                    {s.link ? (
                      <a href={s.link} target="_blank" rel="noreferrer" className="font-semibold text-forest hover:underline">
                        {s.name}
                      </a>
                    ) : (
                      <span className="font-semibold">{s.name}</span>
                    )}
                    <span className="block text-ink-3">{s.provider}</span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-2">{s.vars}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{s.res}</td>
                  <td className="px-3 py-2.5 text-ink-2">{s.use}</td>
                  <td className="px-3 py-2.5 text-ink-2">{s.limit}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={s.status} withTip={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Calculator className="h-4 w-4 text-forest" aria-hidden />
            {L("Engine steps", "Các bước tính toán")}
          </h2>
          <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ink-2">
            <li>
              <strong className="text-ink">{L("Climate preparation.", "Chuẩn bị khí hậu.")}</strong> {L("Ten years of monthly NASA POWER data are adjusted by the selected climate assumption.", "Mười năm số liệu tháng NASA POWER được điều chỉnh theo giả định khí hậu đã chọn.")}
            </li>
            <li>
              <strong className="text-ink">ET0.</strong> {t("asm.et0")} <code className="rounded bg-sand px-1 text-[11px]">ET0 = [0.408Δ(Rn−G) + γ·900/(T+273)·u₂·(es−ea)] / [Δ + γ(1+0.34u₂)]</code>
            </li>
            <li>
              <strong className="text-ink">{L("Crop water use.", "Lượng nước cây dùng.")}</strong> {L("ETc = Kc × ET0 with FAO-56 Kc curves (initial 20%, development 30%, mid 30%, late 20% of the season).", "ETc = Kc × ET0 với đường cong Kc FAO-56 (đầu vụ 20%, phát triển 30%, giữa vụ 30%, cuối vụ 20%).")}
            </li>
            <li>
              <strong className="text-ink">{L("Irrigation need.", "Nhu cầu tưới.")}</strong> {t("asm.peff")} {t("asm.flood")} {t("asm.noStorage")}
            </li>
            <li>
              <strong className="text-ink">{L("Uncertainty.", "Độ bất định.")}</strong> {L("Each season is run against every historical year; we report the median and the 10–90% range.", "Mỗi vụ được tính với từng năm lịch sử; báo cáo trung vị và khoảng 10–90%.")}
            </li>
            <li>
              <strong className="text-ink">{L("Water stress.", "Thiếu nước.")}</strong> {t("asm.supply")} {L("Ratio < 50% low · < 85% moderate · < 110% high · above that very high.", "Tỷ lệ < 50% thấp · < 85% vừa · < 110% cao · trên đó rất cao.")}
            </li>
            <li>
              <strong className="text-ink">{L("Climate suitability.", "Phù hợp khí hậu.")}</strong> {t("src.suitability")}
            </li>
            <li>
              <strong className="text-ink">{L("Rotation diversity.", "Đa dạng luân canh.")}</strong> {t("src.diversity")} H′ = −Σ pᵢ ln pᵢ.
            </li>
            <li>
              <strong className="text-ink">{L("Soil outlook.", "Triển vọng đất.")}</strong> {t("src.soil")} {t("asm.soilMemory")}
            </li>
          </ol>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold">{L("Climate assumptions", "Giả định khí hậu")}</h2>
            <p className="mt-1 text-xs text-ink-2">
              {L("Sensitivity tests applied equally to every month of the historical record. They are not NASA forecasts or IPCC projections.", "Kiểm tra độ nhạy áp đều cho mọi tháng của chuỗi lịch sử. Không phải dự báo của NASA hay kịch bản IPCC.")}
            </p>
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-ink-2">
                  <th className="py-1.5">{L("Assumption", "Giả định")}</th>
                  <th className="py-1.5">{L("Rainfall", "Mưa")}</th>
                  <th className="py-1.5">{L("Temperature", "Nhiệt độ")}</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(CLIMATE_ASSUMPTIONS) as PresetClimate[]).map((k) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-1.5 font-medium">{t(`clim.${k}`)}</td>
                    <td className="py-1.5 tabular">×{CLIMATE_ASSUMPTIONS[k].precipFactor}</td>
                    <td className="py-1.5 tabular">+{CLIMATE_ASSUMPTIONS[k].deltaT} °C</td>
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <td className="py-1.5 font-medium">{t("clim.custom")}</td>
                  <td className="py-1.5 tabular">
                    {CUSTOM_CLIMATE_LIMITS.rainPct.min}% … +{CUSTOM_CLIMATE_LIMITS.rainPct.max}%
                  </td>
                  <td className="py-1.5 tabular">
                    +{CUSTOM_CLIMATE_LIMITS.deltaT.min} … +{CUSTOM_CLIMATE_LIMITS.deltaT.max} °C
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">{L("Paddy water parameters", "Thông số nước ruộng lúa")}</h2>
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left text-ink-2">
                  <th className="py-1.5">{L("Soil texture", "Sa cấu")}</th>
                  <th className="py-1.5">{L("Percolation mm/day", "Thấm mm/ngày")}</th>
                  <th className="py-1.5">{L("Land prep mm", "Làm đất mm")}</th>
                </tr>
              </thead>
              <tbody>
                {(Object.keys(PERCOLATION_MM_DAY) as SoilTexture[]).map((k) => (
                  <tr key={k} className="border-t border-line">
                    <td className="py-1.5">{t(`tex.${k}`)}</td>
                    <td className="py-1.5 tabular">{PERCOLATION_MM_DAY[k]}</td>
                    <td className="py-1.5 tabular">{LAND_PREP_MM[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-ink-3">
              {L("Seasonal supply", "Nguồn nước mỗi vụ")}: {Object.entries(SUPPLY_MM).map(([k, v]) => `${t(`avail.${k}`)} ${v} mm`).join(" · ")}. {L("Poor drainage reduces percolation by 30%.", "Thoát nước kém giảm thấm 30%.")}
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">{L("Qualitative soil indicator", "Chỉ báo đất định tính")}</h2>
          <table className="mt-3 w-full text-xs">
            <tbody>
              {soilPointsRows.map(([a, b]) => (
                <tr key={a} className="border-t border-line">
                  <td className="py-1.5">{a}</td>
                  <td className="py-1.5 text-right font-semibold tabular">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-2">
            {L(
              `Yearly points are averaged over the three seasons and carried forward (index = 0.6 × last year + 0.4 × this year). Levels: ≤ ${SOIL_LEVEL_THRESHOLDS[0]} · ≤ ${SOIL_LEVEL_THRESHOLDS[1]} · ≤ ${SOIL_LEVEL_THRESHOLDS[2]} · ≤ ${SOIL_LEVEL_THRESHOLDS[3]} · above. The indicator shows direction, not magnitude, and has low confidence.`,
              `Điểm năm là trung bình ba vụ và được mang sang năm sau (chỉ số = 0,6 × năm trước + 0,4 × năm nay). Các mức: ≤ ${SOIL_LEVEL_THRESHOLDS[0]} · ≤ ${SOIL_LEVEL_THRESHOLDS[1]} · ≤ ${SOIL_LEVEL_THRESHOLDS[2]} · ≤ ${SOIL_LEVEL_THRESHOLDS[3]} · cao hơn. Chỉ báo thể hiện xu hướng, không phải độ lớn, và có độ tin cậy thấp.`,
            )}
          </p>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Scale className="h-4 w-4 text-forest" aria-hidden />
            {L("Multi-criteria score", "Điểm đa tiêu chí")}
          </h2>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-2">
            <li>• {t("crit.soil")}: 0.7 × {L("soil indicator", "chỉ báo đất")} + 0.3 × {L("diversity", "đa dạng")}</li>
            <li>• {t("crit.water")}: 100 × (1 − {L("irrigation", "tưới")} ÷ {REF_IRRIGATION_MM} mm)</li>
            <li>• {t("crit.drought")}: 100 − {L("mean stress level", "mức thiếu nước TB")} × 33 − 10 {L("if dry years exceed supply", "nếu năm khô vượt nguồn nước")}</li>
            <li>• {t("crit.income")}: {L("gross margin vs current practice, −8 per high-risk season; excluded without economic data", "lãi gộp so với hiện tại, −8 mỗi vụ rủi ro cao; bỏ qua nếu thiếu dữ liệu kinh tế")}</li>
            <li>• {t("crit.inputs")}: 100 × (1 − N ÷ {REF_NITROGEN} kg/ha)</li>
            <li>• {t("crit.climate")}: {L("mean suitability of the year's crops", "mức phù hợp trung bình của các vụ trong năm")}</li>
            <li className="pt-1">
              {L(
                "Overall = Σ(weight × score) ÷ Σ weights. Weights start from your ranking (1st = 5 … 5th = 1, climate fit = 3) and are editable. The top score is not a guaranteed or validated optimum.",
                "Tổng = Σ(trọng số × điểm) ÷ Σ trọng số. Trọng số bắt đầu từ thứ hạng của bạn (hạng 1 = 5 … hạng 5 = 1, phù hợp khí hậu = 3) và có thể chỉnh. Điểm cao nhất không phải tối ưu được bảo đảm hay kiểm chứng.",
              )}
            </li>
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title={L("Crop catalog", "Danh mục cây trồng")} icon={<BookOpen className="h-4 w-4" aria-hidden />} subtitle={L("Typical ranges for screening — replace with local extension guidance", "Ngưỡng điển hình để sàng lọc — nên thay bằng khuyến cáo địa phương")} />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[900px] text-xs">
            <thead>
              <tr className="text-left text-ink-2">
                {[L("Crop", "Cây"), L("Days", "Ngày"), "Kc ini/mid/end", L("Kc source", "Nguồn Kc"), L("Opt. temp °C", "Nhiệt độ tối ưu °C"), "pH", L("Waterlogging", "Chịu ngập"), L("Salinity", "Chịu mặn"), L("N kg/ha", "Đạm kg/ha"), L("N credit", "Đạm để lại")].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CROPS.filter((c) => c.id !== "fallow").map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <CropIcon cropId={c.id} size={22} />
                      {crop(c.id)}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular">{c.growingDuration}</td>
                  <td className="px-3 py-2 tabular">
                    {c.kc.ini} / {c.kc.mid} / {c.kc.end}
                  </td>
                  <td className="px-3 py-2 text-ink-2">{c.kcSource}</td>
                  <td className="px-3 py-2 tabular">
                    {c.temperatureRange.optMin}–{c.temperatureRange.optMax}
                  </td>
                  <td className="px-3 py-2 tabular">
                    {c.phRange.min}–{c.phRange.max}
                  </td>
                  <td className="px-3 py-2">{c.waterloggingTolerance}</td>
                  <td className="px-3 py-2">{c.salinityTolerance}</td>
                  <td className="px-3 py-2 tabular">{c.nitrogenNeed}</td>
                  <td className="px-3 py-2 tabular">{c.nitrogenCredit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CalendarClock className="h-4 w-4 text-forest" aria-hidden />
          {L("Risk calendar, bare soil and pest-cycle indicators", "Lịch rủi ro, chỉ số đất trống và cắt vòng sâu bệnh")}
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-2">
          <li>
            <strong className="text-ink">{L("Crop cover:", "Che phủ:")}</strong>{" "}
            {L("each day of each season is placed on the calendar; a month is bare when living crops cover less than half of it (fallow counts as bare).", "mỗi ngày của từng vụ được đặt lên lịch; tháng đất trống là khi cây sống phủ ít hơn nửa tháng (để đất nghỉ tính là trống).")}
          </li>
          <li>
            <strong className="text-ink">{L("Daily extremes:", "Ngày cực đoan:")}</strong>{" "}
            {L(`heavy rain ≥ ${DAILY_THRESHOLDS.heavyRainMm} mm/day, very heavy ≥ ${DAILY_THRESHOLDS.veryHeavyRainMm} mm, hot ≥ ${DAILY_THRESHOLDS.hotC} °C, frost ≤ ${DAILY_THRESHOLDS.frostC} °C; averaged per calendar month over 10 years.`, `mưa lớn ≥ ${DAILY_THRESHOLDS.heavyRainMm} mm/ngày, rất lớn ≥ ${DAILY_THRESHOLDS.veryHeavyRainMm} mm, nóng ≥ ${DAILY_THRESHOLDS.hotC} °C, sương giá ≤ ${DAILY_THRESHOLDS.frostC} °C; lấy trung bình theo tháng trong 10 năm.`)}
          </li>
          <li>
            <strong className="text-ink">{L("Bare soil under rain:", "Đất trống dưới mưa:")}</strong>{" "}
            {L(`Σ bare share × (monthly rain ÷ 100 + 0.5 × heavy-rain days). Below ${BARE_SOIL_THRESHOLDS[0]} low, below ${BARE_SOIL_THRESHOLDS[1]} moderate, above high. Slope is not yet included.`, `Σ phần đất trống × (mưa tháng ÷ 100 + 0,5 × số ngày mưa lớn). Dưới ${BARE_SOIL_THRESHOLDS[0]} là thấp, dưới ${BARE_SOIL_THRESHOLDS[1]} là vừa, cao hơn là cao. Chưa tính độ dốc.`)}
          </li>
          <li>
            <strong className="text-ink">{L("Pest-cycle break:", "Cắt vòng sâu bệnh:")}</strong>{" "}
            {L(`share of season-to-season changes of crop family over 3 years. Below ${PEST_BREAK_THRESHOLDS[0] * 100}% little break, below ${PEST_BREAK_THRESHOLDS[1] * 100}% partial, above good.`, `tỷ lệ số lần đổi họ cây giữa hai vụ liên tiếp trong 3 năm. Dưới ${PEST_BREAK_THRESHOLDS[0] * 100}% là ít cắt, dưới ${PEST_BREAK_THRESHOLDS[1] * 100}% là một phần, cao hơn là cắt tốt.`)}
          </li>
          <li>
            <strong className="text-ink">{L("Calendar levels:", "Mức trong lịch:")}</strong>{" "}
            {L("irrigation need below 10 / 60 / 120 mm; waterlogging from monthly rain above 100 / 150 / 250 mm by the crop tolerance (+1 with heavy-rain days); heat from hot days below 1 / 5 / 15; salinity from your farm profile in Feb–May.", "nước tưới dưới 10 / 60 / 120 mm; ngập úng theo mưa tháng trên 100 / 150 / 250 mm tùy khả năng chịu ngập của cây (+1 khi có ngày mưa lớn); nắng nóng theo số ngày nóng dưới 1 / 5 / 15; mặn theo hồ sơ trang trại vào T2–T5.")}
          </li>
        </ul>
        <p className="mt-2 text-xs text-ink-3">{L("These indicators are not used in the weighted score; they inform the calendar, the evidence card and the comparison table.", "Các chỉ số này không tính vào điểm tổng hợp; chúng dùng cho lịch rủi ro, thẻ bằng chứng và bảng so sánh.")}</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">{L("Known limitations", "Giới hạn đã biết")}</h2>
        <ul className="mt-2 grid gap-1.5 text-sm text-ink-2 md:grid-cols-2">
          {[
            L("Regional satellite and reanalysis pixels are not field measurements.", "Điểm ảnh vệ tinh và tái phân tích theo vùng không phải số đo thực địa."),
            L("No yield model: income uses your yields with simple suitability penalties.", "Không có mô hình năng suất: thu nhập dùng năng suất bạn nhập với hệ số phạt đơn giản."),
            L("No numerical soil-carbon prediction is made.", "Không dự báo con số carbon trong đất."),
            L("Pests, diseases, markets and labour are not modeled.", "Chưa mô hình hóa sâu bệnh, thị trường và lao động."),
            L("Flood-season inundation depth is not modeled beyond monthly rainfall.", "Độ sâu ngập mùa lũ chưa được mô hình hóa ngoài lượng mưa tháng."),
            L("Validation against local field trials is the next required step.", "Bước bắt buộc tiếp theo là kiểm chứng với thí nghiệm đồng ruộng tại địa phương."),
          ].map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
