"use client";

import { FlaskConical } from "lucide-react";
import { getCrop } from "@/lib/data/crops";
import { useI18n } from "@/lib/i18n";
import type { SimulationResult } from "@/lib/types";

/**
 * ILLUSTRATIVE soil-future diagram. Three columns = the three seasons of the selected
 * year (canopy, ponding water, rooting depth from the crop catalog). The shared topsoil
 * band's tone follows the RothC SOC-change level. Not to scale; not a measured profile.
 */
const TOPSOIL = ["#B9A48A", "#9E8466", "#86684A", "#6B4F33", "#523A22"];

function Canopy({ cropId, x, w, ground }: { cropId: string | null; x: number; w: number; ground: number }) {
  const c = getCrop(cropId);
  if (!c || c.id === "fallow") {
    return (
      <g>
        {[0.2, 0.45, 0.7].map((f) => (
          <path key={f} d={`M${x + w * f} ${ground} q 3 -6 6 0`} stroke="#A3ADA8" strokeWidth="1.5" fill="none" />
        ))}
      </g>
    );
  }
  const n = 6;
  const items = Array.from({ length: n }, (_, i) => x + (w / (n + 1)) * (i + 1));
  if (c.category === "cereal" && c.id === "rice") {
    return (
      <g stroke={c.color} strokeWidth="1.6" strokeLinecap="round" fill="none">
        {items.map((cx) => (
          <g key={cx}>
            <path d={`M${cx} ${ground} L${cx - 4} ${ground - 30}`} />
            <path d={`M${cx} ${ground} L${cx} ${ground - 36}`} />
            <path d={`M${cx} ${ground} L${cx + 5} ${ground - 28}`} />
            <path d={`M${cx} ${ground - 36} q 5 4 7 12`} stroke="#C9A86A" />
          </g>
        ))}
      </g>
    );
  }
  if (c.id === "maize") {
    return (
      <g stroke={c.color} strokeWidth="2" strokeLinecap="round" fill="none">
        {items.filter((_, i) => i % 2 === 0).map((cx) => (
          <g key={cx}>
            <path d={`M${cx} ${ground} L${cx} ${ground - 50}`} />
            <path d={`M${cx} ${ground - 18} q -10 -4 -14 4`} />
            <path d={`M${cx} ${ground - 30} q 10 -4 14 4`} />
            <path d={`M${cx} ${ground - 50} l -3 -6 M${cx} ${ground - 50} l 3 -6`} stroke="#C9A86A" />
          </g>
        ))}
      </g>
    );
  }
  if (c.id === "sesbania") {
    return (
      <g>
        {items.filter((_, i) => i % 2 === 1).map((cx) => (
          <g key={cx}>
            <path d={`M${cx} ${ground} L${cx} ${ground - 46}`} stroke="#2F6E45" strokeWidth="1.8" />
            {[12, 22, 32, 42].map((h) => (
              <ellipse key={h} cx={cx + (h % 20 === 2 ? 6 : -6)} cy={ground - h} rx="6" ry="2.6" fill={c.color} />
            ))}
          </g>
        ))}
      </g>
    );
  }
  // legumes, oilseeds, roots: low bushy canopy
  return (
    <g>
      {items.map((cx, i) => (
        <g key={cx}>
          <path d={`M${cx} ${ground} L${cx} ${ground - 14 - (i % 2) * 4}`} stroke="#2F6E45" strokeWidth="1.5" />
          <circle cx={cx - 4} cy={ground - 14 - (i % 2) * 4} r="5" fill={c.color} opacity="0.9" />
          <circle cx={cx + 4} cy={ground - 17 - (i % 2) * 4} r="4.5" fill={c.color} opacity="0.75" />
        </g>
      ))}
    </g>
  );
}

export function SoilProfile({ result }: { result: SimulationResult }) {
  const { L, crop, season, t } = useI18n();
  const W = 600;
  const H = 250;
  const ground = 92;
  const colW = W / 3;
  const level = result.soilImprovementPotential?.level;
  const topsoilDepth = 42; // Fixed illustrative geometry; SOC does not predict changing soil thickness.
  const mPerPx = 1.3 / (H - ground - 24); // 1.3 m drawn depth

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={L(`Illustrative soil diagram for ${result.year}: ${level ? t(`soil.${level}`) : t("status.unavailable")}`, `Sơ đồ đất minh họa năm ${result.year}: ${level ? t(`soil.${level}`) : t("status.unavailable")}`)}>
        <defs>
          <pattern id="subsoil" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#B8B9A6" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#A7A994" strokeWidth="2" />
          </pattern>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2F7F3" />
            <stop offset="1" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={ground} fill="url(#sky)" />
        {/* subsoil */}
        <rect x="0" y={ground} width={W} height={H - ground} fill="url(#subsoil)" />
        {/* topsoil band (modeled SOC-change tone) */}
        <rect x="0" y={ground} width={W} height={topsoilDepth} fill={level ? TOPSOIL[level - 1] : "#A3ADA8"} style={{ transition: "all 350ms ease" }} />
        {/* organic flecks increase with level */}
        {Array.from({ length: (level ?? 0) * 9 }, (_, i) => (
          <circle key={i} cx={(i * 67) % W + 8} cy={ground + 6 + ((i * 13) % Math.max(8, topsoilDepth - 10))} r="1.6" fill="#2E2014" opacity="0.55" />
        ))}
        {result.seasons.map((s, i) => {
          const c = getCrop(s.cropId);
          const x = i * colW;
          const rootPx = c ? Math.min(H - ground - 12, c.agronomicProperties.rootDepthM / mPerPx) : 0;
          return (
            <g key={s.slotId}>
              {i > 0 && <line x1={x} y1={8} x2={x} y2={H} stroke="#fff" strokeWidth="2" strokeDasharray="4 4" opacity="0.9" />}
              {c?.flooded && <rect x={x + 6} y={ground - 9} width={colW - 12} height={9} rx="2" fill="#4A94C7" opacity="0.55" />}
              <Canopy cropId={s.cropId} x={x} w={colW} ground={ground} />
              {/* roots */}
              {c && c.id !== "fallow" && (
                <g stroke="#F4EBDD" strokeWidth="1.3" fill="none" opacity="0.95">
                  {[0.25, 0.5, 0.75].map((f) => {
                    const rx = x + colW * f;
                    return (
                      <g key={f}>
                        <path d={`M${rx} ${ground} C ${rx - 6} ${ground + rootPx * 0.4}, ${rx + 6} ${ground + rootPx * 0.7}, ${rx - 2} ${ground + rootPx}`} />
                        <path d={`M${rx} ${ground + rootPx * 0.3} l -10 ${rootPx * 0.25}`} />
                        <path d={`M${rx} ${ground + rootPx * 0.45} l 9 ${rootPx * 0.25}`} />
                      </g>
                    );
                  })}
                </g>
              )}
              {c?.agronomicProperties.nFixing && (
                <g fill="#DDF0E2" stroke="#2F6E45" strokeWidth="0.8">
                  {[0.3, 0.55, 0.72].map((f) => (
                    <circle key={f} cx={x + colW * f + 5} cy={ground + rootPx * 0.5} r="2.4" />
                  ))}
                </g>
              )}
              <text x={x + 10} y={18} fontSize="12" fontWeight="700" fill="#21312B">
                {season(s.season)}
              </text>
              <text x={x + 10} y={33} fontSize="11" fill="#5d6d65">
                {crop(s.cropId)}
              </text>
              {c && c.id !== "fallow" && (
                <text x={x + 10} y={H - 8} fontSize="10" fill="#21312B">
                  {L("roots", "rễ")} ≈ {c.agronomicProperties.rootDepthM} m
                </text>
              )}
            </g>
          );
        })}
        <text x={W - 8} y={ground + 16} fontSize="10" fill="#FFF7EA" textAnchor="end" fontWeight="600">
          {L("topsoil", "lớp đất mặt")}
        </text>
      </svg>
      <figcaption className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-2">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-ink" aria-hidden />
        <span>
          <strong className="font-semibold text-amber-ink">{L("Illustrative diagram", "Sơ đồ minh họa")}</strong> —{" "}
          {t("rothc.diagram")}
        </span>
      </figcaption>
    </figure>
  );
}
