# Prompt 02 — Engine RothC thuần (`lib/engine/rothc.ts`) + test theo tài liệu gốc

> **Trạng thái: ĐÃ XONG.** Xem `lib/engine/rothc.ts`, `scripts/rothc.test.ts`, `data/rothc-reference/`. Interface cuối cùng nằm trong `00-rothc-shared-context.md`; `flooded: boolean` đã đổi thành `waterRegime`. Engine port từ code chính thức RothC_Py của Rothamsted. Hệ số ruộng ngập đã đối chiếu toàn văn bài Shirato & Yokozawa 2005. Phần dưới giữ lại để tham khảo.

> Đọc `docs/prompts/00-rothc-shared-context.md` trước. Prompt này chạy song song được với prompt 01 và **không** sửa `simulate.ts`, UI hay `soilgrids.ts`.

## Mục tiêu

Viết module thuần TypeScript đúng interface trong file ngữ cảnh chung (`RothCSoil`, `RothCMonth`, `RothCPools`, `RothCStep`, `spinUp`, `runRothC`). Module không có I/O, không phụ thuộc React, và có thể kiểm chứng từng công thức bằng số liệu trong tài liệu RothC.

## Công thức (tài liệu RothC 2024, mục 1.3–1.7)

1. **Hệ số nhiệt độ** a = 47.91 / (1 + e^(106.06 / (T + 18.27))).
2. **TSMD và hệ số ẩm** b:
   - `maxTSMD = -(20.0 + 1.3·clay − 0.01·clay²) × depthCm / 23`
   - Đất trống: không khô quá `maxTSMD / 1.8` (BareSMD). Nếu TSMD đã thấp hơn BareSMD thì giữ nguyên, không khô thêm.
   - Mỗi tháng: `acc = min(0, max(maxTSMD (hoặc bareSMD), acc + rain − 0.75·panEvap))`. Đọc kỹ cách tài liệu mô tả "bắt đầu tích lũy khi 0.75·E > rain" và trường hợp làm ướt lại.
   - `b = 1` nếu `acc > 0.444·maxTSMD`; ngược lại `b = 0.2 + 0.8·(maxTSMD − acc)/(maxTSMD − 0.444·maxTSMD)`.
   - Mô hình bắt đầu ở field capacity (TSMD = 0). Bán cầu nam thì dời chuỗi để bắt đầu ở tháng ướt. ĐBSCL ở bán cầu bắc, nhưng mùa mưa lệch, nên cho phép `startTsmd` hoặc ghi chú rõ.
3. **Hệ số che phủ** c = 0.6 nếu `vegetated`, 1.0 nếu đất trống.
4. **Phân giải**: mỗi pool Y → Y·e^(−a·b·c·k·t), với t = 1/12, k: DPM 10.0, RPM 0.3, BIO 0.66, HUM 0.02 (năm⁻¹).
5. **Phân chia theo sét**: x = 1.67·(1.85 + 1.60·e^(−0.0786·clay)). Phần x/(x+1) thành CO₂, phần 1/(x+1) thành BIO+HUM, chia 46% BIO và 54% HUM.
6. **Input**: plantC chia DPM/RPM theo `dpmRpm` (DPM = r/(1+r)). FYM chia 49% DPM, 49% RPM, 2% HUM.
7. **IOM** = 0.049·TOC^1.139 (Falloon et al., 1998). IOM không phân giải.

## Biến thể ruộng ngập (D5): bắt buộc đối chiếu nguồn

Nguồn thứ cấp (slide FAO GSP 12/2022 của Shirato: https://www.fao.org/fileadmin/user_upload/soils/Joint_trainings/Dec2022-OCB_GSP/2022_1212FAO_Soil_Shiratoc.pdf; báo cáo NARO: https://repository.naro.go.jp/record/9031/files/NIAESINVENTORY09_p38-40.pdf) cho biết: tốc độ phân giải mọi pool **× 0.2 trong mùa lúa ngập** và **× 0.6 ngoài mùa ngập**.

1. Đọc các nguồn này và nếu được thì đọc bài gốc Shirato & Yokozawa (2005), *Soil Sci. Plant Nutr.* 51:405–415, để xác định chính xác:
   - Hệ số 0.2/0.6 **thay thế** b·c hay **nhân thêm** vào a·b·c?
   - Khi ngập thì TSMD xử lý thế nào (đặt bằng 0 hay giữ nguyên)?
   - Hệ số 0.6 áp dụng cho tháng không ngập **trong năm trồng lúa**, hay cho cả tháng trồng cây màu? Shirato et al. (2011) cho thấy với luân canh lúa–màu, xen kẽ bản paddy và bản gốc theo giai đoạn khớp hơn: https://informahealthcare.com/doi/full/10.1080/00380768.2011.591284
2. Code đúng theo kết quả đối chiếu. Ghi câu trả lời cho 3 câu hỏi trên, kèm trích dẫn, trong comment đầu file.
3. Nếu **không** tiếp cận được bài gốc: dừng ở phần này, ghi `TODO(source)` và cài đặt theo cách đơn giản nhất mà nguồn thứ cấp hỗ trợ được, đó là tháng `flooded` thì hệ số tốc độ = a × 0.2 (thay b·c) và TSMD = 0. Báo rõ đây là giả định cần chuyên gia xác nhận. Không tự nghĩ ra hệ số khác.

## Spin-up kiểu inverse (D4)

- Ở trạng thái cân bằng, các pool hoạt động tỉ lệ tuyến tính với lượng input (khi FYM = 0). Vì vậy:
  1. IOM = 0.049·SOC^1.139; mục tiêu cho phần hoạt động = SOC − IOM.
  2. Chạy lặp chu kỳ 12 tháng (với `plantC` là phân bố tương đối, tổng = 1 t C/ha/năm) cho tới khi tổng pool thay đổi < 1e-6 t C/ha/năm, hoặc giải nghiệm cân bằng giải tích. Chọn cách đơn giản và đúng.
  3. Hệ số scale = (SOC − IOM) / tổng_hoạt_động_ở_input_1, nhân vào pool và trả `annualPlantC`.
- Nếu input `year` có `fymC > 0` thì tính tuyến tính không còn đúng cho phần plant. Khi đó dùng bisection trên `annualPlantC`. YAGNI: nếu không có trường hợp nào dùng FYM trong spin-up thì chỉ cần assert `fymC === 0` và báo lỗi rõ ràng.

## Kiểm thử bắt buộc: dùng số từ tài liệu, không tự đặt

Tạo `scripts/rothc.test.ts` và thêm vào script `test` trong `package.json`.

1. **Bảng TSMD Rothamsted** (trang 11, clay 23.4%, depth 23 cm, có cây che phủ cả năm). Đầu vào mưa và bốc hơi chảo:
   - Rain: 74, 59, 62, 51, 52, 57, 34, 55, 58, 56, 75, 71
   - Pan evap: 8, 10, 27, 49, 83, 99, 103, 91, 69, 34, 16, 8
   - Acc. TSMD kỳ vọng: 0, 0, 0, 0, −10.25, −27.50, −44.94, −44.94, −38.69, −8.19, 0, 0 (sai số ±0.01).
2. `maxTSMD(23.4, 23)` ≈ −44.94.
3. `x(23.4)` ≈ 3.51 (±0.01).
4. `a(T)` ≈ 1 tại khoảng 9.25 °C (Hình 2). Ghi giá trị chính xác ra và kiểm tra hàm đơn điệu tăng.
5. Ví dụ Hoosfield (mục 2.1): SOC 33.8 t C/ha, IOM ≈ 2.7 t C/ha theo Falloon. Kiểm tra IOM = 0.049·33.8^1.139 ≈ 2.7. Chỉ kiểm tra input cân bằng ≈ 1.70 t C/ha/năm nếu tài liệu có đủ dữ liệu khí hậu Hoosfield. Nếu không đủ thì bỏ test này và ghi lý do, không bịa khí hậu.
6. Spin-up: `totalC` của bước đầu sau spin-up khớp `socStockTCHa` với sai số < 1%. Chạy tiếp với cùng khí hậu và input thì SOC phải gần như không đổi.
7. Tháng `flooded`: tốc độ mất C nhỏ hơn tháng không ngập cùng điều kiện, đúng theo hệ số đã chốt ở phần paddy.

## Xong khi

- `npm test`, `npm run lint`, `npm run build` đều xanh.
- Commit trên `claude/zealous-bell-e9rpld`.
- Báo cáo cuối gồm: câu trả lời 3 câu hỏi paddy kèm nguồn, các test đã bỏ qua và lý do, mọi `TODO(source)`.
