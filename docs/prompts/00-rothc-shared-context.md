# RothC — ngữ cảnh chung cho 3 prompt

Đọc file này trước khi làm prompt 01, 02 hoặc 03. Nó ghi lại các quyết định đã chốt và interface chung, để prompt 01 và 02 chạy song song được.

Tài liệu gốc: *RothC – A model for the turnover of carbon in soil, Model Description* (Coleman, Prout & Milne, Rothamsted, 02/2024). Nếu trong repo không có, tải bản PDF chính thức từ trang RothC của Rothamsted Research.

## Quyết định đã chốt

| # | Quyết định |
|---|---|
| D1 | Chỉ dùng **2 dataset**: **NASA POWER** (đã gộp GPM IMERG khi IMERG đủ tháng, xem `lib/engine/environment.ts`) cho mưa, nhiệt độ và ET0; **ISRIC SoilGrids 2.0** cho % sét, SOC và bulk density. Không thêm nguồn mới cần Earthdata Login. MODIS NDVI **không** dùng cho RothC. |
| D2 | Bốc hơi chảo hở `panEvapMm = ET0_ngày × số_ngày / 0.75`. ET0 là Penman–Monteith FAO-56 đã có trong `lib/engine/climate.ts` (`et0Day`). Không dùng POWER `EVPTRNS`, vì đó là ET thực tế. |
| D3 | Độ sâu **0–30 cm**, gồm 3 lớp SoilGrids 0–5, 5–15, 15–30. Max TSMD tính cho 23 cm rồi × 30/23 (tài liệu mục 1.6). |
| D4 | Pool ban đầu xác định bằng **spin-up kiểu "inverse"**: tìm lượng input cân bằng để tổng SOC khớp với stock SoilGrids. IOM = 0.049 × TOC^1.139 (Falloon et al., 1998). |
| D5 | **Ruộng ngập (lúa nước)**: theo Shirato & Yokozawa (2005, *Soil Sci. Plant Nutr.* 51:405–415, doi:10.1111/j.1747-0765.2005.tb00046.x). Đã đối chiếu toàn văn: tốc độ phân giải RothC gốc (a·b·c·k) được **nhân** thêm × **0.2** trong "summer" (từ tháng cấy tới tháng thu hoạch lúa) và × **0.6** trong "winter" (mọi giai đoạn còn lại của ruộng lúa, dù bỏ trống hay trồng cây vụ đông). Đây là giá trị tối ưu chung cho 9 ô thí nghiệm ở Nhật; tối ưu riêng từng ô dao động 0–0.5 và 0.25–1 (Bảng 4). Phần **do app tự thêm, không có trong bài**: tháng ngập đặt TSMD = 0, vì ruộng đang ngập không thể thiếu ẩm. |
| D6 | Carbon tàn dư mỗi cây (`residueCTHa`) và tỉ lệ `dpmRpm` đưa vào `lib/data/crops.ts`, **mỗi số có trích dẫn**, gắn nhãn "estimated". Ưu tiên nguồn ĐBSCL, rồi tới IPCC 2019 Refinement Vol.4 Ch.11. Phân chuồng (FYM) là input tùy chọn của nông dân, mặc định 0. |
| D7 | RothC **thay thế** chỉ số đất định tính hiện có (`soilPoints`, `SOIL_MEMORY_NEW`, `SOIL_LEVEL_THRESHOLDS`). Mỗi khái niệm chỉ có một nguồn số liệu. |
| D8 | Spin-up dùng **khí hậu trung bình 12 tháng** cùng luân canh hiện tại (`farm.cropHistory.typicalPattern`). Chạy tương lai dùng khí hậu trung bình theo giả định đang chọn (baseline/drier/wetter/warmer/custom). |
| D9 | **Không** tính tuổi phóng xạ ¹⁴C (mục 1.8), theo YAGNI. |
| D10 | Thiếu % sét hoặc SOC thì kết quả đất là `"unavailable"`. Engine đã tự loại tiêu chí `null` khỏi điểm tổng hợp. Không tự bịa giá trị mặc định. |

## Interface chung (prompt 02 **đã xong**: `lib/engine/rothc.ts`)

```ts
// lib/engine/rothc.ts — hàm thuần, không I/O, không phụ thuộc React
export type WaterRegime = "upland" | "paddyFlooded" | "paddyDrained"; // hệ số 1 / 0.2 / 0.6 (D5)

export interface RothCSite { clayPercent: number; depthCm: number }   // % sét 0–30 cm; 30
export interface RothCSoil extends RothCSite {
  socStockTCHa: number;  // tổng SOC (gồm IOM), t C/ha, 0–30 cm
  iomTCHa?: number;      // bỏ trống → Falloon et al. (1998)
}

export interface RothCMonth {
  tempC: number;         // nhiệt độ không khí trung bình tháng
  rainMm: number;        // tổng mưa tháng
  panEvapMm: number;     // bốc hơi chảo hở tháng (D2)
  vegetated: boolean;    // có cây che phủ → c = 0.6, ngược lại 1.0
  waterRegime: WaterRegime;
  plantC: number;        // t C/ha cộng vào CUỐI tháng
  dpmRpm: number;        // tỉ lệ DPM/RPM của plantC (1.44 cây trồng)
  fymC: number;          // t C/ha phân chuồng, mặc định 0
}

export interface RothCPools { dpm: number; rpm: number; bio: number; hum: number; iom: number }
export interface RothCStep { pools: RothCPools; totalC: number; tsmd: number; co2C: number; rateModifier: number }

/** Spin-up inverse. year = 12 tháng (tháng 1 → 12); plantC chỉ là phân bố tương đối. Trạng thái trả về là cuối tháng 12. */
export function spinUp(soil: RothCSoil, year: RothCMonth[]): { pools: RothCPools; annualPlantC: number; tsmd: number };

/** Chạy forward theo tháng; truyền `tsmd` của spin-up vào `startTsmd`. */
export function runRothC(site: RothCSite, start: RothCPools, months: RothCMonth[], startTsmd?: number): RothCStep[];

/** Chạy tới cân bằng với input tuyệt đối (giống code chính thức). */
export function equilibrium(site: RothCSite, year: RothCMonth[], iomTCHa: number, tolerance?: number): { pools; tsmd; years };
```

Kiểm chứng (`scripts/rothc.test.ts`): khớp output chính thức RothC_Py của Rothamsted (`data/rothc-reference/`) trên 828 tháng với sai số tối đa 1.1×10⁻¹² t C/ha; tái tạo bảng TSMD (PDF tr. 11), bước tháng 1/1852 Hoosfield (tr. 20–22), IOM Falloon (Hoosfield và Bảng 1 của Shirato); bảo toàn carbon; spin-up giữ SOC ổn định.

## Quy tắc chung

- Làm trên branch `claude/zealous-bell-e9rpld`. Commit khi xong mỗi prompt.
- Đọc `AGENTS.md`: bản Next.js trong repo có breaking change, phải đọc `node_modules/next/dist/docs/` trước khi sửa code Next/React.
- YAGNI, KISS, DRY. **Không tự giả định**: số nào không có nguồn thì ghi `TODO(source)` và báo lại, không bịa.
- Mọi số liệu hiển thị đều phải có nhãn `observed / estimated / illustrative / unavailable` như phần còn lại của app.
- Trước khi commit phải chạy `npm test`, `npm run lint` và `npm run build`.
