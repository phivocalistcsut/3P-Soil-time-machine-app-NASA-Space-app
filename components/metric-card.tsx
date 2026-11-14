"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DataStatus } from "@/lib/types";
import { StatusBadge } from "@/components/common";
import { Card, cn } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n";

/** Metric card: title · value+unit · reference period · source · explanation · limitation */
export function MetricCard({
  icon,
  title,
  value,
  unit,
  sub,
  status,
  period,
  source,
  explanation,
  limitation,
  accent = "green",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  status: DataStatus;
  period?: string;
  source: string;
  explanation: string;
  limitation?: string;
  accent?: "green" | "blue" | "amber" | "earth" | "red";
  children?: React.ReactNode;
}) {
  const { L } = useI18n();
  const [open, setOpen] = useState(false);
  const accentCls = {
    green: "bg-mint text-forest",
    blue: "bg-water-soft text-water-ink",
    amber: "bg-amber-soft text-amber-ink",
    earth: "bg-[#F3E9DC] text-earth-ink",
    red: "bg-risk-soft text-risk-ink",
  }[accent];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentCls)}>{icon}</span>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink tabular value-transition">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-ink-2">{unit}</span>}
      </p>
      {sub && <div className="mt-0.5 text-xs text-ink-2">{sub}</div>}
      {children}
      <p className="mt-2 text-xs leading-relaxed text-ink-2">{explanation}</p>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-forest hover:underline"
      >
        {L("Source & limitations", "Nguồn & giới hạn")}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mt-2 space-y-1 rounded-lg bg-sand px-3 py-2 text-[11px] leading-relaxed text-ink-2 animate-fade-in">
          {period && (
            <p>
              <span className="font-semibold text-ink">{L("Reference period", "Giai đoạn tham chiếu")}:</span> {period}
            </p>
          )}
          <p>
            <span className="font-semibold text-ink">{L("Source", "Nguồn")}:</span> {source}
          </p>
          {limitation && (
            <p>
              <span className="font-semibold text-ink">{L("Limitation", "Giới hạn")}:</span> {limitation}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
