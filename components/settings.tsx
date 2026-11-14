"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, Coins, Database, FlaskConical, Languages, RefreshCw, Settings as SettingsIcon, Trash2, Wifi, WifiOff, CalendarClock, ListOrdered } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useClimate } from "@/lib/hooks";
import { CROPS } from "@/lib/data/crops";
import { createDemoFarm, ILLUSTRATIVE_ECONOMICS, weightsFromPriorities } from "@/lib/data/demo";
import type { EconomicInput, PriorityId } from "@/lib/types";
import { CropIcon, LanguageSwitcher, StatusBadge } from "@/components/common";
import { Badge, Button, Card, CardHeader, Input, Select, cn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ui/sections";
import { toast } from "@/components/ui/overlays";

const ALL_PRIORITIES: PriorityId[] = ["soil", "water", "drought", "income", "inputs"];

export function Settings() {
  const { L, t } = useI18n();
  const st = useApp();
  const climate = useClimate(st.farm);
  const [econ, setEcon] = useState<Record<string, { yieldT: string; priceVnd: string; costMVnd: string }>>(() =>
    Object.fromEntries(
      CROPS.map((c) => {
        const e = st.economics[c.id];
        return [c.id, { yieldT: e ? String(e.yieldT) : "", priceVnd: e ? String(e.priceVnd) : "", costMVnd: e ? String(e.costMVnd) : "" }];
      }),
    ),
  );
  const thisYear = new Date().getFullYear();

  const priorities = st.farm?.farmerPriorities ?? [];
  const setPriorities = (p: PriorityId[]) => {
    if (!st.farm) return;
    useApp.setState({ farm: { ...st.farm, farmerPriorities: p }, weights: weightsFromPriorities(p) });
  };
  const move = (i: number, d: number) => {
    const p = [...priorities];
    const j = i + d;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]];
    setPriorities(p);
  };

  const saveEcon = () => {
    const out: Record<string, EconomicInput> = {};
    for (const [id, v] of Object.entries(econ)) {
      if (!v.yieldT.trim() && !v.priceVnd.trim() && !v.costMVnd.trim()) continue;
      const y = Number(v.yieldT.replace(",", "."));
      const p = Number(v.priceVnd.replace(",", "."));
      const c = Number(v.costMVnd.replace(",", "."));
      if (![y, p, c].every((x) => Number.isFinite(x) && x >= 0)) {
        toast.error(L(`Check the numbers for ${id}`, `Kiểm tra lại số liệu của ${id}`));
        return;
      }
      const prev = st.economics[id];
      const same = prev && prev.yieldT === y && prev.priceVnd === p && prev.costMVnd === c;
      out[id] = { yieldT: y, priceVnd: p, costMVnd: c, status: same ? prev.status : "observed" };
    }
    st.setEconomics(out);
    toast.success(L("Economic inputs saved", "Đã lưu số liệu kinh tế"));
  };

  const fillIllustrative = () => {
    st.setEconomics(ILLUSTRATIVE_ECONOMICS);
    setEcon(Object.fromEntries(CROPS.map((c) => [c.id, { yieldT: String(ILLUSTRATIVE_ECONOMICS[c.id]?.yieldT ?? ""), priceVnd: String(ILLUSTRATIVE_ECONOMICS[c.id]?.priceVnd ?? ""), costMVnd: String(ILLUSTRATIVE_ECONOMICS[c.id]?.costMVnd ?? "") }])));
    toast.info(L("Illustrative values loaded — they are placeholders, not market data", "Đã nạp giá trị minh họa — chỉ là số giả định, không phải dữ liệu thị trường"));
  };

  const clearCache = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => ["stm-evidence-", "stm-climate-", "stm-daily-", "stm-ndvi-"].some((prefix) => k.startsWith(prefix)))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    toast.success(L("Cached climate data cleared — reload to fetch again", "Đã xóa dữ liệu khí hậu lưu tạm — tải lại trang để lấy mới"));
  };

  const anyIllustrativeEcon = Object.values(st.economics).some((e) => e.status === "illustrative");

  return (
    <div className="space-y-5">
      <PageHeader image="orbital-sunrise" icon={SettingsIcon} eyebrow={L("Settings", "Cài đặt")} title={L("Preferences", "Tùy chọn")} desc={L("Everything is stored only in this browser.", "Mọi thứ chỉ được lưu trong trình duyệt này.")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Languages className="h-4 w-4 text-forest" aria-hidden />
            {L("Language", "Ngôn ngữ")}
          </h2>
          <p className="mt-1 text-xs text-ink-2">{L("All labels, units, charts and warnings switch instantly.", "Mọi nhãn, đơn vị, biểu đồ và cảnh báo chuyển ngay lập tức.")}</p>
          <LanguageSwitcher className="mt-3" />
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Database className="h-4 w-4 text-forest" aria-hidden />
            {L("Data mode", "Chế độ dữ liệu")}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={L("Data mode", "Chế độ dữ liệu")}>
            {(
              [
                ["live", Wifi, L("Live NASA data", "Dữ liệu NASA trực tuyến"), L("Load NASA datasets for your farm coordinates.", "Tải dữ liệu NASA cho tọa độ ruộng.")],
                ["offline", WifiOff, L("Offline / demo", "Ngoại tuyến / demo"), L("Use saved farm data or the bundled demo snapshot. Unsaved locations need live data.", "Dùng dữ liệu ruộng đã lưu hoặc bản mẫu đi kèm. Vị trí mới cần dữ liệu trực tuyến.")],
              ] as const
            ).map(([id, Icon, label, desc]) => (
              <button key={id} role="radio" aria-checked={st.dataMode === id} onClick={() => st.setDataMode(id)} className={cn("rounded-xl border p-3 text-left", st.dataMode === id ? "border-forest bg-mint/50" : "border-line hover:border-leaf")}>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </span>
                <span className="mt-1 block text-[11px] text-ink-2">{desc}</span>
              </button>
            ))}
          </div>
          {climate.data && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sand px-3 py-2 text-xs text-ink-2">
              <StatusBadge status={climate.data.status} withTip={false} />
              <span>
                {climate.data.source} · {climate.data.period.join("–")}
                {climate.data.retrievedAt && ` · ${L("retrieved", "lấy ngày")} ${climate.data.retrievedAt}`}
                {climate.data.cached && ` · ${L("cached", "đã lưu")}`}
              </span>
            </div>
          )}
          <Button variant="ghost" size="sm" className="mt-2" onClick={clearCache}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {L("Clear cached climate data", "Xóa dữ liệu khí hậu lưu tạm")}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock className="h-4 w-4 text-forest" aria-hidden />
            {L("Simulation horizon", "Giai đoạn mô phỏng")}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="sy">
                {L("Baseline year (today)", "Năm gốc (hiện tại)")}
              </label>
              <Select id="sy" value={st.startYear} onChange={(e) => st.setStartYear(Number(e.target.value))}>
                {[thisYear - 1, thisYear, thisYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="hz">
                {L("Years ahead", "Số năm phía trước")}
              </label>
              <Select id="hz" value={st.horizon} onChange={(e) => st.setHorizon(Number(e.target.value))}>
                {[3, 4, 5].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ListOrdered className="h-4 w-4 text-forest" aria-hidden />
            {L("Farmer priorities", "Ưu tiên của nông dân")}
          </h2>
          {!st.farm ? (
            <p className="mt-2 text-sm text-ink-2">{L("Create a farm profile first.", "Hãy tạo hồ sơ trang trại trước.")}</p>
          ) : (
            <>
              <ol className="mt-3 space-y-1.5">
                {priorities.map((p, i) => (
                  <li key={p} className="flex items-center gap-2 rounded-xl border border-line px-3 py-1.5 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{i + 1}</span>
                    <span className="flex-1">{t(`crit.${p}`)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label={L("Move up", "Lên")}>
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === priorities.length - 1} aria-label={L("Move down", "Xuống")}>
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPriorities(priorities.filter((x) => x !== p))} disabled={priorities.length <= 1} aria-label={L("Remove", "Bỏ")}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ALL_PRIORITIES.filter((p) => !priorities.includes(p)).map((p) => (
                  <Button key={p} variant="outline" size="sm" onClick={() => setPriorities([...priorities, p])}>
                    + {t(`crit.${p}`)}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-2">
                {L("Changing the ranking resets the weights. Fine-tune them on", "Thay đổi thứ hạng sẽ đặt lại trọng số. Tinh chỉnh tại")}{" "}
                <Link href="/compare#weights" className="font-semibold text-forest hover:underline">
                  {L("Compare Plans", "So sánh cách trồng")}
                </Link>
                .
              </p>
            </>
          )}
        </Card>
      </div>

      <Card id="economics" className="scroll-mt-6">
        <CardHeader
          title={L("Local economic inputs (optional)", "Số liệu kinh tế địa phương (tùy chọn)")}
          icon={<Coins className="h-4 w-4" aria-hidden />}
          subtitle={L("Needed for the Economic outlook and the income criterion. Enter your own yields, farm-gate prices and costs.", "Cần cho Triển vọng kinh tế và tiêu chí thu nhập. Nhập năng suất, giá tại ruộng và chi phí của bạn.")}
          actions={anyIllustrativeEcon ? <StatusBadge status="illustrative" withTip={false} /> : undefined}
        />
        <div className="overflow-x-auto px-3 pb-4 pt-3">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-2">
                <th className="px-2 py-2">{L("Crop", "Cây")}</th>
                <th className="px-2 py-2">{L("Yield (t/ha)", "Năng suất (tấn/ha)")}</th>
                <th className="px-2 py-2">{L("Price (VND/kg)", "Giá (đồng/kg)")}</th>
                <th className="px-2 py-2">{L("Cost (million VND/ha)", "Chi phí (triệu đồng/ha)")}</th>
                <th className="px-2 py-2">{L("Status", "Trạng thái")}</th>
              </tr>
            </thead>
            <tbody>
              {CROPS.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="px-2 py-1.5">
                    <span className="flex items-center gap-2 font-medium">
                      <CropIcon cropId={c.id} size={22} />
                      {c.name[st.lang]}
                    </span>
                  </td>
                  {(["yieldT", "priceVnd", "costMVnd"] as const).map((f) => (
                    <td key={f} className="px-2 py-1.5">
                      <Input
                        aria-label={`${c.name[st.lang]} ${f}`}
                        inputMode="decimal"
                        value={econ[c.id]?.[f] ?? ""}
                        onChange={(e) => setEcon((s) => ({ ...s, [c.id]: { ...s[c.id], [f]: e.target.value } }))}
                        className="h-9"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    {st.economics[c.id] ? <Badge tone={st.economics[c.id].status === "illustrative" ? "amber" : "green"}>{st.economics[c.id].status === "illustrative" ? t("status.illustrative") : L("Your data", "Dữ liệu của bạn")}</Badge> : <span className="text-xs text-ink-3">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-2 px-2">
            <Button onClick={saveEcon}>{L("Save economic inputs", "Lưu số liệu kinh tế")}</Button>
            <Button variant="outline" onClick={fillIllustrative}>
              <FlaskConical className="h-4 w-4" aria-hidden />
              {L("Fill illustrative demo values", "Điền giá trị demo minh họa")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                st.setEconomics({});
                setEcon(Object.fromEntries(CROPS.map((c) => [c.id, { yieldT: "", priceVnd: "", costMVnd: "" }])));
                toast.info(L("Economic inputs cleared", "Đã xóa số liệu kinh tế"));
              }}
            >
              {L("Clear", "Xóa")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-base font-semibold">{L("Reset", "Đặt lại")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              st.setFarm(createDemoFarm());
              toast.success(L("Demo farm reloaded", "Đã nạp lại trang trại mẫu"));
            }}
          >
            <FlaskConical className="h-4 w-4" aria-hidden />
            {L("Reload demo farm", "Nạp lại trang trại mẫu")}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm(L("Delete the farm profile, scenarios and saved plans from this browser?", "Xóa hồ sơ trang trại, kịch bản và kế hoạch đã lưu khỏi trình duyệt này?"))) return;
              st.clearFarm();
              useApp.setState({ plans: [], economics: {} });
              toast.info(L("All local data cleared", "Đã xóa toàn bộ dữ liệu cục bộ"));
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {L("Clear all local data", "Xóa toàn bộ dữ liệu cục bộ")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
