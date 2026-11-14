# Trang đầu, tìm địa chỉ và đợt rà soát P1

Repo được cập nhật bằng `git fetch --prune origin` và fast-forward tới `a2fa555` trước khi sửa. Nhánh tiếp tục là `Phuong`. Báo cáo ngày 14/11/2026.

## Trang đầu

Khung demo mô phỏng được gỡ khỏi landing, vì các chức năng đó đã có trong Simulator. Vị trí cũ nay là địa cầu Canvas 2D chiếu trực giao, dùng ảnh NASA Blue Marble được lưu cùng app. Không tải MapLibre, chạy engine hoặc gọi API khí hậu cho phần trang trí. Địa cầu xoay minh họa theo thời gian chạy trình duyệt (100 giây/vòng, không mô phỏng tốc độ tự quay vật lý 24 giờ). Có nút dừng/tiếp tục; tự dừng khi ra khỏi màn hình, tab ẩn hoặc người dùng bật giảm chuyển động. Ảnh và bản quyền ghi trong `public/images/CREDITS.md`.

`3+1` đổi thành **So sánh / phương án canh tác**. Câu “Ba áp lực gặp nhau…” đổi thành **Những thách thức cần cân nhắc trước mỗi mùa vụ**. Đã biên tập lại phần giới thiệu, hướng dẫn, ba thách thức, diễn giải nguồn, lời mời thiết lập ruộng, nhãn logo và các câu khó hiểu ở Overview/Compare. Các thuật ngữ nông học vẫn giữ nghĩa; không suy diễn rằng trồng lúa mặc nhiên làm đất suy giảm hoặc cây họ đậu luôn làm SOC tăng.

## Tìm địa chỉ rồi đưa bản đồ tới vị trí

Bản đồ và dịch vụ tìm địa chỉ là hai phần riêng: MapLibre hiển thị bản đồ; geocoding đổi địa chỉ thành kinh/vĩ độ. Đã nối `/api/geocode` với [MapTiler Search & Geocoding](https://docs.maptiler.com/cloud/api/geocoding/), dịch vụ hỗ trợ MapLibre. Nhập địa chỉ và nhấn Enter; một kết quả duy nhất sẽ tự di chuyển bản đồ và ghim, nhiều kết quả thì người dùng chọn đúng địa điểm. Địa chỉ cụ thể được zoom gần hơn địa danh hành chính. Đổi nội dung tìm kiếm sẽ loại kết quả cũ; tọa độ không hợp lệ hoặc trùng bị lọc bỏ. Không gửi yêu cầu theo mỗi ký tự.

Để bật tìm địa chỉ trực tuyến:

1. Tạo API key trong tài khoản MapTiler Cloud của chủ ứng dụng. Chọn gói/hạn mức phù hợp với lượng truy vấn.
2. Tạo `.env.local` từ `.env.example`, đặt `MAPTILER_API_KEY=...`. Không dùng tiền tố `NEXT_PUBLIC_`; không commit key.
3. Khởi động lại `npm run dev`. Trên Vercel, thêm biến cùng tên vào Environment Variables rồi redeploy.
4. Tìm một địa chỉ, chọn đúng kết quả, kiểm tra ghim trên bản đồ rồi xác định điểm/ranh giới ruộng. Geocoder không phải bản đồ địa chính; ruộng không có số nhà vẫn có thể cần ghim thủ công.

Chưa có key trong môi trường kiểm tra nên **chưa chạy được truy vấn MapTiler thật**. Đã kiểm thử hợp đồng API bằng phản hồi mẫu và kiểm tra UI ngoại tuyến. Khi chưa cấu hình, route trả `not_configured` và UI nói rõ chỉ có danh mục địa danh/tọa độ thủ công. Không tự đăng ký dịch vụ hoặc bật thanh toán.

Đã bỏ việc mặc định gọi máy chủ Nominatim công cộng. [Chính sách Nominatim](https://operations.osmfoundation.org/policies/nominatim/) giới hạn tổng lưu lượng ứng dụng ở 1 yêu cầu/giây, cấm autocomplete và đặt điều kiện lựa chọn dịch vụ có chủ đích; một proxy serverless mặc định không bảo đảm giới hạn toàn ứng dụng. Nếu muốn dùng Google Geocoding, cần đổi phần hiển thị sang Google Map theo [quy định hiển thị kết quả](https://developers.google.com/maps/documentation/geocoding/policies); không ghép tọa độ Google lên MapLibre hiện tại.

## P1: kiểm tra nước tưới và ET0

Đã thêm kiểm thử độc lập theo [FAO-56, chương 4, ví dụ 17](https://www.fao.org/4/x0490e/x0490e08.htm): Bangkok tháng 4, ET0 tham chiếu 5,72 mm/ngày; cho phép sai khác 0,05 do bảng làm tròn. Chuyển áp suất hơi đã cho sang RH tương đương để đúng giao diện đầu vào hiện có; không đổi công thức nhằm ép số tưới khớp bản cũ.

Giữ khí hậu, ba vụ lúa và mọi đầu vào khác cố định, chỉ thay kết cấu đất trong cùng engine, cho:

| Đất | Thấm giả định, mm/ngày | Nước làm đất/vụ, mm | Nước tưới mô phỏng, mm/năm |
| --- | ---: | ---: | ---: |
| clay | 1,5 | 150 | 1.218,76 |
| silty_clay | 2,0 | 150 | 1.340,04 |
| clay_loam | 2,5 | 160 | 1.504,54 |
| loam | 4,0 | 175 | 1.956,55 |

Nguồn khí hậu: snapshot POWER 2016–2025 tại demo mới 10,0934°N, 105,5185°E; bảng này không thay mưa bằng IMERG. Snapshot SoilGrids hiện tại phân loại **clay_loam**, sét 35,85%; vì vậy kết quả không nhất thiết bằng mốc clay 1.219 mm trước đó. Sự thay đổi khoảng 1.219 → 1.957 được tái tạo chủ yếu bằng giả định thấm/làm đất, không phải một lỗi đơn vị ET0. Kết cấu SoilGrids không thay thế phép đo thấm sau làm đất, tầng đế cày hay lịch nước.

[IRRI, Producing more rice with less water](https://books.irri.org/DPS29_content.pdf) mô tả thấm/rò thay đổi mạnh theo đất và lớp nước, thường 1–5 mm/ngày trên đất sét đã làm bùn. [Nhan và cs. (2016), nghiên cứu hệ ba vụ lúa ở ĐBSCL](https://doi.org/10.1017/S0021859615000957) và [nghiên cứu AWD tại ĐBSCL năm 2021](https://doi.org/10.1007/s13593-021-00705-z) là nguồn đối chiếu quản lý tưới. Chưa có đủ bảng đo thấm/lưu lượng cùng ruộng, cùng ba vụ để xác nhận một tổng mm/năm là chuẩn. Không dùng các nghiên cứu này làm nhãn “đã hiệu chỉnh thực địa”.

## P1: xu hướng dài hạn và thống kê

Đã thay thẻ “Recent warming” bằng Sen + Mann–Kendall trên chuỗi **1984–2025**, tách riêng khỏi cửa sổ 10 năm dùng so sánh luân canh. `/api/climate-trend` chỉ lấy POWER T2M; cần ít nhất 30 năm đủ 12 tháng, năm thiếu bị loại. Nhiệt độ trung bình năm được cân theo số ngày từng tháng, có năm nhuận. Có snapshot demo và biểu đồ số liệu gốc/đường Sen.

Kết quả thực tại demo: **42/42 năm**, Sen **−0,02075 °C/10 năm**, S = −31, Z = −0,3251, p hai phía = **0,7451**. Chuỗi này không cung cấp bằng chứng về xu hướng đơn điệu có ý nghĩa ở mức 5%. Không gắn nhãn “ấm lên” theo kỳ vọng. Kết quả phụ thuộc sản phẩm/ô lưới; chưa hiệu chỉnh tự tương quan, không quy nguyên nhân cho El Niño hay dùng làm dự báo. Có sàng lọc tương quan trễ một năm trên phần dư và cảnh báo khi vượt ngưỡng gần đúng.

Thuật toán dùng phương sai có hiệu chỉnh giá trị trùng, hiệu chỉnh liên tục khi tính Z, xấp xỉ chuẩn cho p; Sen là trung vị độ dốc mọi cặp với khoảng năm thực. Kiểm thử gồm chuỗi tăng, hằng, giá trị trùng, năm không liền nhau và thiếu tháng. Nguồn: [Mann (1945)](https://doi.org/10.2307/1907187), [Sen (1968)](https://doi.org/10.1080/01621459.1968.10480934).

## P1: so sánh cách tiếp cận SI / NDVI

Overview → Độ xanh từ vệ tinh có bảng so sánh **lịch nông dân khai báo** với **sàng lọc đỉnh NDVI qua QA**. Quy tắc minh bạch: bộ ba ảnh cách nhau không quá 40 ngày, đỉnh ≥0,5, độ nổi ≥0,08, hai đỉnh cách ít nhất 48 ngày. Chỉ dùng điểm good/marginal, không nối khoảng trống dài hoặc thay lịch tự động. Các ngưỡng là giả thuyết minh họa chưa hiệu chỉnh, không phải bộ phân loại lúa.

Snapshot demo có **30/69 kỳ ảnh dùng được**. Số đỉnh là tổng ứng viên trong chuỗi, không phải số vụ/năm. Nếu đỉnh xảy ra trong tháng lịch hiện trạng để trống, UI gợi ý kiểm tra. Cần chuỗi ít mây hơn, HLS và ngày thực địa để xác định mùa vụ chính xác. Đây là đối chiếu giả thuyết với dữ liệu, có công bố chỗ chưa đủ bằng chứng.

## P1: đối chiếu POWER với ERA5

Đã tải thật ERA5 qua [Open-Meteo Historical API](https://open-meteo.com/en/docs/historical-weather-api), khóa `models=era5`, `elevation=nan` để tắt hạ quy mô theo cao độ, ngày UTC+7 phù hợp POWER LST ở kinh độ demo. Chỉ đếm năm trọn vẹn, Tmax ≥35 °C; năm thiếu/đơn vị sai bị loại. ERA5 trả ô 10°N, 105,5°E, độ phân giải 0,25°; POWER là MERRA-2 khoảng 0,5°×0,625°.

| Năm | POWER, ngày ≥35 °C | ERA5, ngày ≥35 °C |
| --- | ---: | ---: |
| 2016 | 117 | 50 |
| 2017 | 37 | 1 |
| 2018 | 58 | 1 |
| 2019 | 65 | 20 |
| 2020 | 100 | 17 |
| 2021 | 47 | 0 |
| 2022 | 25 | 1 |
| 2023 | 62 | 13 |
| 2024 | 101 | 30 |
| 2025 | 63 | 0 |
| **TB/năm** | **67,5** | **13,3** |

Chênh trung bình **54,2 ngày/năm** được hiển thị tại Overview → Ngày cực đoan. Hai nguồn đều là tái phân tích; ô lưới, định nghĩa cực đại và cách lấy mẫu khác nhau. Đây là kiểm tra độ nhất quán, chưa phải kiểm chứng bằng trạm đo; không tự hiệu chỉnh POWER bằng ERA5, không đổi đầu vào engine.

Chạy lại bằng `node --import tsx scripts/validate-weather.ts --save`; kết quả chuẩn hóa nằm ở `data/weather-crosscheck-thoi-lai.json`. `--raw path.json` dùng phản hồi ERA5 đã tải để tái tạo thống kê.

## P1: kinh tế demo và lỗi trình bày

Demo được nạp kinh tế minh họa mặc định; trang trại thật không được tự điền. Có đánh dấu một lần khi nâng cấp demo cũ: người dùng xóa dữ liệu sau đó thì không bị nạp lại khi tải trang. Năng suất tham khảo thống kê Cần Thơ 2024 và thí nghiệm địa phương đã dùng ở dữ liệu tàn dư. Giá lúa ví dụ 7.000 đồng/kg có nguồn [IPSARD/VnSAT tháng 2/2025, phần Cần Thơ trang 29](https://thitruongnongsan.gov.vn/images/2013/DANGNHAP/VnSAT_Lua%20gao/2025/Th%C3%A1ng/Bao%20cao%20Lua%20gao_Thang%2002_2025.pdf). Các giá cây khác và toàn bộ chi phí vẫn là **giả định minh họa**, có TODO nguồn ngân sách ruộng; không mạo nhận là báo giá hay lợi nhuận dự báo. Kết quả thu nhập và điểm liên quan mang nhãn Minh họa, nguồn ở Cài đặt.

So sánh “số tháng đất trống” nay dùng chênh số tháng, thay vì đem chỉ số mưa có trọng số ra kết luận “như hiện trạng”. Tháng fallow/null ghi **Rửa trôi** ở hàng rủi ro mưa, cây đang có mới ghi **Ngập úng**; tháng bỏ trống không bị gán rủi ro nóng cho cây. Chế độ rủi ro mưa vẫn có thể cao vì đất trống có thể mất dinh dưỡng.

Bộ chọn giai đoạn khí hậu tham chiếu đã chuyển sang **Cài đặt → Giai đoạn khí hậu tham chiếu**; Overview chỉ hiện khoảng năm và liên kết. Giải thích riêng cửa sổ lịch sử, năm mô phỏng tương lai và chuỗi xu hướng dài hạn.

## P1 còn cần dữ liệu và kiểm chứng

- **Chưa có đối chiếu ET với ECOSTRESS**: chưa đọc granule ET và QA cùng ruộng/cùng ngày, đổi đơn vị/tổng thời gian và đối chiếu với ET0/ETc đúng đại lượng. Không dùng ERA5 làm thay thế kiểm chứng ECOSTRESS.
- **Chưa có adapter số liệu SRTM/HLS/ECOSTRESS hoàn chỉnh**. Không đổi nhãn unsupported thành supported chỉ vì thêm đường dẫn. Cần quyền tải dữ liệu nếu sản phẩm yêu cầu Earthdata, phân tích mây/QA, độ dốc theo lân cận và kiểm thử dữ liệu thật. Nguồn này không được tự thêm vào RothC.
- **Kinh tế mới có nguồn giá lúa và năng suất lịch sử**, chưa có ngân sách cùng địa bàn/mùa cho mọi cây, giá hiện tại hoặc chi phí địa phương. Cần chuyên gia bổ sung trước khi coi là phân tích lợi nhuận thực.
- Cần đo thấm và lịch tưới ba vụ tại ruộng; đo SOC, chuỗi trạm nhiệt độ và kiểm định có xử lý tự tương quan. Không suy tính đúng sai của hai mô hình chỉ từ chênh lệch giữa chúng.

## Xác minh

**39/39 kiểm thử qua**, gồm các ca mới về FAO-56 ET0, Mann–Kendall/Sen, năm nhuận/thiếu tháng, hợp đồng geocoding, NDVI QA/khoảng mây, ERA5 năm đủ/thiếu, rủi ro đất bỏ trống và kinh tế minh họa. Bộ số liệu RothC tham chiếu vẫn giữ nguyên. `npm run lint` và production build đều qua; build Windows dùng `CIRCLE_NODE_TOTAL=2`, `UV_THREADPOOL_SIZE=1` như đợt trước.

Đã mở app bằng `npm run dev`, kiểm tra trang đầu EN/VI ở desktop 1280×820 và mobile 390×844, không tràn ngang; kiểm tra nút dừng địa cầu, tự ghim địa danh Cờ Đỏ (10.10000, 105.43000) từ danh mục có sẵn khi chưa có key, trang Cài đặt, Simulator, xu hướng dài hạn, đối chiếu ERA5 và lịch rủi ro. Xóa kinh tế demo rồi tải lại vẫn giữ trống; nạp lại giá trị minh họa hoạt động đúng. `/api/climate-trend` trả 200 với 42 năm; API địa chỉ trả 503/not_configured đúng điều kiện chưa có key. Script đối chiếu ERA5 đã chạy bằng request thật, cho cùng kết quả với phản hồi lưu. Ảnh minh chứng nằm trong bộ bàn giao của cuộc trò chuyện.
