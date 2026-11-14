"use client";

import { useI18n } from "@/lib/i18n";
import { ndviSeasonPeaks } from "@/lib/engine/ndvi-seasons";
import type { NdviSeries, SimulationResult } from "@/lib/types";
import { StatusBadge } from "@/components/common";
import { Card } from "@/components/ui/primitives";

export function SeasonCheck({ series, reference }: {series:NdviSeries; reference:SimulationResult|null}) {
  const {L,num} = useI18n();
  const check = ndviSeasonPeaks(series);
  const declared = reference?.seasons.filter(s=>s.cropId && s.cropId!=="fallow").length;
  const cropInMonth = (date:string)=>reference?.monthlyCover[Number(date.slice(5,7))%12];
  return <Card className="space-y-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{L("Scientific inquiry: calendar versus NDVI", "Kiểm chứng giả định: lịch mùa vụ và NDVI")}</h3><StatusBadge status={check.peaks.length ? "estimated" : "unavailable"} withTip={false} /></div>
    <p className="text-xs leading-relaxed text-ink-2">{L("Hypothesis: the declared crop calendar should broadly agree with periods of high vegetation greenness. The current typical calendar is repeated by month for comparison; it is not a record of past seasons.", "Giả thuyết: những tháng có cây trong lịch khai báo thường tương ứng với giai đoạn thực vật xanh hơn. Lịch hiện trạng được lặp theo tháng để đối chiếu; đây chưa phải hồ sơ mùa vụ của các năm trước.")}</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr className="border-b border-line"><th className="py-2">{L("Approach","Cách tiếp cận")}</th><th>{L("Result","Kết quả")}</th><th>{L("Limit","Giới hạn")}</th></tr></thead><tbody>
      <tr className="border-b border-line"><th className="py-2 pr-3 font-medium">{L("Farmer calendar","Lịch nông dân khai báo")}</th><td className="pr-3">{declared ?? "—"} {L("seasons/year","vụ/năm")}</td><td>{L("Assumed dates and typical crop durations","Ngày gieo và thời gian sinh trưởng giả định")}</td></tr>
      <tr><th className="py-2 pr-3 font-medium">{L("Statistical NDVI peaks","Sàng lọc đỉnh NDVI")}</th><td className="pr-3">{check.peaks.length} {L("candidate peaks in the available record","đỉnh tham khảo trong toàn chuỗi")}</td><td>{check.usable}/{check.total} {L("QA-screened composites; gaps reduce detection","kỳ ảnh qua lọc chất lượng; thiếu ảnh làm giảm khả năng phát hiện")}</td></tr>
    </tbody></table></div>
    {check.peaks.length ? <ul className="flex flex-wrap gap-2">{check.peaks.map(p=><li key={p.date} className="rounded-lg bg-sand px-2 py-1 text-[11px]">{p.date} · {num(p.ndvi,2)}{reference && (!cropInMonth(p.date)||cropInMonth(p.date)==="fallow") ? ` · ${L("check declared bare month",`kiểm tra lịch tháng ${Number(p.date.slice(5,7))}`)}` : ""}</li>)}</ul> : <p className="text-xs text-ink-2">{L("No peak passes the screening rule. This does not mean there was no crop.", "Chưa có đỉnh qua quy tắc sàng lọc. Điều này không có nghĩa là ruộng không có cây.")}</p>}
    <p className="text-[11px] leading-relaxed text-ink-2">{L("Exploratory rule: three QA-screened points no more than 40 days apart, NDVI peak ≥0.5, prominence ≥0.08 and peaks ≥48 days apart. Thresholds are app choices, not locally calibrated. A 250 m mixed pixel and cloud gaps cannot establish exact planting/harvest dates or rice-season counts. High-resolution HLS and field dates are needed to validate; no crop history is changed automatically.", "Quy tắc tham khảo: ba điểm qua lọc chất lượng cách nhau không quá 40 ngày, đỉnh NDVI ≥0,5, độ nổi ≥0,08, các đỉnh cách ít nhất 48 ngày. Ngưỡng do app lựa chọn, chưa hiệu chỉnh địa phương. Điểm ảnh hỗn hợp 250 m và khoảng trống do mây chưa đủ xác định chính xác ngày gieo/thu hoạch hay số vụ lúa. Cần HLS và lịch thực địa để kiểm chứng; ứng dụng không tự sửa lịch canh tác.")}</p>
  </Card>;
}
