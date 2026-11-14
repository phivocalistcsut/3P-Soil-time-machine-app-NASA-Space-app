# Prompt 01 — Dữ liệu cho RothC (SoilGrids sâu 0–30 cm + tham số tàn dư cây trồng)

> Đọc `docs/prompts/00-rothc-shared-context.md` trước. Prompt này chạy song song được với prompt 02.

## Mục tiêu

Chuẩn bị đủ đầu vào **đất** và **cây trồng** cho RothC. Không viết công thức RothC ở đây, phần đó thuộc prompt 02.

## Việc 1 — Mở rộng `lib/services/soilgrids.ts`

Hiện tại file chỉ lấy lớp `0-5cm` của `phh2o, soc, clay, sand` (xem `sample()` và `VARIABLES`).

1. Thêm biến **`bdod`** (bulk density). Lấy `soc`, `clay` và `bdod` cho **3 lớp `0-5cm`, `5-15cm`, `15-30cm`** (COVERAGEID có dạng `<var>_<depth>_mean`). `phh2o` và `sand` giữ nguyên lớp 0–5 cm như cũ, vì texture và pH vẫn dùng như trước.
2. **Đối chiếu đơn vị và hệ số chuyển đổi trong tài liệu SoilGrids** (https://docs.isric.org/globaldata/soilgrids/), không đoán. Theo hiểu biết hiện tại: `soc` là dg/kg, `clay` là g/kg, `bdod` là cg/cm³. Kiểm tra lại các hệ số đang dùng trong `VARIABLES`.
3. Tính:
   - `socStockTCHa` (0–30 cm) = Σ lớp `SOC(g/kg) × BD(g/cm³) × độ dày(cm) × 0.1`. Ghi chú trong code rằng chưa trừ đá sỏi thô (`cfvo`). Nếu muốn trừ thì thêm `cfvo`, nhưng chỉ làm khi có lý do rõ ràng.
   - `clayPercent0to30` = trung bình có trọng số theo độ dày của 3 lớp.
   - Lớp nào thiếu thì kết quả tương ứng trả về `null`, không nội suy.
4. Giữ nguyên các trường trả về cũ (`ph, socPercent, clayPercent, sandPercent, texture`) để không làm hỏng `components/setup/setup-wizard.tsx`. Thêm `socStockTCHa`, `clayPercent0to30` và cập nhật `source` (0–30 cm).
5. Kiểm tra số request: hiện mỗi biến là 1 request WCS, thêm lớp sẽ thành khoảng 11 request. Giữ `Promise.allSettled` và để ý `maxDuration = 25` trong `app/api/soil/route.ts`. Cập nhật evidence id và độ sâu (`end: "30cm"`) trong route.

## Việc 2 — Lưu vào `FarmProfile`

1. Trong `lib/types.ts` thêm vào `FarmProfile`:
   - `clayPercent: number | null` (0–30 cm)
   - `socStockTCHa: number | null` (0–30 cm)
   - các mục tương ứng trong `soilSources`.
2. `components/setup/setup-wizard.tsx`: lưu 2 trường mới từ kết quả `/api/soil`, gắn tag `estimated` với nguồn SoilGrids. Nếu wizard đã cho nông dân nhập SOC thì cho nhập thêm % sét theo cùng cách. Giá trị nông dân nhập được ưu tiên và gắn tag `observed`, giống logic hiện có.
3. `lib/data/demo.ts` (trang trại Thới Lai, 10.0706, 105.5599): **gọi SoilGrids thật** cho tọa độ này, lưu kết quả thành snapshot (theo mẫu `data/*.json` và `scripts/fetch-snapshots.ts`), rồi dùng các giá trị đó với tag `estimated`. Nếu SoilGrids không trả được dữ liệu thì để `null` và báo lại, không điền số tự chọn.
4. Đối chiếu sơ bộ SOC lớp 0–5 cm của SoilGrids với mức trung bình ĐBSCL 24.9 g/kg (Watanabe et al., JARQ 51(3):233–239, https://www.jircas.go.jp/sites/default/files/publication/jarq/51-03-05_233-239_WATANABE.pdf). Ghi kết quả so sánh vào `docs/data-and-validation.md`.

## Việc 3 — Tham số RothC cho cây trồng trong `lib/data/crops.ts`

1. Thêm vào interface `Crop` (`lib/types.ts`):
   ```ts
   rothc: {
     residueCTHa: number; // t C/ha trả lại đất mỗi vụ (rễ + gốc rạ + phần thân lá để lại ruộng)
     dpmRpm: number;      // RothC: 1.44 cây trồng/đồng cỏ cải tạo; 0.67 cỏ chưa cải tạo; 0.25 cây gỗ
     source: string;      // trích dẫn
   };
   ```
2. Điền cho từng cây: `rice, maize, mungbean, soybean, peanut, sesame, sweetpotato, sesbania, fallow`.
   - Cách tính: năng suất điển hình × tỉ lệ phụ phẩm/hạt × hệ số carbon chất khô, cộng phần rễ (tỉ lệ rễ/thân). Dùng **IPCC 2019 Refinement, Vol.4, Ch.11, Table 11.1a** cho hệ số mặc định.
   - **Lúa ĐBSCL**: ưu tiên số liệu địa phương. Năng suất lấy từ Niên giám Thống kê/GSO hoặc nghiên cứu ĐBSCL. Lượng rơm tham khảo Hong Van et al. (2014), *Soil Sci. Plant Nutr.*, DOI 10.1080/00380768.2015.1041862.
   - Nguồn đã kiểm chứng (đọc toàn văn trong prompt 02): Shirato & Yokozawa (2005, doi:10.1111/j.1747-0765.2005.tb00046.x, Bảng 2, chú thích a) dùng C rễ + gốc rạ = **năng suất gạo lứt khô × 0.11** cho lúa và **năng suất hạt khô × 0.22** cho lúa mạch/lúa mì. Hai hệ số này suy từ tỉ lệ chất khô của Ogawa et al. (1988) với hàm lượng C 40%. C được cộng vào **tháng thu hoạch**, DPM/RPM = 1.44 cho mọi tàn dư. Số liệu này của Nhật. Dùng cho lúa ĐBSCL được nếu ghi rõ nguồn và nhãn "estimated".
   - **Quản lý rơm**: mặc định **chỉ tính rễ + gốc rạ**. Rơm trên mặt đất bị lấy đi hoặc đốt (theo Hong Van et al. 2014, đây là thực tế phổ biến ở ĐBSCL). Ghi rõ giả định này trong `source`.
   - `sesbania` (điền thanh, phân xanh): toàn bộ sinh khối được vùi. `fallow`: `residueCTHa = 0`.
   - Số nào không tìm được nguồn thì ghi `TODO(source)` trong code và liệt kê trong báo cáo cuối. Không đoán.
3. Chưa xóa `agronomicProperties.soilPoints`. Prompt 03 sẽ xử lý khi thay engine.

## Kiểm thử

- Thêm test trong `scripts/evidence.test.ts` (dùng `node:test`, mock `fetch` theo cách test hiện có làm với NDVI/POWER):
  - Parse GeoTIFF giả hoặc mock `sample()`, sau đó kiểm tra công thức `socStockTCHa` và `clayPercent0to30` bằng một bộ số tính tay.
  - Thiếu một lớp → trường tương ứng là `null`.
  - Mọi cây trong `CROPS` đều có `rothc` với `residueCTHa >= 0` và `source` không rỗng.
- Chạy `npm test`, `npm run lint`, `npm run build`.

## Xong khi

- `/api/soil?lat=10.0706&lon=105.5599` trả về `socStockTCHa` và `clayPercent0to30`. Ghi lại giá trị thật vào báo cáo.
- `FarmProfile` của demo có 2 trường mới với tag đúng.
- Commit trên `claude/zealous-bell-e9rpld`. Báo cáo cuối liệt kê: nguồn từng số cây trồng, mọi `TODO(source)`, và giá trị SoilGrids cho Thới Lai.
