"use client";

import { historyYears } from "@/lib/data/evidence";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Card, Select } from "@/components/ui/primitives";

export function HistorySettings() {
  const { L } = useI18n();
  const latest = historyYears(new URLSearchParams())!;
  const selected = useApp((s) => s.historyYears);
  const setYears = useApp((s) => s.setHistoryYears);
  const history = selected ?? latest;
  return <Card id="history" className="scroll-mt-6 p-5">
    <h2 className="text-base font-semibold">{L("Historical weather window", "Giai đoạn khí hậu tham chiếu")}</h2>
    <p className="mt-1 text-xs leading-relaxed text-ink-2">{L("Advanced: choose up to ten complete years for rotation and water comparisons. This is separate from the future simulation years and the long-term trend analysis.", "Tùy chọn nâng cao: chọn tối đa 10 năm trọn vẹn để so sánh luân canh và nhu cầu tưới. Giai đoạn này khác với các năm mô phỏng tương lai và chuỗi dùng phân tích xu hướng dài hạn.")}</p>
    <div className="mt-3 flex flex-wrap gap-3">
      <label className="text-xs font-semibold">{L("Start year", "Năm bắt đầu")}
        <Select className="mt-1" value={history.start} onChange={(e) => setYears({ ...history, start: Number(e.target.value) })}>
          {Array.from({ length: Math.min(10, history.end - 1984 + 1) }, (_, i) => history.end - i).map((y) => <option value={y} key={y}>{y}</option>)}
        </Select>
      </label>
      <label className="text-xs font-semibold">{L("End year", "Năm kết thúc")}
        <Select className="mt-1" value={history.end} onChange={(e) => { const end = Number(e.target.value); setYears({ start: Math.max(1984, end - (history.end - history.start)), end }); }}>
          {Array.from({ length: latest.end - 1984 + 1 }, (_, i) => latest.end - i).map((y) => <option value={y} key={y}>{y}</option>)}
        </Select>
      </label>
    </div>
  </Card>;
}
