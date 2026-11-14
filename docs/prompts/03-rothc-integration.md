# Prompt 03 — Tích hợp RothC vào engine mô phỏng và UI

> Đọc `docs/prompts/00-rothc-shared-context.md` trước. **Chỉ chạy sau khi prompt 01 và 02 đã merge** vào `claude/zealous-bell-e9rpld`: cần `FarmProfile.clayPercent`, `FarmProfile.socStockTCHa`, `Crop.rothc`, và `lib/engine/rothc.ts` (`spinUp`, `runRothC`).
> Đọc `AGENTS.md` và tài liệu trong `node_modules/next/dist/docs/` trước khi sửa component.

## Mục tiêu

Thay chỉ số đất định tính bằng kết quả RothC (D7). Mỗi kịch bản sẽ hiển thị SOC (t C/ha) theo năm và mức thay đổi, có nhãn nguồn và giới hạn rõ ràng.

## Việc 1 — Dựng đầu vào RothC trong `lib/engine/simulate.ts`

1. **Khí hậu**: lấy từ `PreparedClimate` sau khi đã áp giả định khí hậu (`prepareClimate`, `lib/engine/climate.ts`). Dùng **trung bình theo tháng** (D8):
   - `tempC` = t2m; `rainMm` = lượng mưa tháng (đã là IMERG nếu `climateWithImerg` áp dụng);
   - `panEvapMm` = `et0Day × số ngày trong tháng / 0.75` (D2).
2. **Theo tháng của từng kịch bản**: tận dụng `monthlyCover` đã có trong `SimulationResult`, không tính lại lịch vụ (DRY):
   - `vegetated` = tháng có cây (khác `null` và khác `fallow`);
   - `waterRegime`: tháng có lúa ngập (`getCrop(cover)?.flooded`, từ tháng cấy tới tháng thu hoạch) = `"paddyFlooded"`; các tháng khác **trong năm có lúa** = `"paddyDrained"` (Shirato & Yokozawa 2005: "winter" gồm cả lúc bỏ trống lẫn lúc trồng cây vụ đông). Năm **không có lúa** dùng `"upland"` hay `"paddyDrained"` là **câu hỏi mở** (xem cuối file), phải hỏi người dùng trước khi code;
   - `plantC`: `crop.rothc.residueCTHa` của mỗi vụ đặt vào **tháng thu hoạch hoặc vùi** của vụ đó. Tài liệu RothC mục 2.1 cho biết cách phân bố input trong năm ít ảnh hưởng tới SOC tổng. `dpmRpm` lấy theo cây;
   - `fymC` = 0, trừ khi farm có input FYM. Nếu thêm input FYM thì phải là trường nông dân nhập, không đặt mặc định.
   - Chú ý `monthlyCover` dùng năm vụ bắt đầu từ tháng 12 năm trước (index 0 = Dec). Phải căn đúng tháng lịch với khí hậu.
3. **Spin-up**: dùng luân canh hiện tại `farm.cropHistory.typicalPattern` (kịch bản tham chiếu `REFERENCE_ID` đã có), khí hậu **baseline** trung bình và `RothCSoil { clayPercent, depthCm: 30, socStockTCHa }`. Spin-up chạy **một lần cho mỗi farm** và dùng chung pool đầu kỳ cho mọi kịch bản, để các kịch bản so sánh công bằng.
   - Lưu ý: spin-up kiểu inverse trả về `annualPlantC` cân bằng, có thể khác tổng `residueCTHa` của luân canh hiện tại. Ghi tỉ lệ chênh vào `assumptions` hoặc `metricSources` và hiển thị như một "khoảng trống thông tin" (đề bài yêu cầu chỉ ra information gaps). Không tự sửa cho khớp.
   - `spinUp` trả về trạng thái **cuối tháng 12** và `tsmd`. Chạy forward phải bắt đầu từ tháng 1 và truyền `tsmd` vào `startTsmd`.
4. **Chạy forward**: `runRothC` cho `horizon + 1` năm của mỗi kịch bản (gồm cả `baselineClimate`). Lấy SOC cuối mỗi năm.

### Câu hỏi mở: phải chốt với người dùng trước khi code (phát hiện khi làm prompt 02)

- **Q-A — Chế độ spin-up.** Shirato & Yokozawa (2005) spin-up bằng **RothC gốc** (`"upland"`), input chia đều 12 tháng, đất được che phủ cả năm (Bảng 1, chú thích f; tr. 407). D8 ở trên lại spin-up bằng luân canh hiện tại *có* hệ số paddy. Nếu làm như bài báo thì pool ban đầu cân bằng với tốc độ phân giải nhanh. Khi chạy forward với hệ số 0.2/0.6, SOC của kịch bản "giữ nguyên 3 vụ lúa" sẽ tăng dần dù nông dân không đổi gì. Cách làm theo D8 không có hiện tượng này, nhưng không có nguồn công bố.
- **Q-B — Năm không có lúa trong luân canh lúa–màu.** Bài 2005 chỉ hiệu chỉnh cho ruộng trồng lúa hằng năm. Shirato et al. (2011, doi:10.1080/00380768.2011.591284) viết riêng về luân canh lúa–màu nhưng chưa đọc được toàn văn. Cần bài này, hoặc quyết định của người dùng.

## Việc 2 — Thay `soilImprovementPotential`

1. Kiểu mới trong `lib/types.ts` (giữ tên field để UI ít phải đổi):
   ```ts
   soilImprovementPotential: {
     socTCHa: number;          // SOC cuối năm, 0–30 cm
     deltaTCHa: number;        // so với SOC đầu kỳ (sau spin-up)
     deltaPctPerYear: number;  // %/năm so với đầu kỳ
     level: 1 | 2 | 3 | 4 | 5;
     score: number;            // 0–100 cho multi-criteria
   } | null;                   // null khi thiếu clay/SOC (D10)
   ```
2. **Ngưỡng level** neo vào sáng kiến "4 per 1000" (+0.4%/năm, https://4p1000.org). Đề xuất: 5 ≥ +0.4; 4 ≥ +0.1; 3 trong khoảng (−0.1, +0.1); 2 ≥ −0.4; 1 < −0.4 (%/năm). Ghi nguồn và lý do vào trang methodology. `score` nội suy tuyến tính trên cùng thang, clamp 0–100.
3. **Xóa** `soilPointsFor`, `soilLevel`, `SOIL_MEMORY_NEW`, `SOIL_LEVEL_THRESHOLDS`, khóa i18n `asm.soilMemory` và `agronomicProperties.soilPoints` trong `crops.ts`/`types.ts` nếu không còn chỗ nào dùng. Kiểm tra bằng `grep`.
4. `criteriaScores.soil` hiện là `0.7·soilScore + 0.3·divScore`. Giữ công thức, thay `soilScore` bằng `score` mới. Nếu `null` thì tiêu chí soil = `null` để engine tự loại.
5. `dataStatus.soilImprovementPotential = "estimated"` khi có đủ dữ liệu, `"unavailable"` khi thiếu. Cập nhật `uncertainty` cho trung thực: SoilGrids 250 m là dữ liệu mô hình, tàn dư là ước tính, hệ số paddy cần chuyên gia xác nhận.
6. Tăng `ENGINE_VERSION`.

## Việc 3 — UI và nội dung

Sửa các chỗ đang đọc `soilImprovementPotential` (`grep -rn soilImprovementPotential components lib`):
- `components/sim/outcomes.tsx`: hiển thị SOC t C/ha, Δ t C/ha và %/năm so với baseline; giữ `SoilMeter` theo `level`; xử lý trường hợp `null`.
- `components/sim/why-panel.tsx`: so sánh bằng `deltaTCHa` thay cho `index`. Giải thích bằng nguyên nhân cụ thể: thêm tàn dư/phân xanh, giảm tháng đất trống, tháng ngập làm chậm phân giải.
- `components/sim/sim-charts.tsx`: metric `soil` vẽ `socTCHa` (t C/ha) thay cho level.
- `components/sim/simulator.tsx`, `components/planner/planner.tsx`, `components/landing/hero-demo.tsx`: cập nhật theo kiểu mới.
- `components/methodology.tsx`: thêm mục RothC gồm công thức a, b, c, k, x, IOM, spin-up, biến thể paddy (kèm nguồn và câu trả lời từ prompt 02), D2, D3, 2 dataset cùng độ phân giải, và giới hạn: RothC không dành cho đất ngập thường xuyên; SoilGrids là dữ liệu mô hình 250 m; tàn dư là ước tính; cần đo SOC thực địa để hiệu chỉnh.
- `lib/i18n/messages.ts`: mọi chuỗi mới phải có **cả EN và VI**.
- `docs/data-and-validation.md` và `README.md` (mục "Simulation engine", bước 8): cập nhật mô tả.

## Kiểm thử

Thêm vào `scripts/evidence.test.ts`:
- Demo farm: năm đầu (`isBaselineYear`) có `socTCHa` khớp `farm.socStockTCHa` với sai số < 1%.
- `farm.clayPercent = null` → `soilImprovementPotential === null`, `criteriaScores.soil === null`, `dataStatus` = `"unavailable"`, và điểm tổng hợp vẫn tính được.
- Kết quả deterministic: chạy 2 lần cho kết quả giống hệt nhau.
- **Không** assert chiều tăng/giảm SOC giữa các kịch bản bằng kỳ vọng tự đặt. Chỉ in kết quả ra trong `npm run engine:smoke` và ghi vào báo cáo.

Chạy `npm test`, `npm run lint`, `npm run build`, `npm run engine:smoke`. Chạy app (`npm run dev`), mở `/simulator`, `/compare`, `/methodology` ở cả EN và VI, chụp màn hình để kiểm tra.

## Xong khi

- Thẻ đất hiển thị SOC t C/ha thật từ RothC cho 3 kịch bản và hiện trạng, có nhãn nguồn và giới hạn.
- Không còn code của chỉ số đất cũ.
- Commit trên `claude/zealous-bell-e9rpld`. Báo cáo cuối gồm bảng SOC theo năm cho từng kịch bản (output `engine:smoke`) và mọi khoảng trống thông tin cần chuyên gia địa phương xem.
