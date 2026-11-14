"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarRange, Download, FolderOpen, ListOrdered, NotebookPen, Pencil, Printer, Save, Table2, Trash2, X } from "lucide-react";
import { PageHeader, SectionPanel, SectionTabs, useSection } from "@/components/ui/sections";
import { climateValues, useI18n } from "@/lib/i18n";
import { SoilCarbon } from "@/components/sim/soil-carbon";
import { useApp } from "@/lib/store";
import { useEngine, useScenarios } from "@/lib/hooks";
import { getCrop, SEASONS } from "@/lib/data/crops";
import { newId } from "@/lib/data/demo";
import { screenCrops } from "@/lib/engine/simulate";
import type { SeasonResult } from "@/lib/types";
import { ClimateNotice, DataChips, CropIcon, Disclaimer, FarmDemoNotice, NoFarmState, scenarioColor, StatusBadge, StressBadge, SuitBadge } from "@/components/common";
import { Badge, Button, Card, CardHeader, Select, Skeleton, buttonClass, cn } from "@/components/ui/primitives";
import { toast } from "@/components/ui/overlays";
import { RotationGantt } from "@/components/sim/timeline";
import { RotationBuilder } from "@/components/sim/rotation-builder";

export function Planner() {
  const { L, t, num, crop, season, month, lang } = useI18n();
  const [section, setSection] = useSection("planner", ["calendar", "seasons", "years", "notes"], "calendar");
  const tol = (x: "high" | "moderate" | "low") => ({ high: L("high", "cao"), moderate: L("moderate", "vừa"), low: L("low", "thấp") })[x];
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
      const card = document.getElementById(id);
      card?.scrollIntoView({ block: "start" });
      card?.focus({ preventScroll: true });
    };
    openSeason();
    window.addEventListener("hashchange", openSeason);
    return () => window.removeEventListener("hashchange", openSeason);
  }, [ready]);

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
    return monthAndYear(new Date(plantingDate(s).getTime() + s.durationDays * 86400000));
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
    savePlan({ id: newId("plan"), name: `${scenario.name} · ${new Date().toLocaleDateString()}`, scenarioId: scenario.id, scenarioSnapshot: scenario, savedAt: new Date().toISOString(), notes });
    toast.success(L("Rotation plan saved on this device", "Đã lưu kế hoạch trên thiết bị này"));
  };

  const firstCycle = sim.years.slice(1, 1 + scenario.cycleYears);
  const tabs = [
    { id: "calendar", icon: CalendarRange, label: L("Season calendar", "Lịch thời vụ"), hint: L("Planting to harvest", "Từ gieo đến thu hoạch"), tone: "leaf" as const },
    { id: "seasons", icon: Table2, label: L("Each season", "Từng vụ"), hint: L("Needs, water, risks", "Yêu cầu, nước, rủi ro"), tone: "blue" as const },
    { id: "years", icon: ListOrdered, label: L("Each year", "Từng năm"), hint: L("Water and soil outlook", "Nước và triển vọng đất"), tone: "teal" as const },
    { id: "notes", icon: NotebookPen, label: L("Notes & saving", "Ghi chú & lưu"), hint: L("Assumptions, saved plans", "Giả định, kế hoạch đã lưu"), tone: "earth" as const },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-5 no-print">
      <PageHeader
        image="orbital-sunrise"
        icon={CalendarRange}
        eyebrow={L("Season plan", "Kế hoạch mùa vụ")}
        title={L("Your season-by-season plan", "Kế hoạch từng vụ của bạn")}
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

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ background: color }} aria-hidden />
            <div>
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
                className="mt-0.5 h-10 min-w-[240px] font-semibold no-print"
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
          <div className="flex flex-wrap gap-2 no-print">
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
      </Card>
      </div>

      <Card className="p-4 md:p-5 print:break-inside-avoid print:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">{L(`Season plan for ${selected.year}`, `Kế hoạch mùa vụ năm ${selected.year}`)}</h2>
            <p className="mt-1 break-words text-sm text-ink-2">
              {farm.name} · {scenario.name} · {num(farm.areaHa, 2)} ha
            </p>
            {selected.isBaselineYear && <p className="text-xs text-ink-2">{L("Starting year based on your usual crops", "Năm gốc theo các cây thường trồng")}</p>}
            {draft && <p className="text-xs font-semibold text-amber-ink">{L("Unsaved rotation preview", "Bản xem trước cách trồng chưa lưu")}</p>}
          </div>
          <label className="text-xs font-semibold text-ink-2 no-print">
            {L("Plan year", "Năm kế hoạch")}
            <Select value={selected.year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 min-w-24">
              {years.map((y) => <option key={y.year} value={y.year}>{y.year}</option>)}
            </Select>
          </label>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <StatusBadge status={selected.dataStatus.waterDemand} withTip={false} />
          <span>{L("Water for the whole field", "Nước tưới cho cả ruộng")} <strong>{num(selected.waterDemand.m3PerHa * farm.areaHa)} m³</strong></span>
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 print:grid-cols-1">
          {selected.seasons.map((s) => (
            <section key={s.slotId} id={`plan-season-${s.season}`} tabIndex={-1}
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
      <SectionTabs tabs={tabs} value={section} onChange={setSection} label={L("Plan topics", "Chủ đề kế hoạch")} />

      <SectionPanel id="calendar" active={section === "calendar"} keepMounted>
      <Card>
        <CardHeader title={L("Seasonal crop calendar", "Lịch thời vụ")} subtitle={L("Planting to harvest across the plan horizon", "Từ gieo đến thu hoạch trong suốt kế hoạch")} actions={<StatusBadge status="estimated" withTip={false} />} />
        <div className="px-4 pb-4 pt-3">
          <RotationGantt results={years} selectedYear={selectedYear} onSelect={setYear} />
        </div>
      </Card>
      </SectionPanel>

      <SectionPanel id="seasons" active={section === "seasons"} keepMounted>
      <Card className="overflow-hidden">
        <CardHeader
          title={L("Season-by-season plan", "Kế hoạch từng vụ")}
          subtitle={L(`One rotation cycle (${scenario.cycleYears} yr) — repeats across the horizon`, `Một chu kỳ luân canh (${scenario.cycleYears} năm) — lặp lại trong suốt giai đoạn`)}
        />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-2">
                {[
                  L("Season", "Vụ"),
                  L("Crop", "Cây trồng"),
                  L("Calendar", "Lịch"),
                  L("Agronomic requirements", "Yêu cầu nông học"),
                  L("Water demand", "Nhu cầu nước"),
                  L("Potential soil benefits", "Lợi ích cho đất"),
                  L("Known risk factors", "Yếu tố rủi ro"),
                ].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firstCycle.flatMap((y, yi) =>
                y.seasons.map((s) => {
                  const c = getCrop(s.cropId);
                  return (
                    <tr key={s.slotId} className="border-t border-line align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold">{season(s.season)}</p>
                        <p className="text-xs text-ink-3">{L(`Cycle year ${yi + 1}`, `Năm ${yi + 1} của chu kỳ`)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <CropIcon cropId={s.cropId} size={28} />
                          <span className="font-semibold">{crop(s.cropId)}</span>
                        </span>
                        {c && c.id !== "fallow" && (
                          <span className="mt-1 block">
                            <SuitBadge cls={s.suitability.cls} />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {c ? (
                          <>
                            {monthAndYear(plantingDate(s))} → {harvest(s)}
                            <span className="block text-ink-3">
                              {c.growingDuration} {L("days", "ngày")}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-2">
                        {c && c.id !== "fallow" ? (
                          <ul className="space-y-0.5">
                            <li>
                              {L("Temperature", "Nhiệt độ")} {c.temperatureRange.optMin}–{c.temperatureRange.optMax} °C
                            </li>
                            <li>pH {c.phRange.min}–{c.phRange.max}</li>
                            <li>
                              {L("Waterlogging tolerance", "Chịu ngập")}: {tol(c.waterloggingTolerance)}
                            </li>
                            <li>
                              {L("Typical N", "Đạm điển hình")} ≈ {c.nitrogenNeed} kg/ha → {L("this plan", "kế hoạch này")} {num(s.nitrogenNet)}
                            </li>
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {c && c.id !== "fallow" ? (
                          <>
                            <Badge tone={c.waterRequirement === "low" ? "green" : c.waterRequirement === "moderate" ? "neutral" : "blue"}>{t(`water.${c.waterRequirement}`)}</Badge>
                            <span className="mt-1 block tabular">
                              ≈ {num(s.irrigation.median)} mm ({num(s.irrigation.p10)}–{num(s.irrigation.p90)})
                            </span>
                            <span className="mt-1 block">
                              <StressBadge level={s.stressLevel} />
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-ink-2">{c ? c.agronomicProperties.note[lang] : "—"}</td>
                      <td className="px-3 py-3 text-xs">
                        {s.risks.length ? (
                          <ul className="space-y-0.5 text-risk-ink">
                            {s.risks.map((k) => (
                              <li key={k}>• {t(k)}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-ink-3">{L("None flagged", "Không có")}</span>
                        )}
                      </td>
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </SectionPanel>

      <SectionPanel id="years" active={section === "years"} keepMounted>
        <Card>
          <CardHeader title={L("Year-by-year outlook", "Triển vọng từng năm")} />
          <div className="overflow-x-auto px-2 pb-3 pt-2">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-2">
                  <th className="px-3 py-2">{L("Year", "Năm")}</th>
                  <th className="px-3 py-2">{L("Irrigation (mm)", "Tưới (mm)")}</th>
                  <th className="px-3 py-2">{L("Water stress", "Thiếu nước")}</th>
                  <th className="px-3 py-2">{L("Soil outlook", "Triển vọng đất")}</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y.year} className={cn("border-t border-line", y.year === selectedYear && "bg-mint/40")}>
                    <td className="px-3 py-2 font-semibold tabular">{y.year}</td>
                    <td className="px-3 py-2 tabular">
                      {num(y.waterDemand.median)} <span className="text-xs text-ink-3">({num(y.waterDemand.p10)}–{num(y.waterDemand.p90)})</span>
                    </td>
                    <td className="px-3 py-2">
                      <StressBadge level={y.waterRisk.level} />
                    </td>
                    <td className="px-3 py-2">
                      <SoilCarbon result={y} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </SectionPanel>

      <SectionPanel id="notes" active={section === "notes"} keepMounted>
        <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold">{L("Assumptions", "Giả định")}</h2>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-2">
            <li>
              • {t(`clim.${settings.climateAssumption}`)}: {t(`clim.${settings.climateAssumption}.def`, climateValues(lang, settings.customClimate))}
            </li>
            {sim.years[1]?.assumptions.map((a) => (
              <li key={a}>• {t(a)}</li>
            ))}
            <li>
              • {L("Seasons follow the Mekong Delta calendar", "Mùa vụ theo lịch ĐBSCL")}: {(["S1", "S2", "S3"] as const).map((s) => `${season(s)} (${SEASONS[s].months.map(month).join("/")})`).join(", ")}.
            </li>
          </ul>
          <label htmlFor="notes" className="mt-4 block text-sm font-medium">
            {L("Notes for this plan", "Ghi chú cho kế hoạch")}
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm focus:border-water focus:outline-none focus:ring-2 focus:ring-water/20"
            placeholder={L("e.g. ask extension officer about mung bean seed", "VD: hỏi cán bộ khuyến nông về giống đậu xanh")}
          />
          <Disclaimer className="mt-4 rounded-xl bg-amber-soft px-3 py-2.5 text-amber-ink" />
        </Card>
      <Card className="no-print">
        <CardHeader title={L("Saved plans on this device", "Kế hoạch đã lưu trên thiết bị")} icon={<FolderOpen className="h-4 w-4" aria-hidden />} />
        <div className="px-5 pb-5 pt-3">
          {plansForFarm.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-2">
              {L("No saved plans yet. Use “Save plan” to keep a snapshot of this rotation.", "Chưa có kế hoạch nào. Dùng “Lưu kế hoạch” để giữ lại bản chụp luân canh này.")}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {plansForFarm.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-ink-3">
                      {new Date(p.savedAt).toLocaleString()} {p.notes && `· ${p.notes.slice(0, 60)}`}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        upsert({ ...p.scenarioSnapshot });
                        setActive(p.scenarioSnapshot.id);
                        setEditingId(null);
                        setNotes(p.notes);
                        toast.success(L("Plan restored", "Đã khôi phục kế hoạch"));
                      }}
                    >
                      {L("Open", "Mở")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removePlan(p.id)} aria-label={L("Delete plan", "Xóa kế hoạch")}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
          <div className="lg:col-span-2 flex flex-wrap gap-2 no-print">
            <Button variant="outline" onClick={download}>
              <Download className="h-4 w-4" aria-hidden />
              {L("Download text summary", "Tải bản tóm tắt dạng chữ")}
            </Button>
          </div>
        </div>
      </SectionPanel>
      </div>
    </div>
  );
}
