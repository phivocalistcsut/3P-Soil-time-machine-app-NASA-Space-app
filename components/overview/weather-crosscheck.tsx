"use client";

import crosscheck from "@/data/weather-crosscheck-thoi-lai.json";
import type { FarmProfile } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "@/components/common";
import { Card } from "@/components/ui/primitives";

export function WeatherCrosscheck({farm,period}:{farm:FarmProfile;period?:[number,number]}) {
  const {L,num}=useI18n();
  const matches=farm.isDemo && Math.abs(farm.latitude-crosscheck.latitude)<0.00001 && Math.abs(farm.longitude-crosscheck.longitude)<0.00001 &&
    period?.[0]===crosscheck.start && period?.[1]===crosscheck.end;
  return <Card className="space-y-3 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{L("Independent model cross-check", "Đối chiếu giữa hai nguồn khí hậu")}</h3><StatusBadge status={matches?"estimated":"unavailable"} withTip={false} /></div>
    {!matches?<p className="text-xs text-ink-2">{L("No cross-check has been saved for this location and period.","Chưa có kết quả đối chiếu cho vị trí và giai đoạn đang chọn.")}</p>:<>
      <p className="text-xs text-ink-2">Thới Lai · {crosscheck.start}–{crosscheck.end} · Tmax ≥35 °C · {L("mean days/year","số ngày trung bình/năm")}</p>
      <div className="grid grid-cols-2 gap-3">
        <p className="rounded-xl bg-water-soft p-3 text-xs">NASA POWER<br/><strong className="text-2xl tabular">{num(crosscheck.meanPowerHotDays,1)}</strong></p>
        <p className="rounded-xl bg-lime-soft p-3 text-xs">ECMWF ERA5<br/><strong className="text-2xl tabular">{num(crosscheck.meanEra5HotDays,1)}</strong></p>
      </div>
      <p className="rounded-lg bg-amber-soft p-3 text-xs leading-relaxed text-amber-ink">{L(`The model counts differ by ${num(crosscheck.meanDifferenceDays,1)} days/year. Check local station data before interpreting the heat indicator. This comparison does not calibrate the model.`,`Hai nguồn chênh ${num(crosscheck.meanDifferenceDays,1)} ngày/năm. Cần đối chiếu trạm khí tượng địa phương trước khi diễn giải mức nắng nóng. Kết quả này chưa phải hiệu chỉnh mô hình.`)}</p>
      <details className="text-xs"><summary className="cursor-pointer font-semibold text-lime-ink">{L("Year-by-year counts","Xem số liệu từng năm")}</summary><table className="mt-2 w-full text-left tabular"><thead><tr><th>{L("Year","Năm")}</th><th>POWER</th><th>ERA5</th></tr></thead><tbody>{crosscheck.years.map(y=><tr key={y.year} className="border-t border-line"><td className="py-1">{y.year}</td><td>{y.powerHotDays}</td><td>{y.era5HotDays}</td></tr>)}</tbody></table></details>
      <p className="text-[11px] leading-relaxed text-ink-2">{L("Complete years only. POWER: MERRA-2, ~55 km, LST; ERA5: 0.25°, UTC+7 via Open-Meteo, elevation downscaling disabled. Different grids and sampling affect maxima. Both are reanalyses, not field measurements. Cross-check retrieved", "Chỉ dùng năm đủ dữ liệu. POWER: MERRA-2, khoảng 55 km, giờ mặt trời địa phương; ERA5: 0,25°, UTC+7 qua Open-Meteo, tắt hiệu chỉnh cao độ. Khác biệt ô lưới và cách lấy mẫu ảnh hưởng nhiệt độ cao nhất. Cả hai là dữ liệu tái phân tích, cần số đo trạm để kiểm chứng. Lấy dữ liệu đối chiếu ngày")} {crosscheck.era5RetrievedAt.slice(0,10)}. <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noreferrer" className="underline">Open-Meteo / ECMWF ERA5</a>.</p>
    </>}
  </Card>;
}
