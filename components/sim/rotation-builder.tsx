"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, Droplets, GripVertical, Minus, Plus, Sprout, Trash2, Waves } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CROPS, SEASONS, SEASON_ORDER, getCrop } from "@/lib/data/crops";
import { newId } from "@/lib/data/demo";
import type { RotationScenario, SeasonId, SeasonResult, SeasonalCropSlot } from "@/lib/types";
import { CropIcon } from "@/components/common";
import { Badge, Button, Select, cn } from "@/components/ui/primitives";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlays";

export type ScreenResult = Record<SeasonId, { cropId: string; suitability: number; irrigation: number }[]>;

const waterTone = { very_high: "blue", high: "blue", moderate: "neutral", low: "green", none: "neutral" } as const;

function SlotCard({
  slot,
  result,
  screen,
  onChange,
  onClear,
}: {
  slot: SeasonalCropSlot;
  result?: SeasonResult;
  screen: ScreenResult;
  onChange: (s: SeasonalCropSlot) => void;
  onClear: () => void;
}) {
  const { L, t, crop, season, month, num } = useI18n();
  const c = getCrop(slot.cropId);
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef: dragRef, transform, isDragging } = useDraggable({ id: slot.id, data: { slot } });
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: `drop-${slot.yearIndex}-${slot.season}`, data: { yearIndex: slot.yearIndex, season: slot.season } });
  const options = screen[slot.season] ?? [];
  const overlap = result?.overlap;

  return (
    <div ref={dropRef} className={cn("rounded-2xl transition-colors", isOver && "bg-mint/60 ring-2 ring-leaf")}>
      <div
        ref={dragRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        className={cn(
          "group relative flex h-full flex-col rounded-2xl border bg-white p-3 transition-shadow duration-200",
          isDragging ? "z-20 shadow-[var(--shadow-float)] opacity-90" : "hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
          overlap ? "border-risk" : "border-line",
          !c && "border-dashed bg-sand/60",
        )}
      >
        <div className="flex items-start gap-2">
          <button
            {...listeners}
            {...attributes}
            className="mt-1 cursor-grab touch-none rounded p-0.5 text-ink-3 hover:bg-sand-2 hover:text-ink active:cursor-grabbing"
            aria-label={L(`Drag ${crop(slot.cropId)} to another season`, `Kéo ${crop(slot.cropId)} sang vụ khác`)}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <PopoverRoot open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left" aria-label={L(`Edit ${season(slot.season)} crop`, `Sửa cây vụ ${season(slot.season)}`)}>
              <CropIcon cropId={slot.cropId} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{c ? crop(c.id) : L("Empty — add crop", "Trống — thêm cây")}</span>
                <span className="block text-[11px] text-ink-2">
                  {season(slot.season)} · {L("plant", "gieo")} {month(slot.plantingMonth)}
                </span>
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-[300px]" align="start">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-2">
                {season(slot.season)} · {L("choose crop", "chọn cây")}
              </p>
              <div className="max-h-[260px] space-y-1 overflow-auto pr-1">
                {CROPS.map((cc) => {
                  const sc = options.find((o) => o.cropId === cc.id);
                  const fit = sc?.suitability;
                  return (
                    <button
                      key={cc.id}
                      onClick={() => {
                        onChange({ ...slot, cropId: cc.id });
                        setOpen(false);
                      }}
                      className={cn("flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-mint/50", slot.cropId === cc.id && "bg-mint")}
                    >
                      <CropIcon cropId={cc.id} size={26} />
                      <span className="flex-1">
                        <span className="block font-medium">{crop(cc.id)}</span>
                        <span className="block text-[10.5px] text-ink-2">
                          {t(`water.${cc.waterRequirement}`)} · {cc.growingDuration} {L("days", "ngày")}
                          {sc && cc.id !== "fallow" ? ` · ≈${num(sc.irrigation)} mm` : ""}
                        </span>
                      </span>
                      {fit !== undefined && cc.id !== "fallow" && (
                        <Badge tone={fit >= 75 ? "green" : fit >= 50 ? "amber" : "red"} title={L("Climate & soil fit (0–100)", "Mức phù hợp khí hậu & đất (0–100)")}>
                          {num(fit)}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-end gap-2 border-t border-line pt-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-2" htmlFor={`pm-${slot.id}`}>
                    {L("Planting month", "Tháng gieo trồng")}
                  </label>
                  <Select id={`pm-${slot.id}`} value={slot.plantingMonth} onChange={(e) => onChange({ ...slot, plantingMonth: Number(e.target.value) })} className="h-9">
                    {SEASONS[slot.season].months.map((m) => (
                      <option key={m} value={m}>
                        {month(m)}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {L("Remove", "Bỏ")}
                </Button>
              </div>
            </PopoverContent>
          </PopoverRoot>
        </div>
        {c && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            <Badge tone={waterTone[c.waterRequirement]}>
              <Droplets className="h-3 w-3" aria-hidden />
              {t(`water.${c.waterRequirement}`)}
            </Badge>
            <Badge tone="outline">≈ {num(c.growingDuration / 30.4, 1)} {L("mo", "th")}</Badge>
            {c.agronomicProperties.nFixing && (
              <Badge tone="green">
                <Sprout className="h-3 w-3" aria-hidden />
                {L("Fixes N", "Cố định đạm")}
              </Badge>
            )}
            {c.flooded && (
              <Badge tone="blue">
                <Waves className="h-3 w-3" aria-hidden />
                {L("Flooded", "Ngập nước")}
              </Badge>
            )}
          </div>
        )}
        {c && result && c.id !== "fallow" && (
          <p className="mt-2 text-[11px] text-ink-2 tabular">
            ≈ {num(result.irrigation.median)} mm {L("irrigation", "tưới")} · {L("fit", "phù hợp")} {num(result.suitability.score)}/100
          </p>
        )}
        {overlap && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-risk-ink">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            {L("Overlaps next crop — change planting month", "Chồng lấn vụ sau — đổi tháng gieo")}
          </p>
        )}
      </div>
    </div>
  );
}

export function RotationBuilder({
  scenario,
  onChange,
  screen,
  resultsBySlot,
}: {
  scenario: RotationScenario;
  onChange: (s: RotationScenario) => void;
  screen: ScreenResult;
  resultsBySlot: Record<string, SeasonResult>;
}) {
  const { L, season, month } = useI18n();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));
  const getSlot = (yi: number, s: SeasonId): SeasonalCropSlot =>
    scenario.seasonalCropSequence.find((x) => x.yearIndex === yi && x.season === s) ?? {
      id: `virtual-${yi}-${s}`,
      yearIndex: yi,
      season: s,
      cropId: null,
      plantingMonth: SEASONS[s].defaultMonth,
    };

  const setSlot = (slot: SeasonalCropSlot) => {
    const exists = scenario.seasonalCropSequence.some((x) => x.yearIndex === slot.yearIndex && x.season === slot.season);
    const real = slot.id.startsWith("virtual-") ? { ...slot, id: newId("slot") } : slot;
    onChange({
      ...scenario,
      seasonalCropSequence: exists
        ? scenario.seasonalCropSequence.map((x) => (x.yearIndex === slot.yearIndex && x.season === slot.season ? real : x))
        : [...scenario.seasonalCropSequence, real],
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const from = e.active.data.current?.slot as SeasonalCropSlot | undefined;
    const to = e.over?.data.current as { yearIndex: number; season: SeasonId } | undefined;
    if (!from || !to || (from.yearIndex === to.yearIndex && from.season === to.season)) return;
    const target = getSlot(to.yearIndex, to.season);
    const a: SeasonalCropSlot = { ...from, cropId: target.cropId };
    const b: SeasonalCropSlot = { ...target, cropId: from.cropId };
    // keep each season's planting month valid
    const fix = (s: SeasonalCropSlot) => (SEASONS[s.season].months.includes(s.plantingMonth) ? s : { ...s, plantingMonth: SEASONS[s.season].defaultMonth });
    let seq = scenario.seasonalCropSequence.filter(
      (x) => !(x.yearIndex === from.yearIndex && x.season === from.season) && !(x.yearIndex === to.yearIndex && x.season === to.season),
    );
    seq = [...seq, fix({ ...a, id: a.id.startsWith("virtual-") ? newId("slot") : a.id }), fix({ ...b, id: b.id.startsWith("virtual-") ? newId("slot") : b.id })];
    onChange({ ...scenario, seasonalCropSequence: seq });
  };

  const addYear = () => {
    if (scenario.cycleYears >= 3) return;
    const yi = scenario.cycleYears;
    const copy = scenario.seasonalCropSequence.filter((x) => x.yearIndex === yi - 1).map((x) => ({ ...x, id: newId("slot"), yearIndex: yi }));
    onChange({ ...scenario, cycleYears: yi + 1, seasonalCropSequence: [...scenario.seasonalCropSequence, ...copy] });
  };
  const removeYear = () => {
    if (scenario.cycleYears <= 1) return;
    const yi = scenario.cycleYears - 1;
    onChange({ ...scenario, cycleYears: yi, seasonalCropSequence: scenario.seasonalCropSequence.filter((x) => x.yearIndex !== yi) });
  };

  return (
    <div>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))] gap-2 pb-1.5 text-xs font-semibold text-ink-2">
              <span />
              {SEASON_ORDER.map((s) => (
                <span key={s} className="px-1">
                  {season(s)}
                  <span className="ml-1 font-normal text-ink-3">
                    {SEASONS[s].months.map((m) => month(m)).join(" · ")}
                  </span>
                </span>
              ))}
            </div>
            {Array.from({ length: scenario.cycleYears }, (_, yi) => (
              <div key={yi} className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))] gap-2 py-1">
                <div className="flex flex-col justify-center rounded-xl bg-sand px-2 text-center">
                  <span className="text-[10px] font-semibold uppercase text-ink-3">{L("Cycle", "Chu kỳ")}</span>
                  <span className="text-sm font-bold">{L(`Year ${yi + 1}`, `Năm ${yi + 1}`)}</span>
                </div>
                {SEASON_ORDER.map((s) => {
                  const slot = getSlot(yi, s);
                  return (
                    <SlotCard
                      key={`${yi}-${s}`}
                      slot={slot}
                      result={resultsBySlot[slot.id]}
                      screen={screen}
                      onChange={setSlot}
                      onClear={() => setSlot({ ...slot, cropId: null })}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DndContext>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={addYear} disabled={scenario.cycleYears >= 3}>
          <Plus className="h-4 w-4" aria-hidden />
          {L("Add a year to the cycle", "Thêm một năm vào chu kỳ")}
        </Button>
        <Button variant="ghost" size="sm" onClick={removeYear} disabled={scenario.cycleYears <= 1}>
          <Minus className="h-4 w-4" aria-hidden />
          {L("Remove last year", "Bớt năm cuối")}
        </Button>
        <span className="text-xs text-ink-2">
          {L(
            `The ${scenario.cycleYears}-year cycle repeats across the horizon. Drag cards to swap seasons; click a card to change crop or planting month.`,
            `Chu kỳ ${scenario.cycleYears} năm lặp lại trong suốt giai đoạn. Kéo thẻ để đổi vụ; bấm vào thẻ để đổi cây hoặc tháng gieo.`,
          )}
        </span>
      </div>
    </div>
  );
}
