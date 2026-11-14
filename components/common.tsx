"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Bean,
  Calculator,
  Carrot,
  CircleSlash,
  Citrus,
  Flower2,
  FlaskConical,
  Languages,
  Leaf,
  Pause,
  Satellite,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Wheat,
  Droplets,
  Info,
} from "lucide-react";
import type { ClimateState } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { getCrop } from "@/lib/data/crops";
import { createDemoFarm } from "@/lib/data/demo";
import type { Confidence, DataStatus, RotationScenario } from "@/lib/types";
import { Badge, buttonClass, cn } from "@/components/ui/primitives";
import { InfoTip, PopoverContent, PopoverRoot, PopoverTrigger } from "@/components/ui/overlays";
import { GLOSSARY_MAP } from "@/lib/data/glossary";

/* ------------------------------ data status ------------------------------ */

const STATUS_STYLE: Record<DataStatus, { tone: "blue" | "green" | "amber" | "neutral"; Icon: typeof Satellite }> = {
  observed: { tone: "blue", Icon: Satellite },
  estimated: { tone: "green", Icon: Calculator },
  illustrative: { tone: "amber", Icon: FlaskConical },
  unavailable: { tone: "neutral", Icon: CircleSlash },
};

export function StatusBadge({ status, className, withTip = true }: { status: DataStatus; className?: string; withTip?: boolean }) {
  const { t } = useI18n();
  const { tone, Icon } = STATUS_STYLE[status];
  return (
    <span className="inline-flex items-center gap-0.5">
      <Badge tone={tone} className={cn("uppercase tracking-wide", className)}>
        <Icon className="h-3 w-3" aria-hidden />
        {t(`status.${status}`)}
      </Badge>
      {withTip && <InfoTip label={t(`status.${status}`)}>{t(`status.${status}.tip`)}</InfoTip>}
    </span>
  );
}

export function ConfidenceBadge({ level }: { level: Confidence }) {
  const { t } = useI18n();
  const bars = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-2" title={t(`conf.${level}`)}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-sm", i <= bars ? "bg-ink-2" : "bg-line")} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {t(`conf.${level}`)}
    </span>
  );
}

/* ------------------------------- risk badges ------------------------------ */

export function StressBadge({ level }: { level: 0 | 1 | 2 | 3 }) {
  const { t } = useI18n();
  const tone = level === 0 ? "green" : level === 1 ? "amber" : "red";
  const Icon = level === 0 ? ShieldCheck : level === 1 ? AlertTriangle : ShieldAlert;
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(`stress.${level}`)}
    </Badge>
  );
}

export function SuitBadge({ cls }: { cls: "good" | "fair" | "poor" }) {
  const { t } = useI18n();
  const tone = cls === "good" ? "green" : cls === "fair" ? "amber" : "red";
  const Icon = cls === "good" ? ShieldCheck : cls === "fair" ? AlertTriangle : ShieldAlert;
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" aria-hidden />
      {t(`suit.${cls}`)}
    </Badge>
  );
}

/** Five bands of modeled annualized SOC change; numeric stock is displayed alongside. */
export function SoilMeter({ level, compact }: { level: 1 | 2 | 3 | 4 | 5; compact?: boolean }) {
  const { t } = useI18n();
  const colors = ["#D97167", "#E4A84C", "#A3ADA8", "#66AD79", "#287043"];
  return (
    <div className="flex flex-col gap-1" role="img" aria-label={t(`soil.${level}`)}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn("rounded-full transition-all duration-300", compact ? "h-1.5 w-5" : "h-2 w-7")}
            style={{ background: i === level ? colors[i - 1] : "#E7E9E3", opacity: i === level ? 1 : 0.9 }}
          />
        ))}
      </div>
      {!compact && <span className="text-xs font-semibold text-ink">{t(`soil.${level}`)}</span>}
    </div>
  );
}

/* --------------------------------- crops --------------------------------- */

const CROP_ICONS = { wheat: Wheat, bean: Bean, sprout: Sprout, leaf: Leaf, flower: Flower2, carrot: Carrot, citrus: Citrus, pause: Pause };

export function CropIcon({ cropId, size = 32, className }: { cropId: string | null; size?: number; className?: string }) {
  const crop = getCrop(cropId);
  const Icon = crop ? CROP_ICONS[crop.icon] : Pause;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-xl", className)}
      style={{ width: size, height: size, background: crop ? `${crop.color}22` : "#EEF0EB", color: crop ? crop.color : "#86938c" }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2.2} />
    </span>
  );
}

/* ------------------------------ scenario color ----------------------------- */

export function scenarioColor(s: Pick<RotationScenario, "kind" | "id"> | undefined, index = 0) {
  if (!s) return "#A3ADA8";
  if (s.kind === "conventional" || s.kind === "fit") return "#B57B38";
  if (s.kind === "water") return "#4A94C7";
  if (s.kind === "soil") return "#287043";
  return ["#7D5BA6", "#B5657A", "#3F7F8C"][index % 3];
}

export function ScenarioDot({ scenario, index }: { scenario: RotationScenario; index?: number }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: scenarioColor(scenario, index) }} aria-hidden />;
}

/* ---------------------------------- logo ---------------------------------- */

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const { L } = useI18n();
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="Soil Time Machine">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        {/* planet + soil layers, a sprout, and an orbit */}
        <circle cx="17" cy="17" r="11" fill={light ? "#0A121C" : "#163A2C"} stroke={light ? "#A8DC5C" : "#163A2C"} strokeWidth="1.2" />
        <path d="M7.6 20h18.8" stroke="#C49B6C" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M9.6 23.6h14.8" stroke="#C49B6C" strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
        <path d="M17 20v-7.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M17 14.6c0-2.7 2.1-4.3 4.9-4.1.2 2.8-2 4.8-4.9 4.1Z" fill="#8DC63F" />
        <path d="M17 16.6c0-2.1-1.7-3.4-3.9-3.2-.1 2.2 1.6 3.8 3.9 3.2Z" fill="#A8DC5C" />
        <ellipse cx="17" cy="17" rx="16" ry="5.2" transform="rotate(-22 17 17)" fill="none" stroke="#8DC63F" strokeWidth="1.1" strokeDasharray="0 0" opacity=".9" />
        <circle cx="31.2" cy="11.2" r="1.6" fill="#A8DC5C" />
      </svg>
      <span className={cn("font-display text-[15px] font-extrabold uppercase leading-none tracking-wide", light ? "text-white" : "text-ink")}>
        Soil Time Machine
        <span className={cn("mt-1 block text-[10px] font-medium normal-case tracking-[0.08em]", light ? "text-lime-bright/80" : "text-ink-3")}>
          {L("Crop rotation futures", "Tương lai luân canh")}
        </span>
      </span>
    </Link>
  );
}

/* -------------------------------- language -------------------------------- */

export function LanguageSwitcher({ className, dark }: { className?: string; dark?: boolean }) {
  const lang = useApp((s) => s.lang);
  const setLang = useApp((s) => s.setLang);
  return (
    <div
      role="group"
      aria-label="Language / Ngôn ngữ"
      className={cn("inline-flex items-center rounded-full border p-0.5 text-xs font-semibold", dark ? "border-white/20 bg-white/5" : "border-line bg-white", className)}
    >
      <Languages className={cn("mx-1.5 h-3.5 w-3.5", dark ? "text-lime-bright" : "text-ink-3")} aria-hidden />
      {(["en", "vi"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "h-7 min-w-9 rounded-full px-2.5 transition-colors",
            lang === l ? (dark ? "bg-lime text-space-900" : "bg-space-900 text-white") : dark ? "text-white/80 hover:text-white" : "text-ink-2 hover:text-ink",
          )}
        >
          {l === "en" ? "EN" : "VI"}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ data notices ------------------------------ */

export function ClimateNotice({ climate, className }: { climate: ClimateState; className?: string }) {
  const { L } = useI18n();
  if (!climate.data) return climate.loading ? null : (
    <div role="status" className={cn("rounded-xl border border-line bg-white p-4 text-sm text-ink-2", className)}>
      <p className="font-semibold text-ink">{L("Climate data is unavailable for this location.", "Chưa có dữ liệu khí hậu cho vị trí này.")}</p>
      <p className="mt-1">{climate.fallbackReason === "offline"
        ? L("Switch to live data in Settings to load this farm’s history.", "Bật dữ liệu trực tuyến trong Cài đặt để tải lịch sử của ruộng.")
        : L("Refresh to try again, or check the farm coordinates. Rotation scores need climate history.", "Tải lại để thử lại hoặc kiểm tra tọa độ ruộng. Cần lịch sử khí hậu để tính điểm luân canh.")}</p>
      <div className="mt-2 flex flex-wrap gap-2 no-print">
        {climate.fallbackReason !== "offline" && <button className={buttonClass("outline", "sm")} onClick={() => window.location.reload()}>{L("Try again", "Thử lại")}</button>}
        <Link href={climate.fallbackReason === "offline" ? "/settings" : "/setup"} className={buttonClass("outline", "sm")}>
          {climate.fallbackReason === "offline" ? L("Settings", "Cài đặt") : L("Check location", "Kiểm tra vị trí")}
        </Link>
      </div>
    </div>
  );
  const d = climate.data;
  if (d.status === "illustrative") {
    return (
      <div role="note" className={cn("flex items-start gap-2.5 rounded-xl border border-amber/50 bg-amber-soft px-3.5 py-2.5 text-xs text-amber-ink", className)}>
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          <strong className="font-semibold">{L("Illustrative Demo Data — Not Real Satellite Measurements.", "Dữ liệu demo minh họa — Không phải số đo vệ tinh thật.")}</strong>{" "}
          {climate.fallbackReason === "offline"
            ? L("Offline mode is on and no cached NASA data exists for this location.", "Đang ở chế độ ngoại tuyến và chưa có dữ liệu NASA lưu sẵn cho vị trí này.")
            : L("Live NASA POWER data could not be loaded", "Không tải được dữ liệu NASA POWER trực tuyến") + (climate.fallbackReason ? ` (${climate.fallbackReason}).` : ".")}
        </p>
      </div>
    );
  }
  return null;
}

const chip = "inline-flex h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 text-[11.5px] font-medium text-white/85 backdrop-blur";

/** Compact data-provenance chips for the dark page header: demo flag, climate cache date, rain source. */
export function DataChips({ climate, usesImerg }: { climate?: ClimateState; usesImerg?: boolean }) {
  const { L } = useI18n();
  const farm = useApp((s) => s.farm);
  const d = climate?.data;
  return (
    <>
      {farm?.isDemo && (
        <span className={cn(chip, "border-amber/50 text-amber")}>
          <FlaskConical className="h-3.5 w-3.5" aria-hidden />
          {L("Demo farm", "Trang trại mẫu")}
          <InfoTip label={L("About the demo farm", "Về trang trại mẫu")} className="-mr-1 text-amber hover:bg-white/10 hover:text-white">
            {L(
              "Farm details are illustrative. Soil values carry their own source labels. Climate comes from real NASA POWER data for this location.",
              "Thông tin ruộng là minh họa. Giá trị đất có nhãn nguồn riêng. Khí hậu lấy từ dữ liệu NASA POWER thật tại vị trí này.",
            )}
          </InfoTip>
        </span>
      )}
      {d?.cached && d.status !== "illustrative" && (
        <span className={chip}>
          <Info className="h-3.5 w-3.5 text-water" aria-hidden />
          {L(`NASA POWER · saved ${d.retrievedAt.slice(0, 10)}`, `NASA POWER · lưu ngày ${d.retrievedAt.slice(0, 10)}`)}
        </span>
      )}
      {usesImerg !== undefined && (
        <Link href="/overview#sources" className={cn(chip, "hover:border-lime hover:text-white")}>
          <Satellite className="h-3.5 w-3.5 text-lime-bright" aria-hidden />
          {usesImerg ? L("Rain: GPM IMERG · climate: NASA POWER", "Mưa: GPM IMERG · khí hậu: NASA POWER") : L("Rain & climate: NASA POWER", "Mưa & khí hậu: NASA POWER")}
        </Link>
      )}
    </>
  );
}

export function FarmDemoNotice({ className }: { className?: string }) {
  const { L } = useI18n();
  const farm = useApp((s) => s.farm);
  if (!farm?.isDemo) return null;
  return (
    <div className={cn("flex items-center gap-2 rounded-xl bg-amber-soft px-3 py-2 text-xs text-amber-ink", className)}>
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {L(
          "Demo farm: farm details are illustrative. Soil values carry their own source labels. Climate comes from real NASA POWER data for this location.",
          "Trang trại mẫu: thông tin ruộng là minh họa. Giá trị đất có nhãn nguồn riêng. Khí hậu lấy từ dữ liệu NASA POWER thật tại vị trí này.",
        )}
      </span>
    </div>
  );
}

export function Disclaimer({ className }: { className?: string }) {
  const { L } = useI18n();
  return (
    <p className={cn("flex items-start gap-2 text-xs text-ink-2", className)}>
      <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {L(
        "This plan is a decision-support scenario, not a substitute for local agronomic advice or field measurements.",
        "Kế hoạch này là kịch bản hỗ trợ ra quyết định, không thay thế tư vấn nông học tại địa phương hay số đo thực địa.",
      )}
    </p>
  );
}

export function NoFarmState() {
  const { L } = useI18n();
  const setFarm = useApp((s) => s.setFarm);
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lime-soft text-lime-ink">
        <Sprout className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="text-xl font-bold">{L("No farm profile yet", "Chưa có hồ sơ trang trại")}</h2>
      <p className="mt-2 text-sm text-ink-2">
        {L(
          "Set up your farm in a few steps, or open the Mekong Delta demo farm to explore right away.",
          "Thiết lập trang trại của bạn trong vài bước, hoặc mở trang trại mẫu ở Đồng bằng sông Cửu Long để khám phá ngay.",
        )}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button className={buttonClass("primary")} onClick={() => setFarm(createDemoFarm())}>
          <Droplets className="h-4 w-4" aria-hidden />
          {L("Open demo farm", "Mở trang trại mẫu")}
        </button>
        <Link className={buttonClass("outline")} href="/setup">
          {L("Set up my farm", "Thiết lập trang trại")}
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ glossary term ------------------------------ */

/** A word with a dotted underline; tap it for a plain-language explanation (U3). */
export function Term({ id, children, className }: { id: string; children?: React.ReactNode; className?: string }) {
  const { lang, L } = useI18n();
  const g = GLOSSARY_MAP[id];
  if (!g) return <>{children}</>;
  return (
    <PopoverRoot>
      <PopoverTrigger
        className={cn("cursor-help rounded-sm underline decoration-dotted decoration-[1.5px] underline-offset-[3px] hover:decoration-lime-ink", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children ?? g.term[lang]}
      </PopoverTrigger>
      <PopoverContent className="w-[290px] text-xs leading-relaxed" align="start">
        <p className="text-sm font-semibold text-ink">{g.term[lang]}</p>
        <p className="mt-1 text-ink-2">{g.short[lang]}</p>
        <Link href="/learn#glossary" className="mt-2 inline-block font-semibold text-lime-ink hover:underline">
          {L("More in the Guide →", "Xem thêm trong Hướng dẫn →")}
        </Link>
      </PopoverContent>
    </PopoverRoot>
  );
}
