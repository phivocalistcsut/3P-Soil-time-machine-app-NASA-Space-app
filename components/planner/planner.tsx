"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarRange, ChevronLeft, ChevronRight, Droplets, Info, ListOrdered, NotebookPen, Pencil, Printer, Save, Table2, X } from "lucide-react";
import { PageHeader, SectionPanel, SectionTabs, useSection } from "@/components/ui/sections";
import { climateValues, useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useEngine, useScenarios } from "@/lib/hooks";
import { SEASONS } from "@/lib/data/crops";
import { newId } from "@/lib/data/demo";
import { screenCrops } from "@/lib/engine/simulate";
import type { SeasonId, SeasonResult } from "@/lib/types";
import { ClimateNotice, DataChips, CropIcon, FarmDemoNotice, NoFarmState, scenarioColor, StatusBadge } from "@/components/common";
import { Badge, Button, Card, Select, Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { toast } from "@/components/ui/overlays";
import { RotationBuilder } from "@/components/sim/rotation-builder";
import { PlanCalendar } from "./plan-calendar";
import { PlanSeasons, PlanYears } from "./plan-outlook";
import { PlanNotes } from "./plan-notes";
import { planSeasonPeriod } from "@/lib/data/plan-calendar";

export function Planner() {
  const { L, t, num, crop, season, month, lang } = useI18n();
  const [section, setSection] = useSection("planner", ["calendar", "seasons", "years", "notes"], "calendar");
  const farm = useApp((s) => s.farm);
  const scenarios = useScenarios();
  const activeId = useApp((s) => s.activeScenarioId);
  const setActive = useApp((s) => s.setActiveScenario);
  const upsert = useApp((s) => s.upsertScenario);
  const plans = useApp((s) => s.plans);
  const savePlan = useApp((s) => s.savePlan);
  const removePlan = useApp((s) => s.removePlan);
  const selectedYear = useApp((s) => s.selectedYear);
  const setYear = useApp((s) => s.setYear);
  const drafts = useApp((s) => s.scenarioDrafts);
  const setDraft = useApp((s) => s.setScenarioDraft);
  const discardDraft = useApp((s) => s.discardScenarioDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<SeasonId>("S1");
  const { output, climate, modelClimate, modelLoading, settings, usesImerg } = useEngine();
  const screen = useMemo(() => (farm && modelClimate ? screenCrops(farm, modelClimate, settings) : null), [farm, modelClimate, settings]);

  const scenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const draft = scenario ? drafts[scenario.id] : undefined;
  const editing = editingId === scenario?.id;
  const sim = scenario ? output?.results[scenario.id] : undefined;
  const ready = !!(sim && screen);
  useEffect(() => {
    if (!ready) return;
    const openSeason = () => {
      const id = window.location.hash.slice(1);
      if (!/^plan-season-S[123]$/.test(id)) return;
      setSelectedSeason(id.slice(-2) as SeasonId);
      setSection("calendar");
      requestAnimationFrame(() => {
        const card = document.getElementById(id);
        card?.scrollIntoView({ block: "nearest" });
        card?.focus({ preventScroll: true });
      });
    };
    const frame = requestAnimationFrame(openSeason);
    window.addEventListener("hashchange", openSeason);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", openSeason); };
  }, [ready, setSection]);

  if (!farm) return <NoFarmState />;
  if (!climate.data && !modelLoading) return <ClimateNotice climate={climate} />;
  if (!sim || !scenario || !screen) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <ClimateNotice climate={climate} />
        <Skeleton className="h-80" />
      </div>
    );
  }
  const years = sim.years;
  const selected = years.find((y) => y.year === selectedYear) ?? years[0];
  const seasonToCheck = selected.waterRisk.worstSeason
    ?? selected.seasons.find((s) => s.risks.includes("risk.dryYear"))?.season;
  const color = scenarioColor(scenario, scenarios.indexOf(scenario));
  const plansForFarm = plans.filter((plan) => plan.scenarioSnapshot.farmId === farm.id);
  const resultsBySlot: Record<string, SeasonResult> = {};
  for (let yi = 0; yi < scenario.cycleYears; yi++) sim.years[yi + 1]?.seasons.forEach((s) => (resultsBySlot[s.slotId] = s));
  if (!selected.isBaselineYear) selected.seasons.forEach((s) => (resultsBySlot[s.slotId] = s));

  const plantingDate = (s: SeasonResult) => new Date(Date.UTC(s.year, s.startOffset - 1, 1));
  const monthAndYear = (d: Date) => `${month(d.getUTCMonth() + 1)} ${d.getUTCFullYear()}`;
  const harvest = (s: SeasonResult) => {
    return monthAndYear(planSeasonPeriod(s)?.end ?? plantingDate(s));
  };

  const summaryText = () => {
    const lines = [
      `Soil Time Machine — ${L("Rotation plan", "Kế hoạch luân canh")}`,
      `${L("Farm", "Trang trại")}: ${farm.name} (${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}, ${farm.areaHa} ha)`,
      `${L("Scenario", "Kịch bản")}: ${scenario.name} · ${L("climate", "khí hậu")}: ${t(`clim.${settings.climateAssumption}`)}`,
      `${L("Generated", "Tạo lúc")}: ${new Date().toISOString().slice(0, 10)}`,
      "",
      ...years.flatMap((y) => [
        `${y.year} — ${L("irrigation", "tưới")} ≈ ${Math.round(y.waterDemand.median)} mm (${Math.round(y.waterDemand.p10)}–${Math.round(y.waterDemand.p90)}), ${L("soil outlook", "triển vọng đất")}: ${y.soilImprovementPotential ? `${num(y.soilImprovementPotential.socTCHa, 2)} t C/ha; ${t("rothc.change", { delta: num(y.soilImprovementPotential.deltaTCHa, 2), rate: num(y.soilImprovementPotential.deltaPctPerYear, 2) })}` : t("status.unavailable")}`,
        ...y.seasons.map(
          (s) =>
            `   ${season(s.season)}: ${crop(s.cropId)}${s.cropId && s.cropId !== "fallow" ? ` · ${monthAndYear(plantingDate(s))} → ${harvest(s)} · ≈${Math.round(s.irrigation.median)} mm` : ""}${s.risks.length ? " · " + s.risks.map((k) => t(k)).join("; ") : ""}`,
        ),
      ]),
      "",
      `${L("Notes", "Ghi chú")}: ${notes || "—"}`,
      "",
      L(
        "This plan is a decision-support scenario, not a substitute for local agronomic advice or field measurements.",
        "Kế hoạch này là kịch bản hỗ trợ ra quyết định, không thay thế tư vấn nông học tại địa phương hay số đo thực địa.",
      ),
      `${L("Data", "Dữ liệu")}: ${climate.data?.source} ${climate.data?.period.join("–")}${usesImerg ? " · GPM IMERG rainfall" : ""} · ${L("values are estimates", "giá trị là ước tính")}.`,
    ];
    return lines.join("\n");
  };

  const download = () => {
    const blob = new Blob([summaryText()], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rotation-plan-${farm.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(L("Plan summary downloaded", "Đã tải bản tóm tắt kế hoạch"));
  };

  const save = () => {
    savePlan({ id: newId("plan"), name: `${scenario.name} · ${new Date().toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB")}`, scenarioId: scenario.id, scenarioSnapshot: scenario, savedAt: new Date().toISOString(), notes });
    toast.success(L("Rotation plan saved on this device", "Đã lưu kế hoạch trên thiết bị này"));
  };

  const showCalendar = (year: number, targetSeason?: SeasonId) => {
    setYear(year);
    if (targetSeason) setSelectedSeason(targetSeason);
    setSection("calendar");
    requestAnimationFrame(() => {
      const showDetails = targetSeason && window.matchMedia("(max-width: 1279px)").matches;
      const target = document.getElementById(showDetails ? `plan-season-${targetSeason}` : "panel-calendar");
      target?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      (showDetails ? target : document.getElementById("tab-calendar"))?.focus({ preventScroll: true });
    });
  };
  const tabs = [
    { id: "calendar", icon: CalendarRange, label: L("Season calendar", "Lịch thời vụ"), tone: "leaf" as const },
    { id: "seasons", icon: Table2, label: L("Each season", "Từng vụ"), tone: "blue" as const },
    { id: "years", icon: ListOrdered, label: L("Each year", "Từng năm"), tone: "teal" as const },
    { id: "notes", icon: NotebookPen, label: L("Notes & saving", "Ghi chú & lưu"), tone: "earth" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-5 no-print">
      <PageHeader
        image="orbital-sunrise"
        icon={CalendarRange}
        eyebrow={L("Season plan", "Kế hoạch mùa vụ")}
        title={<span className="landing-title-gradient">{L("Your season-by-season plan", "Kế hoạch mùa vụ của bạn")}</span>}
        desc={<>{farm.name} · {num(farm.areaHa, 2)} ha · {years[0]?.year}–{years[years.length - 1]?.year} · {t(`clim.${settings.climateAssumption}`)}</>}
        actions={
          <>
            <Link href="/simulator" className={buttonClass("glass", "md")}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {L("Back to simulator", "Về mô phỏng")}
            </Link>
            <Button variant="glass" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              {L("Print year / PDF", "In năm đã chọn / PDF")}
            </Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" aria-hidden />
              {L("Save plan", "Lưu kế hoạch")}
            </Button>
          </>
        }
        meta={<DataChips climate={climate} usesImerg={usesImerg} />}
      />
      <ClimateNotice climate={climate} className="no-print" />

      <Card className="rounded-3xl p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: color }} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-2">{L("Selected rotation", "Luân canh đã chọn")}</p>
              <label className="sr-only" htmlFor="plan-scn">
                {L("Scenario", "Kịch bản")}
              </label>
              <Select
                id="plan-scn"
                value={scenario.id}
                onChange={(e) => {
                  setEditingId(null);
                  setActive(e.target.value);
                }}
                className="mt-0.5 h-11 w-full min-w-0 font-semibold sm:min-w-[240px] no-print"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {draft && <Badge tone="amber" className="mt-1">{L("Unsaved preview", "Bản xem trước chưa lưu")}</Badge>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 no-print">
            <div className="flex items-center rounded-2xl border border-line bg-sand p-1">
              <Button variant="ghost" size="icon" disabled={selected.year === years[0].year} onClick={() => setYear(selected.year - 1)} aria-label={L("Previous plan year", "Năm kế hoạch trước")}><ChevronLeft className="h-4 w-4" aria-hidden /></Button>
              <label className="sr-only" htmlFor="plan-year">{L("Plan year", "Năm kế hoạch")}</label>
              <Select id="plan-year" value={selected.year} onChange={e => setYear(Number(e.target.value))} className="h-10 w-28 border-none bg-transparent text-center text-lg font-bold text-forest">
                {years.map(y => <option key={y.year} value={y.year}>{y.year}</option>)}
              </Select>
              <Button variant="ghost" size="icon" disabled={selected.year === years.at(-1)!.year} onClick={() => setYear(selected.year + 1)} aria-label={L("Next plan year", "Năm kế hoạch tiếp theo")}><ChevronRight className="h-4 w-4" aria-hidden /></Button>
            </div>
            {!editing ? (
              <Button variant="secondary" onClick={() => setEditingId(scenario.id)}>
                <Pencil className="h-4 w-4" aria-hidden />
                {L("Edit crop sequence", "Sửa chuỗi cây trồng")}
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    discardDraft(scenario.id);
                    setEditingId(null);
                  }}
                >
                  <X className="h-4 w-4" aria-hidden />
                  {L("Cancel", "Hủy")}
                </Button>
                <Button
                  onClick={() => {
                    if (draft) upsert(scenario);
                    setEditingId(null);
                    toast.success(L("Crop sequence updated", "Đã cập nhật chuỗi cây trồng"));
                  }}
                >
                  <Save className="h-4 w-4" aria-hidden />
                  {L("Save sequence", "Lưu chuỗi")}
                </Button>
              </>
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-4 border-t border-line pt-4 no-print">
            <RotationBuilder scenario={scenario} onChange={(s) => setDraft({ ...s, name: draft?.name ?? s.name })} screen={screen} resultsBySlot={resultsBySlot} />
          </div>
        )}
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-water-soft text-water-ink"><Droplets className="h-6 w-6" aria-hidden /></span>
            <div><p className="text-xs text-ink-2">{L(`Estimated irrigation in ${selected.year} · whole field`, `Nước tưới ước tính năm ${selected.year} · cả ruộng`)}</p><p className="mt-1 text-2xl font-extrabold text-forest tabular">{num(selected.waterDemand.m3PerHa * farm.areaHa)} <span className="text-sm font-medium text-ink-2">m³ / {L("year", "năm")}</span></p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selected.seasons.map(s => <span key={s.slotId} className="inline-flex items-center gap-1.5 rounded-full bg-sand py-1 pl-1 pr-3 text-xs font-semibold text-ink-2"><CropIcon cropId={s.cropId} size={24} />{crop(s.cropId)}</span>)}
            <StatusBadge status={selected.dataStatus.waterDemand} withTip={false} />
          </div>
        </div>
      </Card>
      </div>

      <Card className="hidden p-4 md:p-5 print:block print:break-inside-avoid print:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{L(`Season plan for ${selected.year}`, `Kế hoạch mùa vụ năm ${selected.year}`)}</h2>
            <p className="mt-1 break-words text-sm text-ink-2">
              {farm.name} · {scenario.name} · {num(farm.areaHa, 2)} ha
            </p>
            {selected.isBaselineYear && <p className="text-xs text-ink-2">{L("Starting year based on your usual crops", "Năm gốc theo các cây thường trồng")}</p>}
            {draft && <p className="text-xs font-semibold text-amber-ink">{L("Unsaved rotation preview", "Bản xem trước cách trồng chưa lưu")}</p>}
          </div>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={selected.dataStatus.waterDemand} withTip={false} />
          <span>{L("Water for the whole field", "Nước tưới cho cả ruộng")} <strong>{num(selected.waterDemand.m3PerHa * farm.areaHa)} m³</strong></span>
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 print:grid-cols-1">
          {selected.seasons.map((s) => (
            <section key={s.slotId}
              className={cn("scroll-mt-20 rounded-xl border p-3 target:ring-2 target:ring-amber print:ring-0", s.season === seasonToCheck ? "border-amber bg-amber-soft/50" : "border-line")}>
              <h3 className="text-xs font-semibold text-ink-2">{season(s.season)}</h3>
              <p className="font-bold">{crop(s.cropId)}</p>
              {s.cropId && s.cropId !== "fallow" && (
                <>
                  <p className="text-sm">{monthAndYear(plantingDate(s))} → {harvest(s)}</p>
                  <p className="text-sm">{L("Estimated irrigation", "Nước tưới ước tính")} <strong>{num(s.irrigation.median * 10 * farm.areaHa)} m³</strong></p>
                </>
              )}
              {s.season === seasonToCheck && (
                <p className="mt-1 text-xs font-semibold text-amber-ink">{L("Check water supply before planting", "Kiểm tra nguồn nước trước khi gieo")}</p>
              )}
              {s.overlap && (
                <p className="mt-1 text-xs font-semibold text-risk-ink">{L("Check dates for overlapping crops", "Kiểm tra lịch vì có vụ chồng lấn")}</p>
              )}
            </section>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-2">
          {L("Confirm dates and seed availability before planting. Water figures are model estimates.", "Xác nhận lịch gieo và nguồn giống trước khi trồng. Lượng nước là ước tính từ mô hình.")}
        </p>
        <p className="mt-1 text-xs text-ink-2">
          {t(`clim.${settings.climateAssumption}`, climateValues(lang, settings.customClimate))} · {climate.data?.source} {climate.data?.period.join("–")}
        </p>
        <FarmDemoNotice className="mt-2" />
      </Card>

      <div className="space-y-5 no-print">
      <SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Plan topics", "Chủ đề kế hoạch")} size="lg" />

      <SectionPanel id="calendar" active={section === "calendar"} keepMounted className="scroll-mt-24">
        <PlanCalendar results={years} selectedYear={selected.year} selectedSeason={selectedSeason} onSelectYear={setYear} onSelectSeason={(year, season) => { setYear(year); setSelectedSeason(season); }} areaHa={farm.areaHa} />
      </SectionPanel>

      <SectionPanel id="seasons" active={section === "seasons"} keepMounted>
        <PlanSeasons result={selected} cycleYears={scenario.cycleYears} areaHa={farm.areaHa} onShowSeason={(year, season) => showCalendar(year, season)} />
      </SectionPanel>

      <SectionPanel id="years" active={section === "years"} keepMounted>
        <PlanYears results={years} selectedYear={selected.year} areaHa={farm.areaHa} onShowYear={showCalendar} />
      </SectionPanel>

      <SectionPanel id="notes" active={section === "notes"} keepMounted>
        <PlanNotes notes={notes} onNotesChange={setNotes} plans={plansForFarm} onSave={save} onDownload={download} onDelete={removePlan}
          onRestore={p => {
            upsert({ ...p.scenarioSnapshot });
            setActive(p.scenarioSnapshot.id);
            setEditingId(null);
            setNotes(p.notes);
            toast.success(L("Plan restored", "Đã khôi phục kế hoạch"));
          }}
          assumptions={[
            `${t(`clim.${settings.climateAssumption}`)}: ${t(`clim.${settings.climateAssumption}.def`, climateValues(lang, settings.customClimate))}`,
            ...(sim.years[1]?.assumptions.map(a => t(a)) ?? []),
            `${L("Seasons follow the Mekong Delta calendar", "Mùa vụ theo lịch ĐBSCL")}: ${(["S1", "S2", "S3"] as const).map(s => `${season(s)} (${SEASONS[s].months.map(month).join("/")})`).join(", ")}.`,
          ]} />
      </SectionPanel>

      <details className="rounded-2xl border border-line bg-white px-4 py-3 text-xs text-ink-2">
        <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Info className="h-4 w-4 text-water-ink" aria-hidden />{L("Sources & estimate assumptions", "Nguồn dữ liệu & cách hiểu ước tính")}</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>{t(`clim.${settings.climateAssumption}`, climateValues(lang, settings.customClimate))} · {climate.data?.source} {climate.data?.period.join("–")}{usesImerg ? " · GPM IMERG" : ""}</p>
          <p>{L("Dates and water needs come from the model. The historical-weather range is not a field accuracy score. Confirm the plan with local measurements and advice.", "Lịch và lượng tưới được tính từ mô hình. Khoảng theo thời tiết lịch sử không phải mức chính xác tại ruộng. Cần đối chiếu số đo và tư vấn địa phương.")}</p>
          <FarmDemoNotice />
        </div>
      </details>
      </div>
    </div>
  );
}
