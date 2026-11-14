"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CloudRain,
  Droplets,
  Flame,
  Layers,
  Leaf,
  Map as MapIcon,
  MapPin,
  Mountain,
  Pencil,
  Satellite,
  Sprout,
  Sun,
  ThermometerSun,
  Waves,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { historyYears } from "@/lib/data/evidence";
import { useEngine } from "@/lib/hooks";
import { climateSummary } from "@/lib/engine/simulate";
import { buildCalendar } from "@/lib/engine/insights";
import { extremesByYear } from "@/lib/services/power-daily";
import { SEASON_ORDER } from "@/lib/data/crops";
import type { OverlayId } from "@/lib/data/layers";
import { EvidenceList, WaterEvidence } from "./farm-evidence";
import { FarmMap, type Basemap } from "@/components/map/farm-map";
import { BasemapToggle, LayerPanel, MapLegend, LayerTimeBar } from "@/components/map/layer-panel";
import { PrecipChart, SoilWetnessChart, TemperatureChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { ClimateNotice, CropIcon, DataChips, NoFarmState, StatusBadge, Term } from "@/components/common";
import { ExtremesByYear, ExtremesChart, NdviChart, RiskCalendar, ndviDips } from "@/components/insights";
import { Badge, Card, Select, Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/overlays";
import { PageHeader, SectionPanel, SectionTabs, StatTile, Strip, useSection } from "@/components/ui/sections";

const SECTIONS = ["map", "weather", "soil", "extremes", "green", "risk", "sources"];

export function Overview() {
  const { L, t, num, crop, season, month } = useI18n();
  const farm = useApp((s) => s.farm);
  const { climate, modelClimate, modelLoading, extremes, output, ndvi, imerg, smap, usesImerg } = useEngine();
  const defaultYears = historyYears(new URLSearchParams())!;
  const selectedYears = useApp((s) => s.historyYears);
  const setHistoryYears = useApp((s) => s.setHistoryYears);
  const history = selectedYears ?? defaultYears;
  const [section, setSection] = useSection("overview", SECTIONS, "map");
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [overlays, setOverlays] = useState<OverlayId[]>([]);
  const [showBoundary, setShowBoundary] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const summary = useMemo(() => (climate.data ? climateSummary(climate.data) : null), [climate.data]);
  const calendar = useMemo(
    () =>
      farm && modelClimate && output
        ? buildCalendar({ result: output.reference.years[0], farm, climate: modelClimate, assumption: "baseline", extremes: extremes.data })
        : null,
    [farm, modelClimate, output, extremes.data],
  );

  if (!farm) return <NoFarmState />;
  const d = climate.data;
  const climStatus = d?.status ?? "unavailable";
  const period = d ? `${d.period[0]}–${d.period[1]}` : "";
  const srcLabel = d ? `${d.source} · ${d.resolution}${d.retrievedAt ? ` · ${L("retrieved", "lấy ngày")} ${d.retrievedAt}` : ""}` : "";
  const toggle = (id: OverlayId) => setOverlays((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  const tDiff = summary ? summary.recentT - summary.meanT : 0;
  const yearly = extremes.data ? extremesByYear(extremes.data) : [];
  const avgHot = yearly.length ? yearly.reduce((s, y) => s + y.hotDays, 0) / yearly.length : null;
  const avgHeavy = yearly.length ? yearly.reduce((s, y) => s + y.heavyRainDays, 0) / yearly.length : null;
  const avgFrost = yearly.length ? yearly.reduce((s, y) => s + y.frostDays, 0) / yearly.length : null;
  const dips = ndvi.data ? ndviDips(ndvi.data) : [];

  const tabs = [
    { id: "map", icon: MapIcon, label: L("Field map", "Bản đồ ruộng"), hint: L("Satellite view & NASA layers", "Ảnh vệ tinh & lớp NASA"), tone: "green" as const },
    { id: "weather", icon: CloudRain, label: L("Rain & temperature", "Mưa & nhiệt độ"), hint: L("NASA POWER weather history", "Lịch sử thời tiết NASA POWER"), tone: "blue" as const },
    { id: "soil", icon: Mountain, label: L("Soil & moisture", "Đất & độ ẩm"), hint: L("Soil type, wet and dry seasons", "Loại đất, mùa khô – mùa mưa"), tone: "earth" as const },
    { id: "extremes", icon: Flame, label: L("Extreme days", "Ngày cực đoan"), hint: L("Heavy rain, heat, frost", "Mưa lớn, nắng nóng, sương giá"), tone: "rose" as const },
    { id: "green", icon: Leaf, label: L("Greenness from space", "Độ xanh từ vệ tinh"), hint: L("MODIS NDVI every 16 days", "NDVI MODIS 16 ngày/lần"), tone: "leaf" as const },
    { id: "sources", icon: Satellite, label: L("Data sources", "Nguồn dữ liệu"), hint: L("Coverage and quality", "Phạm vi và chất lượng"), tone: "blue" as const },
    { id: "risk", icon: CalendarClock, label: L("Risk calendar", "Lịch rủi ro"), hint: L("Bare & vulnerable months today", "Tháng đất trống, dễ tổn thương"), tone: "amber" as const },
  ];

  const layerControls = (
    <LayerPanel overlays={overlays} onToggle={toggle} showBoundary={showBoundary} onToggleBoundary={() => setShowBoundary((v) => !v)} hasBoundary={!!farm.boundary} />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        image="mekong-delta"
        icon={Sprout}
        eyebrow={L("My farm", "Ruộng của tôi")}
        title={farm.name}
        desc={
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {num(farm.latitude, 4)}°, {num(farm.longitude, 4)}° · {num(farm.areaHa, 2)} ha · {SEASON_ORDER.map((s) => crop(farm.cropHistory.typicalPattern[s]).replace(/\s*\(.*\)$/, "")).join(" → ")}
          </span>
        }
        actions={
          <Link href="/simulator" className={buttonClass("primary", "lg")}>
            {L("See the next 5 years", "Xem 5 năm tới")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
        meta={<DataChips climate={climate} />}
      />
      <ClimateNotice climate={climate} />

      <SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Farm topics", "Chủ đề về ruộng")} />

      {/* MAP */}
      <SectionPanel id="map" active={section === "map"}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            <div className="relative h-[380px] md:h-[500px]">
              <FarmMap
                center={[farm.longitude, farm.latitude]}
                zoom={farm.boundary ? 15.5 : 13.5}
                basemap={basemap}
                overlays={overlays}
                boundary={farm.boundary}
                showBoundary={showBoundary}
                marker={[farm.longitude, farm.latitude]}
                fitToBoundary
                className="absolute inset-0"
              />
              <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
                <BasemapToggle value={basemap} onChange={setBasemap} />
                <button onClick={() => setLayersOpen(true)} className="flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold shadow-sm">
                  <Layers className="h-3.5 w-3.5" aria-hidden />
                  {L("NASA layers", "Lớp NASA")}
                  {overlays.length > 0 && <Badge tone="blue">{overlays.length}</Badge>}
                </button>
              </div>
              <MapLegend overlays={overlays} className="absolute right-14 top-3 hidden sm:block" />
              <LayerTimeBar overlays={overlays} onEnable={() => toggle("smap")} className="absolute bottom-3 left-3 right-12 sm:right-auto sm:max-w-[460px]" />
            </div>
            <div className="border-t border-line px-4 py-2 text-[11px] text-ink-2">
              {basemap === "satellite" ? L("Imagery: Sentinel-2 cloudless 2023 · 10 m", "Ảnh: Sentinel-2 cloudless 2023 · 10 m") : "© OpenStreetMap · CARTO"} · {num(farm.latitude, 4)}, {num(farm.longitude, 4)}
            </div>
          </Card>
          <Card className="h-fit p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">{L("Farm profile", "Hồ sơ ruộng")}</h2>
              <Link href="/settings" className={buttonClass("ghost", "sm", "h-8 px-2")} aria-label={L("Edit preferences", "Sửa tùy chọn")}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {SEASON_ORDER.map((s) => (
                <div key={s} className="rounded-xl bg-sand px-1.5 py-2 text-center">
                  <CropIcon cropId={farm.cropHistory.typicalPattern[s]} size={24} className="mx-auto" />
                  <p className="mt-1 truncate text-[11px] font-semibold">{crop(farm.cropHistory.typicalPattern[s]).replace(/\s*\(.*\)$/, "")}</p>
                  <p className="text-[10px] text-ink-3">{season(s)}</p>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-ink-2">{L("Soil", "Đất")}</dt>
                <dd className="font-semibold">
                  {t(`tex.${farm.soilType}`)}
                  {farm.soilPH !== null && ` · pH ${num(farm.soilPH, 1)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-2">{L("Water", "Nước")}</dt>
                <dd className="text-right font-semibold">
                  {t(`src.${farm.irrigationSource}`)} · {t(`avail.${farm.waterAvailability}`)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ink-2">{L("Salinity", "Mặn")}</dt>
                <dd className="font-semibold">{t(`sal.${farm.salinityRisk}`)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs font-medium text-ink-2">{L("Your priorities", "Ưu tiên của bạn")}</p>
            <ol className="mt-1.5 space-y-1">
              {farm.farmerPriorities.map((p, i) => (
                <li key={p} className="flex items-center gap-2 text-xs">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-forest">{i + 1}</span>
                  {t(`crit.${p}`)}
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <Sheet open={layersOpen} onOpenChange={setLayersOpen} title={L("NASA map layers", "Lớp bản đồ NASA")} side="right">
          {layerControls}
          <MapLegend overlays={overlays} className="mt-3" />
        </Sheet>
      </SectionPanel>

      {/* WEATHER */}
      <SectionPanel id="weather" active={section === "weather"}>
        <Strip tone="blue" icon={CloudRain} title={L("Rain & temperature", "Mưa & nhiệt độ")} desc={period ? `NASA POWER · ${period}` : "NASA POWER"} right={<StatusBadge status={climStatus} />} />
        {!summary ? (
          climate.loading ? <Skeleton className="h-72" /> : null
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile tone="blue" icon={Droplets} label={L("Average rain", "Mưa trung bình")} value={num(summary.meanAnnualPrecip)} unit={L("mm/year", "mm/năm")} note={L(`${summary.months.filter((m) => m.precip > 150).length} months above 150 mm`, `${summary.months.filter((m) => m.precip > 150).length} tháng mưa trên 150 mm`)} />
              <StatTile tone="amber" icon={Sun} label={L("Dry months", "Tháng khô")} value={summary.dryMonths} unit={L("per year", "mỗi năm")} note={L("rain below half of crop-water demand", "mưa dưới một nửa nhu cầu bốc hơi")} />
              <StatTile tone="rose" icon={ThermometerSun} label={L("Recent warming", "Ấm lên gần đây")} value={`${tDiff >= 0 ? "+" : "−"}${num(Math.abs(tDiff), 2)}`} unit="°C" note={L(`${summary.recentYears[0]}–${summary.recentYears.at(-1)} vs ${period}`, `${summary.recentYears[0]}–${summary.recentYears.at(-1)} so với ${period}`)} />
            </div>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-bold">{L("Rain each month vs. water the air takes back", "Mưa mỗi tháng so với lượng nước bốc hơi")}</h3>
              <p className="mb-3 text-xs text-ink-2">
                {L("Bars: rainfall. Line: ", "Cột: lượng mưa. Đường: ")}
                <Term id="et0">ET0</Term>
                {L(" shows how quickly water can evaporate. Your crop and soil affect irrigation need.", " cho biết nước có thể bốc hơi nhanh đến đâu. Cây trồng và đất ảnh hưởng nhu cầu tưới.")}
              </p>
              <PrecipChart months={summary.months} />
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-bold">{L("Temperature", "Nhiệt độ")}</h3>
              <TemperatureChart months={summary.months} annual={summary.annualByYear} />
            </Card>
            <p className="text-[11px] text-ink-2">{srcLabel}. {L("One value for a ≈55 km grid cell — your field can differ.", "Một giá trị cho ô lưới ≈55 km — ruộng của bạn có thể khác.")}</p>
          </div>
        )}
        <WaterEvidence series={imerg} kind="rain" />
      </SectionPanel>

      {/* SOIL */}
      <SectionPanel id="soil" active={section === "soil"}>
        <Strip tone="earth" icon={Mountain} title={L("Soil & moisture", "Đất & độ ẩm")} desc={L("What the soil is, and how wet it gets through the year", "Đất loại gì, và ướt khô ra sao trong năm")} />
        {!summary ? (
          climate.loading ? <Skeleton className="h-72" /> : null
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-3">
              <MetricCard
                icon={<Mountain className="h-4 w-4" aria-hidden />}
                accent="earth"
                title={L("Soil type and properties", "Loại đất và tính chất")}
                value={t(`tex.${farm.soilType}`)}
                sub={`pH ${farm.soilPH === null ? "—" : num(farm.soilPH, 1)} · ${L("organic carbon", "carbon hữu cơ")} ${farm.soilOrganicCarbon === null ? "—" : num(farm.soilOrganicCarbon, 1) + " %"}`}
                status={farm.soilSources.soilType.status}
                source={farm.soilSources.soilType.source}
                explanation={L("Texture controls paddy percolation and which upland crops drain well enough.", "Sa cấu đất quyết định nước thấm của ruộng lúa và cây màu nào thoát nước đủ tốt.")}
                limitation={L("Only a lab soil test gives reliable pH and organic carbon for your field.", "Chỉ xét nghiệm đất mới biết chắc pH và carbon hữu cơ trên ruộng.")}
              />
              <MetricCard
                icon={<Waves className="h-4 w-4" aria-hidden />}
                accent="blue"
                title={L("Soil moisture: dry → wet season", "Độ ẩm đất: mùa khô → mùa mưa")}
                value={summary.soilWetDry === null || summary.soilWetWet === null ? "—" : `${num(summary.soilWetDry * 100)}% → ${num(summary.soilWetWet * 100)}%`}
                sub={L("Root zone, Feb–Apr → Aug–Oct", "Vùng rễ, T2–T4 → T8–T10")}
                status={summary.soilWetDry === null || summary.soilWetWet === null ? "unavailable" : "estimated"}
                period={period}
                source={`NASA POWER GWETROOT (MERRA-2) · ${d?.resolution ?? ""}`}
                explanation={L("0% is completely dry, 100% saturated. Turn on the SMAP layer on the Field map for recent satellite soil moisture.", "0% là khô hoàn toàn, 100% là bão hòa. Bật lớp SMAP ở Bản đồ ruộng để xem độ ẩm đất vệ tinh gần đây.")}
                limitation={L("Model-based regional value; flooded paddies and irrigation are not represented.", "Giá trị mô hình theo vùng; không thể hiện ruộng ngập và việc tưới.")}
              />
            </div>
            <Card className="p-4">
              <h3 className="mb-1 text-sm font-bold">{L("Soil wetness through the year", "Độ ẩm đất trong năm")}</h3>
              <p className="mb-3 text-xs text-ink-2">
                <Term id="soil-moisture">{L("What is soil moisture?", "Độ ẩm đất là gì?")}</Term>
              </p>
              <SoilWetnessChart months={summary.months} />
            </Card>
          </div>
        )}
        <WaterEvidence series={smap} kind="soil" />
      </SectionPanel>

      {/* EXTREMES (U5) */}
      <SectionPanel id="extremes" active={section === "extremes"}>
        <Strip
          tone="rose"
          icon={Flame}
          title={L("Extreme weather days", "Ngày thời tiết cực đoan")}
          desc={L("Counted day by day from NASA POWER daily data", "Đếm từng ngày theo số liệu ngày của NASA POWER")}
          right={<StatusBadge status={extremes.data?.status ?? "unavailable"} />}
        />
        {extremes.loading ? (
          <Skeleton className="h-72" />
        ) : !extremes.data ? (
          <Card className="p-6 text-center text-sm text-ink-2">
            {L("Daily data could not be loaded for this location", "Chưa tải được số liệu ngày cho vị trí này")}
            {extremes.fallbackReason ? ` (${extremes.fallbackReason})` : ""}.
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile tone="rose" icon={ThermometerSun} label={L("Hot days ≥ 35 °C", "Ngày nóng ≥ 35 °C")} value={num(avgHot ?? 0)} unit={L("per year", "mỗi năm")} note={<Term id="heat-stress">{L("Why it matters", "Vì sao quan trọng")}</Term>} />
              <StatTile tone="blue" icon={CloudRain} label={L("Heavy-rain days ≥ 50 mm", "Ngày mưa ≥ 50 mm")} value={num(avgHeavy ?? 0, 1)} unit={L("per year", "mỗi năm")} note={<Term id="waterlogging">{L("Waterlogging risk", "Nguy cơ ngập úng")}</Term>} />
              <StatTile tone="violet" icon={Satellite} label={L("Frost days ≤ 0 °C", "Ngày sương giá ≤ 0 °C")} value={num(avgFrost ?? 0, 1)} unit={L("per year", "mỗi năm")} note={<Term id="frost">{L("Frost risk", "Nguy cơ sương giá")}</Term>} />
            </div>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-bold">{L("Average extreme days in each month", "Số ngày cực đoan trung bình mỗi tháng")}</h3>
              <ExtremesChart extremes={extremes.data} />
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-bold">{L("Year by year", "Theo từng năm")}</h3>
              <ExtremesByYear extremes={extremes.data} />
            </Card>
            <p className="text-[11px] text-ink-2">
              {extremes.data.source}, {extremes.data.period.join("–")} · {extremes.data.resolution}
              {extremes.data.cached ? ` · ${L("cached", "bản lưu")} ${extremes.data.retrievedAt}` : ""}.{" "}
              {L("This reanalysis can run warmer than local weather stations; compare with what you see in your field.", "Số liệu tái phân tích này có thể nóng hơn trạm khí tượng địa phương; hãy đối chiếu với thực tế trên ruộng.")}
            </p>
          </div>
        )}
      </SectionPanel>

      {/* GREENNESS (U4) */}
      <SectionPanel id="green" active={section === "green"}>
        <Strip
          tone="leaf"
          icon={Leaf}
          title={L("Greenness seen from space", "Độ xanh nhìn từ vệ tinh")}
          desc={L("NASA MODIS, one value every 16 days for a 250 m square around your field", "NASA MODIS, 16 ngày một giá trị cho ô 250 m quanh ruộng")}
          right={<StatusBadge status={ndvi.data?.points.some((p) => p.ndvi !== null) ? "observed" : "unavailable"} />}
        />
        {ndvi.loading ? (
          <Card className="p-6">
            <Skeleton className="h-60" />
            <p className="mt-3 text-center text-xs text-ink-2">{L("Asking NASA's MODIS service — this can take up to a minute…", "Đang hỏi dịch vụ MODIS của NASA — có thể mất tới một phút…")}</p>
          </Card>
        ) : !ndvi.data ? (
          <Card className="p-6 text-center text-sm text-ink-2">
            {L("No satellite greenness record could be loaded for this field", "Chưa tải được chuỗi độ xanh vệ tinh cho ruộng này")}
            {ndvi.fallbackReason ? ` (${ndvi.fallbackReason})` : ""}. {L("Nothing is shown rather than guessed.", "App không tự đoán giá trị.")}
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-1 text-sm font-bold">
                <Term id="ndvi">NDVI</Term> {L(`· ${ndvi.data.points[0]?.date} → ${ndvi.data.points.at(-1)?.date}`, `· ${ndvi.data.points[0]?.date} → ${ndvi.data.points.at(-1)?.date}`)}
              </h3>
              <p className="mb-3 text-xs text-ink-2">
                {L(
                  "Each dip is usually a harvest, land preparation or a flooded field; each peak is a crop at full growth. Three dips a year match three crops a year.",
                  "Mỗi lần giảm thường là lúc thu hoạch, làm đất hoặc ruộng ngập nước; mỗi đỉnh là lúc cây phát triển mạnh nhất. Ba lần giảm mỗi năm ứng với ba vụ mỗi năm.",
                )}
              </p>
              <NdviChart series={ndvi.data} />
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="text-sm font-bold">{L("When the field looked least green", "Những lúc ruộng ít xanh nhất")}</h3>
                <p className="mt-1 text-xs text-ink-2">{L("Dates where greenness fell below 0.4:", "Các ngày độ xanh xuống dưới 0,4:")}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dips.length === 0 && <span className="text-xs text-ink-3">{L("none in this period", "không có trong giai đoạn này")}</span>}
                  {dips.map((p) => (
                    <Badge key={p.date} tone="amber">
                      {month(Number(p.date.slice(5, 7)))}/{p.date.slice(0, 4)} · {num(p.ndvi ?? 0, 2)}
                    </Badge>
                  ))}
                </div>
              </Card>
              <Card className="p-4 text-xs leading-relaxed text-ink-2">
                <h3 className="mb-1 text-sm font-bold text-ink">{L("Read with care", "Đọc cho đúng")}</h3>
                {L(
                  "The 250 m square also covers canals, houses and neighbouring fields, and clouds can pull values down. Use it to see the rhythm of green and bare periods, not the exact state of your own plot.",
                  "Ô 250 m còn gồm kênh, nhà và ruộng xung quanh, và mây có thể kéo giá trị xuống. Dùng để thấy nhịp xanh – trống trong năm, không phải trạng thái chính xác của riêng thửa ruộng.",
                )}{" "}
                {ndvi.data.source} · {ndvi.data.resolution}
                {ndvi.data.cached ? ` · ${L("cached", "bản lưu")} ${ndvi.data.retrievedAt}` : ""}.
              </Card>
            </div>
          </div>
        )}
      </SectionPanel>

      <SectionPanel id="sources" active={section === "sources"} className="space-y-4">
        <Card className="p-4">
          <h2 className="text-sm font-bold">{L("Years used for rotation analysis", "Các năm dùng để phân tích luân canh")}</h2>
          <p className="mt-1 text-xs text-ink-2">{L("Choose up to ten complete calendar years. The greenness chart shows recent MODIS history.", "Chọn tối đa mười năm dương lịch trọn vẹn. Biểu đồ độ xanh dùng dữ liệu MODIS gần đây.")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="text-xs font-semibold">{L("From", "Từ")}
              <Select className="mt-1" value={history.start} onChange={(e) => setHistoryYears({ ...history, start: Number(e.target.value) })}>
                {Array.from({ length: Math.min(10, history.end - 1984 + 1) }, (_, i) => history.end - i).map((y) => <option value={y} key={y}>{y}</option>)}
              </Select>
            </label>
            <label className="text-xs font-semibold">{L("Through", "Đến")}
              <Select className="mt-1" value={history.end} onChange={(e) => {
                const end = Number(e.target.value);
                setHistoryYears({ start: Math.max(1984, end - (history.end - history.start)), end });
              }}>
                {Array.from({ length: defaultYears.end - 1984 + 1 }, (_, i) => defaultYears.end - i).map((y) => <option value={y} key={y}>{y}</option>)}
              </Select>
            </label>
          </div>
        </Card>
        <EvidenceList climate={climate} daily={extremes} ndvi={ndvi} imerg={imerg} smap={smap} usesImerg={usesImerg} />
      </SectionPanel>

      {/* RISK CALENDAR (U1) */}
      <SectionPanel id="risk" active={section === "risk"}>
        <Strip
          tone="amber"
          icon={CalendarClock}
          title={L("Risk calendar for your current practice", "Lịch rủi ro của cách trồng hiện tại")}
          desc={L("When the field is bare, and when the current crops are most exposed", "Khi nào ruộng để trống, và lúc nào cây đang trồng dễ bị ảnh hưởng nhất")}
        />
        {!calendar ? (
          modelLoading ? <Skeleton className="h-64" /> : null
        ) : (
          <Card className="p-4">
            <RiskCalendar calendar={calendar} />
            <div className={cn("mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mint/60 px-4 py-3")}>
              <p className="text-sm text-ink">{L("See how a different rotation would change this calendar.", "Xem một cách luân canh khác sẽ thay đổi lịch này thế nào.")}</p>
              <Link href="/simulator#calendar" className={buttonClass("primary", "md")}>
                {L("Compare in the simulator", "So sánh trong mô phỏng")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </Card>
        )}
      </SectionPanel>
    </div>
  );
}
