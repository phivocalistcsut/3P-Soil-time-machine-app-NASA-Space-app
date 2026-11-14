"use client";

import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/primitives";
import { ConfidenceBadge, StatusBadge } from "@/components/common";

export function RothCMethod() {
  const { t } = useI18n();
  return <Card className="space-y-3 p-5" id="rothc">
    <h2 className="text-base font-semibold">{t("rothc.methodTitle")}</h2>
    <div className="flex flex-wrap gap-2"><StatusBadge status="estimated" /><ConfidenceBadge level="low" /></div>
    {["methodPools", "methodModifiers", "methodPartition", "methodSpinup", "methodPaddy", "methodData", "methodLevels"].map((key) =>
      <p key={key} className="text-xs leading-relaxed text-ink-2">{t(`rothc.${key}`)}</p>)}
    <p className="rounded-lg bg-amber-soft p-3 text-xs leading-relaxed text-amber-ink">{t("rothc.limit")} {t("rothc.gapAction")}</p>
    <div className="flex flex-wrap gap-3 text-xs font-semibold text-forest underline">
      <a href="https://www.rothamsted.ac.uk/sites/default/files/Documents/RothC_description.pdf" target="_blank" rel="noreferrer">RothC (2024)</a>
      <a href="https://doi.org/10.1111/j.1747-0765.2005.tb00046.x" target="_blank" rel="noreferrer">Shirato &amp; Yokozawa (2005)</a>
      <a href="https://doi.org/10.1016/S0038-0717(97)00256-3" target="_blank" rel="noreferrer">Falloon et al. (1998)</a>
      <a href="https://4p1000.org/decouvrir/" target="_blank" rel="noreferrer">4 per 1000</a>
    </div>
  </Card>;
}
