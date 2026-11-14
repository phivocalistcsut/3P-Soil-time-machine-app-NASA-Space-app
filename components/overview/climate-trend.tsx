"use client";

import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/lib/i18n";
import { temperatureTrend } from "@/lib/engine/statistics";
import type { TemperatureHistory } from "@/lib/services/climate-trend";
import type { RemoteState } from "@/lib/hooks";
import { AXIS, ChartFrame, ChartTooltip } from "@/components/charts";
import { StatusBadge } from "@/components/common";
import { Card } from "@/components/ui/primitives";

export function ClimateTrend({ history }: { history: RemoteState<TemperatureHistory> }) {
  const { L, num, signed } = useI18n();
  const data = history.data, trend = data ? temperatureTrend(data.points) : null;
  return <Card className="space-y-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-semibold">{L("Long-term temperature trend", "Xu hướng nhiệt độ dài hạn")}</h3>
      <StatusBadge status={trend ? "estimated" : "unavailable"} withTip={false} />
    </div>
    {!trend || !data ? <p className="text-xs text-ink-2">{history.loading ? L("Loading the 1984–last complete year record…", "Đang tải chuỗi từ 1984 đến năm trọn vẹn gần nhất…") : L("A minimum of 30 complete years is required. No recent-period difference is presented as a trend.", "Cần tối thiểu 30 năm dữ liệu trọn vẹn để phân tích. Chưa đủ dữ liệu thì không kết luận xu hướng từ chênh lệch vài năm gần đây.")}</p> : <>
      <p className="text-2xl font-bold tabular">{signed(trend.slopePerYear * 10,2)} <span className="text-xs font-medium">°C/{L("decade", "10 năm")}</span></p>
      <p className="text-xs text-ink-2">{trend.start}–{trend.end} · {trend.n}/{data.requestedEnd - data.requestedStart + 1} {L("complete years", "năm đủ dữ liệu")} · Sen · Mann–Kendall: S={trend.s}, Z={num(trend.z,2)}, p{trend.p < 0.001 ? "<" : "="}{trend.p < 0.001 ? num(0.001,3) : num(trend.p,3)}</p>
      <p className="text-xs font-medium text-ink">{trend.p >= 0.05 ? L("No statistically clear monotonic trend at the 5% level in this record.", "Chưa thấy xu hướng đơn điệu rõ ở mức ý nghĩa 5% trong chuỗi này.") : L("The original test gives p<0.05; serial dependence and dataset consistency still need assessment before drawing a climate conclusion.", "Kiểm định gốc cho p<0,05; cần đánh giá tự tương quan và tính nhất quán dữ liệu trước khi kết luận về khí hậu.")}</p>
      <ChartFrame height={190} summary={L("Annual mean temperature and Sen trend, historical estimates.", "Nhiệt độ trung bình năm và đường xu hướng Sen, theo số liệu lịch sử ước tính.")}
        table={{head:[L("Year","Năm"),"°C"],rows:data.points.map(p=>[p.year,num(p.temperature,2)])}}>
        <LineChart data={data.points.map(p=>({...p, sen:trend.intercept+trend.slopePerYear*(p.year-trend.start)}))} margin={{top:8,right:8,left:0,bottom:0}}>
          <XAxis dataKey="year" {...AXIS} minTickGap={24} /><YAxis {...AXIS} domain={["auto","auto"]} width={42} tickFormatter={(v)=>num(v,1)} />
          <Tooltip content={<ChartTooltip unit="°C" digits={2} />} />
          <Line dataKey="temperature" name={L("Annual mean","Trung bình năm")} stroke="#4a94c7" dot={false} isAnimationActive={false} />
          <Line dataKey="sen" name="Sen" stroke="#3d6814" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        </LineChart>
      </ChartFrame>
      <p className="text-[11px] leading-relaxed text-ink-2">{data.source} · {data.cached ? L("cached", "bản lưu") : L("retrieved", "lấy ngày")} {data.retrievedAt.slice(0,10)}. {L("Sen estimates the rate; the original two-sided Mann–Kendall p-value uses tie/continuity corrections and assumes independent annual observations. It is not adjusted for serial correlation; it does not attribute El Niño or predict future climate.", "Sen ước tính tốc độ thay đổi; p hai phía của Mann–Kendall gốc có hiệu chỉnh giá trị trùng và tính liên tục, giả định các năm độc lập. Chưa hiệu chỉnh tự tương quan; không dùng để quy nguyên nhân cho El Niño hay dự báo tương lai.")}</p>
      {trend.serialCorrelation && <p className="rounded-lg bg-amber-soft p-2 text-xs text-amber-ink">{L("Residual lag-1 correlation exceeds the rough 95% screening bound. Treat the p-value as exploratory until a serial-correlation-adjusted test is run.", "Tương quan trễ một năm của phần dư vượt ngưỡng sàng lọc xấp xỉ 95%. Cần kiểm định có hiệu chỉnh tự tương quan trước khi diễn giải ý nghĩa thống kê.")}</p>}
    </>}
  </Card>;
}
