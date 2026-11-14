"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CloudRain,
  Droplets,
  Flame,
  Map as MapIcon,
  MapPin,
  Mountain,
  Pencil,
  Satellite,
  Snowflake,
  Sprout,
  Sun,
  ThermometerSun,
  Waves,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useClimateTrend, useEngine } from "@/lib/hooks";
import { temperatureTrend } from "@/lib/engine/statistics";
import { ClimateTrend } from "./climate-trend";
import { WeatherCrosscheck } from "./weather-crosscheck";
import { DetailPanel, ExtremesVisual, INFO_DETAILS, InfoCard, RainSpark, RiskDetail, RiskStrip, SoilVisual, SourcesBand, VisualState, mainRisks, type InfoDetail } from "./field-info";
import { climateSummary } from "@/lib/engine/simulate";
import { buildCalendar } from "@/lib/engine/insights";
import { extremesByYear } from "@/lib/services/power-daily";
import { SEASON_ORDER } from "@/lib/data/crops";
import { EvidenceList, WaterEvidence } from "./farm-evidence";
import { MapExplorer } from "@/components/map/map-explorer";
import { PrecipChart, SoilWetnessChart, TemperatureChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { ClimateNotice, CropIcon, DataChips, NoFarmState, StatusBadge, Term } from "@/components/common";
import { ExtremesByYear, ExtremesChart } from "@/components/insights";
import { Card, Skeleton, buttonClass } from "@/components/ui/primitives";
import { HeroTabs, PageHeader, SectionPanel, StatTile, Strip, useSection } from "@/components/ui/sections";

const SECTIONS = ["map", "info"];

const readHash = () => (typeof window === "undefined" ? "" : window.location.hash.replace("#", ""));

export function Overview() {
  const { L, t, num, crop, season, month, lang } = useI18n();
  const farm = useApp((s) => s.farm);
  const temperatureHistory = useClimateTrend(farm);
  const trend = useMemo(() => temperatureHistory.data ? temperatureTrend(temperatureHistory.data.points) : null, [temperatureHistory.data]);
  const { climate, modelClimate, modelLoading, extremes, output, ndvi, imerg, smap, usesImerg } = useEngine();
  const [section, setSection] = useSection("overview", SECTIONS, "map");
  // which summary card is expanded in "Field info"; old links such as /overview#risk open that card
  const [detail, setDetail] = useState<InfoDetail | null>(() => {
    const h = readHash();
    return (INFO_DETAILS as string[]).includes(h) ? (h as InfoDetail) : null;
  });
  const summary = useMemo(() => (climate.data ? climateSummary(climate.data) : null), [climate.data]);
  const calendar = useMemo(
    () =>
      farm && modelClimate && output
        ? buildCalendar({ result: output.reference.years[0], farm, climate: modelClimate, assumption: "baseline", extremes: extremes.data })
        : null,
    [farm, modelClimate, output, extremes.data],
  );

  // follow legacy topic links (/overview#weather, #risk, #sources …) on load and while the page is open
  useEffect(() => {
    const follow = () => {
      const h = readHash();
      if ((INFO_DETAILS as string[]).includes(h)) {
        setSection("info"); // rewrites the hash to #info …
        setDetail(h as InfoDetail);
        window.history.replaceState(null, "", `#${h}`); // … so keep the topic link
      } else if (h === "info") {
        setDetail(null);
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // bring the opened detail into view
  useEffect(() => {
    if (!detail || section !== "info") return;
    const id = window.setTimeout(() => document.getElementById(`info-detail-${detail}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(id);
  }, [detail, section]);

  if (!farm) return <NoFarmState />;
  const d = climate.data;
  const climStatus = d?.status ?? "unavailable";
  const period = d ? `${d.period[0]}–${d.period[1]}` : "";
  const srcLabel = d ? `${d.source} · ${d.resolution}${d.retrievedAt ? ` · ${L("retrieved", "lấy ngày")} ${d.retrievedAt}` : ""}` : "";
  const yearly = extremes.data ? extremesByYear(extremes.data) : [];
  const avgHot = yearly.length ? yearly.reduce((s, y) => s + y.hotDays, 0) / yearly.length : null;
  const avgHeavy = yearly.length ? yearly.reduce((s, y) => s + y.heavyRainDays, 0) / yearly.length : null;
  const avgFrost = yearly.length ? yearly.reduce((s, y) => s + y.frostDays, 0) / yearly.length : null;
  const peakMonths = calendar ? calendar.worstMonths.slice(0, 3) : [];
  const topRisks = calendar ? mainRisks(calendar).slice(0, 2) : [];
  const soilDry = summary?.soilWetDry ?? null;
  const soilWet = summary?.soilWetWet ?? null;
  const trendText = trend ? `${L("temp.", "nhiệt độ")} ${trend.slopePerYear >= 0 ? "+" : "−"}${num(Math.abs(trend.slopePerYear * 10), 2)} °C/${L("decade", "10 năm")}` : null;

  const tabs = [
    { id: "map", icon: MapIcon, label: L("Field map", "Bản đồ ruộng"), hint: L("Satellite view & NASA layers", "Ảnh vệ tinh & lớp NASA"), tone: "green" as const },
    { id: "info", icon: Mountain, label: L("Field info", "Thông tin đất"), hint: L("Weather, soil & risks — tap a card for details", "Thời tiết, đất, rủi ro — bấm thẻ để xem chi tiết"), tone: "earth" as const },
  ];

  const toggle = (id: InfoDetail) => {
    const next = detail === id ? null : id;
    setDetail(next);
    try {
      window.history.replaceState(null, "", `#${next ?? "info"}`);
    } catch {
      /* ignore */
    }
  };
  const close = () => toggle(detail as InfoDetail);
  const detailTitle: Record<InfoDetail, string> = {
    weather: L("Rain & temperature · full detail", "Mưa & nhiệt độ · chi tiết"),
    soil: L("Soil & moisture · full detail", "Đất & độ ẩm · chi tiết"),
    extremes: L("Extreme days · full detail", "Thời tiết khắc nghiệt · chi tiết"),
    risk: L("Risks through the year · analysis", "Rủi ro trong năm · phân tích"),
    sources: L("Data sources · coverage & quality", "Nguồn dữ liệu · phạm vi & chất lượng"),
  };

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

      <HeroTabs tabs={tabs} value={section} onChange={setSection} label={L("Farm topics", "Chủ đề về ruộng")} />

      {/* MAP */}
      <SectionPanel id="map" active={section === "map"}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <MapExplorer key={farm.id} farm={farm} />
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
      </SectionPanel>

      {/* FIELD INFO: summary cards first, full detail on tap */}
      <SectionPanel id="info" active={section === "info"} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            icon={CloudRain}
            title={L("Rain", "Lượng mưa")}
            value={summary ? num(summary.meanAnnualPrecip) : "—"}
            unit={L("mm/year", "mm/năm")}
            note={summary ? `${L(`${summary.dryMonths} dry months`, `${summary.dryMonths} tháng khô`)}${trendText ? ` · ${trendText}` : ""}` : undefined}
            visual={summary ? <RainSpark months={summary.months} /> : <VisualState loading={climate.loading} />}
            open={detail === "weather"}
            onToggle={() => toggle("weather")}
            controls="info-detail-weather"
            image="card-rain.webp"
          />
          <InfoCard
            icon={Mountain}
            title={L("Soil", "Đất")}
            value={<span className="text-[22px]">{t(`tex.${farm.soilType}`)}</span>}
            note={`pH ${farm.soilPH === null ? "—" : num(farm.soilPH, 1)} · ${L("organic carbon", "carbon hữu cơ")} ${farm.soilOrganicCarbon === null ? "—" : num(farm.soilOrganicCarbon, 1) + " %"}`}
            visual={
              <SoilVisual dry={soilDry} wet={soilWet} />
            }
            open={detail === "soil"}
            onToggle={() => toggle("soil")}
            controls="info-detail-soil"
            image="card-soil.webp"
          />
          <InfoCard
            icon={Flame}
            title={L("Extreme weather", "Thời tiết khắc nghiệt")}
            value={avgHot === null ? "—" : num(avgHot)}
            unit={L("hot days/year", "ngày nóng/năm")}
            note={avgHeavy === null ? undefined : L(`${num(avgHeavy, 1)} heavy-rain days/year`, `${num(avgHeavy, 1)} ngày mưa lớn/năm`)}
            visual={
              avgHot === null ? (
                <VisualState loading={extremes.loading} />
              ) : (
                <ExtremesVisual
                  items={[
                    { icon: ThermometerSun, value: num(avgHot), label: "≥ 35 °C", color: "text-amber" },
                    { icon: CloudRain, value: num(avgHeavy ?? 0, 1), label: "≥ 50 mm", color: "text-[#7dbbe6]" },
                    { icon: Snowflake, value: num(avgFrost ?? 0, 1), label: "≤ 0 °C", color: "text-white/80" },
                  ]}
                />
              )
            }
            open={detail === "extremes"}
            onToggle={() => toggle("extremes")}
            controls="info-detail-extremes"
            image="card-drought.webp"
          />
          <InfoCard
            icon={CalendarClock}
            title={L("Riskiest months", "Tháng nhiều rủi ro nhất")}
            value={calendar && peakMonths.length ? <span className="text-[24px]">{peakMonths.map((m) => month(m)).join(" · ")}</span> : "—"}
            note={
              calendar
                ? `${topRisks.length ? topRisks.map((r) => r.name[lang]).join(", ") : L("No high risk", "Không có rủi ro cao")}${calendar.bareMonths.length ? ` · ${L(`${calendar.bareMonths.length} bare months`, `${calendar.bareMonths.length} tháng ruộng trống`)}` : ""}`
                : undefined
            }
            visual={calendar ? <RiskStrip calendar={calendar} /> : <VisualState loading={modelLoading} />}
            open={detail === "risk"}
            onToggle={() => toggle("risk")}
            controls="info-detail-risk"
            image="card-harvest.webp"
          />
        </div>

        {/* full detail of the open card */}
        {detail === "weather" && (
          <DetailPanel id="info-detail-weather" title={detailTitle.weather} onClose={close}>
            <Strip tone="blue" icon={CloudRain} title={L("Rain & temperature", "Mưa & nhiệt độ")} desc={period ? `NASA POWER · ${period}` : "NASA POWER"} right={<StatusBadge status={climStatus} />} />
            {!summary ? (
              climate.loading ? <Skeleton className="h-72" /> : null
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatTile tone="blue" icon={Droplets} label={L("Average rain", "Mưa trung bình")} value={num(summary.meanAnnualPrecip)} unit={L("mm/year", "mm/năm")} note={L(`${summary.months.filter((m) => m.precip > 150).length} months above 150 mm`, `${summary.months.filter((m) => m.precip > 150).length} tháng mưa trên 150 mm`)} />
                  <StatTile tone="amber" icon={Sun} label={L("Dry months", "Tháng khô")} value={summary.dryMonths} unit={L("per year", "mỗi năm")} note={L("rain below half of crop-water demand", "mưa dưới một nửa nhu cầu bốc hơi")} />
                  <StatTile tone="rose" icon={ThermometerSun} label={L("Long-term trend", "Xu hướng dài hạn")} value={trend ? `${trend.slopePerYear >= 0 ? "+" : "−"}${num(Math.abs(trend.slopePerYear * 10), 2)}` : "—"} unit={L("°C/decade", "°C/10 năm")} note={trend ? `${trend.start}–${trend.end} · Sen / Mann–Kendall` : L("Requires 30 complete years", "Cần đủ 30 năm dữ liệu")} />
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
            <ClimateTrend history={temperatureHistory} />
          </DetailPanel>
        )}

        {detail === "soil" && (
          <DetailPanel id="info-detail-soil" title={detailTitle.soil} onClose={close}>
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
                    explanation={L("Texture controls paddy percolation and which upland crops drain well enough.", "Thành phần cơ giới đất ảnh hưởng đến khả năng giữ nước, tốc độ thấm và thoát nước, từ đó ảnh hưởng nhu cầu tưới và lựa chọn cây trồng.")}
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
          </DetailPanel>
        )}

        {detail === "extremes" && (
          <DetailPanel id="info-detail-extremes" title={detailTitle.extremes} onClose={close}>
            <WeatherCrosscheck farm={farm} period={extremes.data?.period} />
            <Strip
              tone="rose"
              icon={Flame}
              title={L("Extreme weather days", "Ngày thời tiết khắc nghiệt")}
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
                  <h3 className="mb-2 text-sm font-bold">{L("Average extreme days in each month", "Số ngày thời tiết khắc nghiệt trung bình mỗi tháng")}</h3>
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
          </DetailPanel>
        )}

        {detail === "risk" && calendar && (
          <DetailPanel id="info-detail-risk" title={detailTitle.risk} onClose={close}>
            <RiskDetail
              calendar={calendar}
              cta={
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-space-900 px-5 py-4 text-white">
                  <p className="text-sm">{L("See how another rotation changes these months.", "Xem cách luân canh khác thay đổi các tháng này ra sao.")}</p>
                  <Link href="/simulator#calendar" className={buttonClass("primary", "md")}>
                    {L("Compare in the simulator", "So sánh trong mô phỏng")}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              }
            />
          </DetailPanel>
        )}

        {/* data sources: slim band, full list on tap */}
        <SourcesBand
          open={detail === "sources"}
          onToggle={() => toggle("sources")}
          names={["NASA POWER", ...(usesImerg ? ["GPM IMERG"] : []), "SMAP", "SoilGrids"]}
        />
        {detail === "sources" && (
          <DetailPanel id="info-detail-sources" title={detailTitle.sources} onClose={close}>
            <div className="space-y-4">
              <p className="text-xs text-ink-2">{L("Weather reference window:", "Giai đoạn khí hậu tham chiếu:")} {period}. <Link href="/settings#history" className="font-semibold text-lime-ink underline">{L("Change in Settings", "Đổi trong Cài đặt")}</Link></p>
              <EvidenceList climate={climate} daily={extremes} ndvi={ndvi} imerg={imerg} smap={smap} usesImerg={usesImerg} />
            </div>
          </DetailPanel>
        )}
      </SectionPanel>

    </div>
  );
}
