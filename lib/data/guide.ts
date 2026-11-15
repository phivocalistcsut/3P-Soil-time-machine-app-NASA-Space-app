import type { Localized } from "../types";

const text = (en: string, vi: string): Localized => ({ en, vi });

export const GUIDE_STEPS = [
  {
    id: "setup", title: text("Set up your field", "Thiết lập ruộng"), short: text("Location & farm details", "Vị trí và thông tin ruộng"), href: "/setup",
    intro: text("Start with the right field. You can also practise with the Thới Lai demo farm.", "Bắt đầu từ đúng thửa ruộng. Bạn cũng có thể tập dùng với ruộng mẫu Thới Lai."),
    actions: [
      { title: text("Find and pin your field", "Tìm và ghim vị trí"), body: text("Type an address, choose a result, then tap the map on your field. Zoom in to check the pin.", "Gõ địa chỉ, chọn kết quả rồi bấm đúng thửa ruộng trên bản đồ. Phóng to để kiểm tra ghim.") },
      { title: text("Add your field details", "Điền thông tin ruộng"), body: text("Continue to Your farm. Enter the area, usual crops, water supply and soil information you know. A boundary is optional.", "Sang bước Trang trại: nhập diện tích, cây đang trồng, nguồn nước và thông tin đất bạn biết. Có thể vẽ thêm ranh giới.") },
      { title: text("Choose priorities and review", "Chọn ưu tiên và kiểm tra"), body: text("Choose what matters most, such as water or soil. Review the location and area before finishing setup.", "Chọn điều quan trọng với bạn, như nước tưới hay đất. Kiểm tra lại vị trí và diện tích trước khi hoàn tất.") },
    ],
    outcome: text("My Farm opens with your field and its data sources.", "Trang Ruộng mở ra với vị trí ruộng và nguồn dữ liệu đi kèm."),
    tip: text("No soil test? Leave unknown values blank. Check the source label on any estimate before using it.", "Chưa xét nghiệm đất? Để trống phần chưa biết. Với số liệu ước tính, đọc nhãn nguồn trước khi dùng."),
    link: text("Open farm setup", "Mở thiết lập ruộng"),
  },
  {
    id: "overview", title: text("Get to know your field", "Tìm hiểu ruộng"), short: text("Map, rain & soil", "Bản đồ, mưa và đất"), href: "/overview",
    intro: text("Look at the local context before trying a new crop.", "Xem điều kiện khu vực trước khi thử một cách trồng mới."),
    actions: [
      { title: text("Check the field map", "Kiểm tra bản đồ ruộng"), body: text("Switch between Map and Satellite. Use Field to return to your pin, or Region to see the wider area.", "Đổi giữa Bản đồ và Vệ tinh. Bấm Về ruộng để trở lại ghim, hoặc Xem cả vùng để nhìn rộng hơn.") },
      { title: text("Explore one NASA layer at a time", "Thử từng lớp NASA"), body: text("Turn on rain, soil moisture or surface temperature. Adjust opacity and choose a month to compare historical images.", "Bật mưa, độ ẩm đất hoặc nhiệt độ bề mặt. Chỉnh độ đậm và chọn tháng để so ảnh theo thời gian.") },
      { title: text("Read the field information", "Xem thông tin đất và thời tiết"), body: text("Open Field info, then tap a card for rain, soil, extreme days or vegetation. Read the dates, source and coverage.", "Mở Thông tin đất, rồi bấm thẻ mưa, đất, ngày cực đoan hoặc độ xanh. Xem thời gian, nguồn và phạm vi dữ liệu.") },
    ],
    outcome: text("You can describe the area's wet and dry conditions and spot data that needs a local check.", "Bạn biết khu vực khô, ẩm ra sao và số liệu nào cần kiểm tra thêm tại ruộng."),
    tip: text("A regional satellite value can include many fields. It is not a measurement from your own plot.", "Một giá trị vệ tinh theo vùng có thể gồm nhiều ruộng. Cần đối chiếu thêm với tình hình ruộng của bạn."),
    link: text("Explore My Farm", "Mở trang Ruộng"),
  },
  {
    id: "simulator", title: text("Try a planting plan", "Thử một cách trồng"), short: text("Plan → year → weather", "Cách trồng → năm → thời tiết"), href: "/simulator",
    intro: text("Rehearse a change on screen before committing to a season.", "Thử thay đổi trên màn hình trước khi áp dụng cho một vụ thật."),
    actions: [
      { title: text("Pick a plan", "Chọn cách trồng"), body: text("Choose A for climate fit, B for water, or C for soil. The crop pictures show what changes between seasons.", "Chọn A – Hợp khí hậu, B – Tiết kiệm nước hoặc C – Phục hồi đất. Xem cây nào được đổi trong từng vụ.") },
      { title: text("Choose a year, then the weather", "Chọn năm, rồi chọn thời tiết"), body: text("Select a future year and continue. Start with Historical baseline, then try Drier than usual, Wetter than usual or Warmer.", "Chọn năm tương lai rồi tiếp tục. Bắt đầu với Như lịch sử, sau đó thử Khô hơn bình thường, Ẩm hơn bình thường hoặc Nóng hơn.") },
      { title: text("Read the results and risky months", "Đọc kết quả và tháng rủi ro"), body: text("Compare water and soil carbon with current practice. Open Full information for the 12-month calendar, charts and explanations.", "So nước tưới và carbon đất với cách đang trồng. Mở phần thông tin đầy đủ để xem Lịch 12 tháng, biểu đồ và giải thích.") },
    ],
    outcome: text("You see what the model estimates would change for that plan, year and climate assumption.", "Bạn thấy mô hình ước tính điều gì thay đổi với cách trồng, năm và giả định thời tiết đã chọn."),
    tip: text("A future year is a planning horizon. The app reuses historical weather; it does not forecast that year's weather.", "Năm tương lai là mốc lập kế hoạch. Ứng dụng dùng lại thời tiết lịch sử, không dự báo thời tiết của năm đó."),
    link: text("Open the simulator", "Mở Mô phỏng"),
  },
  {
    id: "compare", title: text("Compare what matters to you", "So sánh theo nhu cầu"), short: text("Benefits & trade-offs", "Điểm mạnh và đánh đổi"), href: "/compare",
    intro: text("There is no single best plan for every farmer. Compare under the same year and assumptions.", "Mỗi ruộng có một nhu cầu khác nhau. Hãy so các cách trồng cùng năm và cùng giả định."),
    actions: [
      { title: text("Check the year and the plans", "Kiểm tra năm và cách trồng"), body: text("Use the year buttons at the top. Keep A, B and C selected to see them together.", "Chọn năm ở thanh phía trên. Giữ A, B và C để xem các phương án cùng nhau.") },
      { title: text("Choose your priorities", "Chọn điều bạn ưu tiên"), body: text("Open chapter 2, Priorities. Adjust water, soil, income and other priorities; watch the ranking change.", "Mở chương 2 – Ưu tiên. Điều chỉnh nước, đất, thu nhập và các nhu cầu khác; xem thứ hạng thay đổi.") },
      { title: text("Look beyond the top score", "Xem cả điểm mạnh và hạn chế"), body: text("Check Strengths, then Details for water, nitrogen and soil carbon. Read Evidence & questions before choosing a plan.", "Xem Điểm mạnh, yếu rồi mở Xem kỹ để đối chiếu nước tưới, đạm và carbon đất. Đọc Bằng chứng & câu hỏi trước khi chọn.") },
    ],
    outcome: text("You understand why a plan ranks highly and what you would trade for its benefits.", "Bạn hiểu vì sao một phương án đứng cao và cần đánh đổi điều gì."),
    tip: text("The table shows one selected year. A five-year average must be calculated from all five future years.", "Bảng đang hiển thị một năm đã chọn. Trung bình 5 năm cần tổng hợp đủ năm năm tương lai."),
    link: text("Compare the plans", "Mở So sánh"),
  },
  {
    id: "planner", title: text("Make a season plan", "Lên kế hoạch từng vụ"), short: text("Dates, water & notes", "Lịch, nước tưới và ghi chú"), href: "/planner#calendar",
    intro: text("Turn a comparison into a plan you can review with a local adviser.", "Đưa cách trồng đã chọn vào kế hoạch để trao đổi với cán bộ khuyến nông."),
    actions: [
      { title: text("Choose the plan and year", "Chọn phương án và năm"), body: text("Open Plan. Check the selected rotation and use the year arrows to move through the plan.", "Mở Kế hoạch. Kiểm tra luân canh đã chọn và dùng mũi tên năm để xem các mốc trong kế hoạch.") },
      { title: text("Tap a season on the calendar", "Bấm một vụ trên lịch"), body: text("See planting and harvest dates, irrigation for your whole field and reminders. Each season and Each year offer larger detail cards.", "Xem ngày gieo, thu hoạch, nước tưới cho cả ruộng và lưu ý. Mục Từng vụ, Từng năm có các thẻ số liệu lớn hơn.") },
      { title: text("Add notes, save or print", "Ghi chú, lưu hoặc in"), body: text("Open Notes & saving, write what to check and save the plan. Download the text summary or use Print year / PDF to discuss it offline.", "Mở Ghi chú & lưu, ghi việc cần kiểm tra rồi lưu kế hoạch. Tải bản tóm tắt hoặc bấm In năm đã chọn / PDF để mang đi trao đổi.") },
    ],
    outcome: text("You have a seasonal schedule and a list of local checks before planting.", "Bạn có lịch mùa vụ và danh sách việc cần kiểm tra trước khi gieo."),
    tip: text("Plans stay on this browser and device. Keep a downloaded or printed copy, and confirm the dates and inputs locally.", "Kế hoạch được lưu trên trình duyệt và thiết bị này. Giữ thêm bản tải về hoặc bản in; xác nhận lịch và vật tư tại địa phương."),
    link: text("Open the season plan", "Mở Kế hoạch"),
  },
];

export const GUIDE_SOURCES = [
  { id: "power", name: "NASA POWER", scale: "≈55 km", topic: text("Regional weather", "Thời tiết theo vùng"), use: text("Weather input for water and crop comparisons.", "Đầu vào thời tiết để so sánh nước tưới và cây trồng."), limit: text("Model and satellite data describe a broad area. Check against local rain and temperature records.", "Dữ liệu mô hình và vệ tinh mô tả vùng rộng. Cần đối chiếu mưa, nhiệt độ ở địa phương.") },
  { id: "imerg", name: "GPM IMERG", scale: "≈11 km", topic: text("Rainfall", "Lượng mưa"), use: text("Rain map and rainfall input when a complete series is available.", "Lớp mưa trên bản đồ; dùng cho tính toán khi có đủ chuỗi số liệu."), limit: text("A rain estimate for a grid cell can differ from a rain gauge at your field.", "Mưa ước tính cho một ô lưới có thể khác lượng đo trên ruộng.") },
  { id: "smap", name: "SMAP L4", scale: "9 km", topic: text("Soil moisture", "Độ ẩm đất"), use: text("Regional moisture map and context for wet-season risk.", "Bản đồ độ ẩm và thông tin tham khảo về rủi ro trong mùa ẩm."), limit: text("An assimilated regional estimate. It cannot resolve water management in a single paddy.", "Ước tính kết hợp dữ liệu theo vùng; không thể hiện việc giữ nước của từng ruộng lúa.") },
  { id: "modis", name: "MODIS NDVI", scale: "250 m", topic: text("Vegetation greenness", "Độ xanh của cây"), use: text("Vegetation history to explore green and bare periods.", "Theo dõi độ xanh để nhận biết giai đoạn có cây và đất trống."), limit: text("One pixel can mix fields, canals and roads. Clouds can leave gaps; NDVI does not identify a crop by itself.", "Một điểm ảnh có thể gồm ruộng, kênh và đường. Mây gây thiếu ảnh; NDVI chưa đủ để xác định loại cây.") },
  { id: "soilgrids", name: "ISRIC SoilGrids", scale: "250 m", topic: text("Soil estimates", "Ước tính tính chất đất"), use: text("Starting soil estimates when local measurements are missing.", "Ước tính đất ban đầu khi chưa có kết quả đo tại ruộng."), limit: text("SoilGrids is an ISRIC model, not a NASA soil sample. Replace estimates with local measurements when possible.", "SoilGrids là mô hình của ISRIC. Khi có kết quả xét nghiệm đất tại ruộng, nên dùng để đối chiếu và cập nhật.") },
];
