import type { Localized } from "@/lib/types";
import { MESSAGES } from "@/lib/i18n/messages";

/** Plain-language glossary (U3). Short = one line shown in pop-ups; long = the Guide page. */
export type GlossaryGroup = "water" | "soil" | "satellite" | "crop" | "risk" | "model";

export interface GlossaryEntry {
  id: string;
  group: GlossaryGroup;
  term: Localized;
  short: Localized;
  long: Localized;
}

const L = (en: string, vi: string): Localized => ({ en, vi });

export const GLOSSARY_GROUPS: Record<GlossaryGroup, Localized> = {
  water: L("Water", "Nước"),
  soil: L("Soil", "Đất"),
  satellite: L("Satellites & data", "Vệ tinh & dữ liệu"),
  crop: L("Crops & rotation", "Cây trồng & luân canh"),
  risk: L("Weather risks", "Rủi ro thời tiết"),
  model: L("Reading the results", "Cách đọc kết quả"),
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "et0",
    group: "water",
    term: L("Evapotranspiration (ET, ET0)", "Bốc thoát hơi nước (ET, ET0)"),
    short: L("Water that leaves the field as vapour: evaporation from soil plus transpiration by plants.", "Lượng nước rời ruộng dưới dạng hơi: bốc hơi từ đất cộng thoát hơi qua lá cây."),
    long: L(
      "ET0 is the water a standard short grass would lose in a day, set by sun, heat, wind and dry air. The app computes it with the FAO-56 Penman–Monteith method from NASA POWER weather. A crop's real use (ETc) is ET0 multiplied by its crop coefficient.",
      "ET0 là lượng nước một thảm cỏ chuẩn mất đi mỗi ngày, do nắng, nóng, gió và không khí khô quyết định. App tính ET0 theo phương pháp FAO-56 Penman–Monteith từ số liệu thời tiết NASA POWER. Nước cây thật sự dùng (ETc) bằng ET0 nhân hệ số cây trồng.",
    ),
  },
  {
    id: "kc",
    group: "water",
    term: L("Crop coefficient (Kc)", "Hệ số cây trồng (Kc)"),
    short: L("How thirsty a crop is compared with reference grass at each growth stage.", "Cây “khát” hơn hay ít hơn cỏ chuẩn bao nhiêu ở từng giai đoạn."),
    long: L(
      "Kc is low after sowing, peaks at flowering and drops near harvest. Values come from FAO Irrigation and Drainage Paper 56; rice in a flooded field has a high Kc.",
      "Kc thấp lúc mới gieo, cao nhất lúc trổ bông/ra hoa và giảm gần thu hoạch. Giá trị lấy theo tài liệu FAO-56; lúa ngập nước có Kc cao.",
    ),
  },
  {
    id: "peff",
    group: "water",
    term: L("Effective rainfall", "Mưa hữu hiệu"),
    short: L("The part of the rain that the crop can actually use.", "Phần nước mưa cây thật sự dùng được."),
    long: L(
      "Some rain runs off or drains away. The app uses the FAO/AGLW rule: 0.8 × rain − 25 mm when monthly rain is above 75 mm, otherwise 0.6 × rain − 10 mm.",
      "Một phần mưa chảy tràn hoặc thấm đi mất. App dùng quy tắc FAO/AGLW: 0,8 × mưa − 25 mm khi mưa tháng trên 75 mm, ngược lại 0,6 × mưa − 10 mm.",
    ),
  },
  {
    id: "water-balance",
    group: "water",
    term: L("Water balance & irrigation need", "Cân bằng nước & nhu cầu tưới"),
    short: L("Crop water use minus usable rain; the gap is what irrigation must supply.", "Nước cây dùng trừ mưa hữu hiệu; phần còn thiếu là nước phải tưới."),
    long: L(
      "For flooded rice the app also adds percolation (water seeping down, more on sandy soil) and the water used to prepare the field. 1 mm over 1 hectare equals 10 m³ of water.",
      "Với lúa ngập, app cộng thêm nước thấm xuống (đất càng cát càng thấm nhiều) và nước làm đất. 1 mm trên 1 ha bằng 10 m³ nước.",
    ),
  },
  {
    id: "soil-moisture",
    group: "soil",
    term: L("Soil moisture & anomaly", "Độ ẩm đất & dị thường"),
    short: L("How wet the soil is; an anomaly is how far it is from normal for that time of year.", "Đất ướt đến đâu; dị thường là lệch bao nhiêu so với bình thường của thời điểm đó."),
    long: L(
      "SMAP measures surface soil moisture from space on a 9 km grid; NASA POWER gives a model-based soil wetness from 0 (dry) to 1 (saturated). Neither sees a single flooded paddy — they describe the area around it.",
      "Vệ tinh SMAP đo độ ẩm lớp đất mặt trên lưới 9 km; NASA POWER cho độ ẩm đất theo mô hình từ 0 (khô) đến 1 (bão hòa). Cả hai không thấy được từng thửa ruộng ngập — chúng mô tả cả vùng quanh ruộng.",
    ),
  },
  {
    id: "som",
    group: "soil",
    term: L("Soil organic carbon / organic matter", "Carbon hữu cơ / chất hữu cơ trong đất"),
    short: L("Decomposed plant material that feeds soil life and holds water and nutrients.", "Xác thực vật đã phân hủy, nuôi sinh vật đất và giữ nước, giữ dinh dưỡng."),
    long: MESSAGES["rothc.glossary"],
  },
  {
    id: "ph",
    group: "soil",
    term: L("Soil pH", "pH đất"),
    short: L("Acidity of the soil; below about 5.5 many upland crops struggle.", "Độ chua của đất; dưới khoảng 5,5 nhiều cây màu khó phát triển."),
    long: L(
      "Acid-sulphate soils in parts of the Mekong Delta can be very acidic. A lab soil test is the only reliable value; liming and raised beds are common local fixes to discuss with extension staff.",
      "Đất phèn ở một số vùng ĐBSCL có thể rất chua. Chỉ xét nghiệm đất mới cho giá trị đáng tin; bón vôi và lên liếp là cách địa phương hay dùng, nên trao đổi với cán bộ khuyến nông.",
    ),
  },
  {
    id: "bare-soil",
    group: "soil",
    term: L("Bare soil under rain (erosion proxy)", "Đất trống dưới mưa (chỉ báo xói mòn)"),
    short: L("Months with no living crop while rain falls — when soil and nutrients wash away most.", "Những tháng không có cây sống trong khi trời mưa — lúc đất và dinh dưỡng dễ bị cuốn trôi nhất."),
    long: L(
      "The index adds up the bare share of each month weighted by its rain and heavy-rain days. Flat delta fields lose little soil to slope erosion, but bare wet soil still loses nutrients and grows weeds. Slope data (SRTM) is not used yet.",
      "Chỉ số cộng phần đất trống của mỗi tháng, nhân theo lượng mưa và số ngày mưa lớn. Ruộng phẳng ở ĐBSCL ít bị xói theo dốc, nhưng đất trống ướt vẫn mất dinh dưỡng và mọc cỏ. Chưa dùng dữ liệu độ dốc (SRTM).",
    ),
  },
  {
    id: "ndvi",
    group: "satellite",
    term: L("NDVI (greenness index)", "NDVI (chỉ số độ xanh)"),
    short: L("A satellite measure of how green and dense plants are: about 0.2 bare or flooded, 0.8 very green.", "Thước đo độ xanh, độ dày của cây từ vệ tinh: khoảng 0,2 là đất trống/ngập nước, 0,8 là rất xanh."),
    long: L(
      "NDVI compares red and near-infrared light reflected by plants. MODIS gives a value every 16 days for a 250 m square, which may include canals, roads and neighbours' fields. Clouds can lower a value.",
      "NDVI so sánh ánh sáng đỏ và cận hồng ngoại mà lá cây phản xạ. MODIS cho một giá trị mỗi 16 ngày cho ô vuông 250 m, có thể gồm cả kênh, đường và ruộng hàng xóm. Mây có thể làm giá trị thấp đi.",
    ),
  },
  {
    id: "resolution",
    group: "satellite",
    term: L("Spatial resolution / pixel", "Độ phân giải / điểm ảnh"),
    short: L("The size of the ground square one satellite value describes.", "Kích thước ô đất mà một giá trị vệ tinh mô tả."),
    long: L(
      "NASA POWER ≈ 55 km, GPM rain ≈ 11 km, SMAP 9 km, MODIS 250 m to 5.6 km, Landsat 30 m, ECOSTRESS 70 m. A typical Mekong field of 1–3 ha is far smaller than most of these squares.",
      "NASA POWER ≈ 55 km, mưa GPM ≈ 11 km, SMAP 9 km, MODIS 250 m đến 5,6 km, Landsat 30 m, ECOSTRESS 70 m. Một thửa ruộng 1–3 ha ở ĐBSCL nhỏ hơn rất nhiều so với hầu hết các ô này.",
    ),
  },
  {
    id: "reanalysis",
    group: "satellite",
    term: L("Satellite vs ground measurement", "Đo bằng vệ tinh và đo tại ruộng"),
    short: L("Satellites see wide areas often; ground sensors see one spot precisely.", "Vệ tinh nhìn vùng rộng và thường xuyên; thiết bị tại ruộng đo chính xác một điểm."),
    long: L(
      "NASA POWER blends satellite data with a weather model (reanalysis), so it covers every place but smooths local detail and can be warmer or drier than a nearby station. Combining both — satellite for the pattern, a rain gauge or soil test for your field — gives the most reliable picture.",
      "NASA POWER kết hợp dữ liệu vệ tinh với mô hình thời tiết (tái phân tích), nên phủ mọi nơi nhưng làm mượt chi tiết địa phương và có thể nóng hơn hoặc khô hơn trạm đo gần đó. Kết hợp cả hai — vệ tinh cho xu hướng, thùng đo mưa hay xét nghiệm đất cho ruộng của mình — cho bức tranh đáng tin nhất.",
    ),
  },
  {
    id: "rotation",
    group: "crop",
    term: L("Crop rotation", "Luân canh cây trồng"),
    short: L("Growing different crops one after another on the same field.", "Trồng các loại cây khác nhau nối tiếp trên cùng thửa ruộng."),
    long: L(
      "Rotation breaks pest and disease cycles, varies rooting depth and can add nitrogen when legumes are included. In the Mekong Delta a common form is 'rice – upland crop' (lúa – màu).",
      "Luân canh giúp cắt vòng đời sâu bệnh, thay đổi độ sâu rễ và bổ sung đạm khi có cây họ đậu. Ở ĐBSCL hình thức phổ biến là “lúa – màu”.",
    ),
  },
  {
    id: "n-fixing",
    group: "crop",
    term: L("Nitrogen-fixing crops (legumes)", "Cây cố định đạm (cây họ đậu)"),
    short: L("Beans and peanuts host bacteria in root nodules that turn air nitrogen into fertiliser.", "Đậu xanh, đậu nành, đậu phộng có vi khuẩn ở nốt rễ biến đạm trong không khí thành phân bón."),
    long: L(
      "Part of that nitrogen stays for the next crop, so the following rice may need less urea. The app credits 20–50 kg N/ha depending on the legume.",
      "Một phần đạm đó để lại cho vụ sau, nên lúa vụ sau có thể bớt phân urê. App tính phần để lại 20–50 kg N/ha tùy loại cây họ đậu.",
    ),
  },
  {
    id: "cover-crop",
    group: "crop",
    term: L("Cover crop / green manure", "Cây che phủ / cây phân xanh"),
    short: L("A crop grown to protect and feed the soil rather than to sell.", "Cây trồng để che và nuôi đất thay vì để bán."),
    long: L(
      "Sesbania (điền thanh) tolerates flooding, grows fast and is ploughed in before the next rice, adding organic matter and nitrogen. It also keeps the soil covered in months that would otherwise be bare.",
      "Điền thanh chịu ngập, mọc nhanh và được cày vùi trước vụ lúa sau, bổ sung chất hữu cơ và đạm. Nó còn che phủ đất trong những tháng lẽ ra để trống.",
    ),
  },
  {
    id: "deep-root",
    group: "crop",
    term: L("Deep-rooting crops", "Cây rễ sâu"),
    short: L("Crops like maize and Sesbania that root below the rice plough layer.", "Cây như bắp, điền thanh có rễ ăn sâu hơn lớp đất cày của lúa."),
    long: L(
      "Deep roots open channels that help water soak in and bring up nutrients from deeper layers. Flooded rice roots stay in the top 20–30 cm.",
      "Rễ sâu tạo đường cho nước thấm xuống và đưa dinh dưỡng từ tầng sâu lên. Rễ lúa ngập chỉ ở 20–30 cm trên cùng.",
    ),
  },
  {
    id: "drought-tolerant",
    group: "crop",
    term: L("Drought-tolerant crops", "Cây chịu hạn"),
    short: L("Crops like sesame and mung bean that finish with little water.", "Cây như mè, đậu xanh có thể cho thu hoạch với ít nước."),
    long: L(
      "They suit the dry season when canal water is short or salty, but most dislike waterlogging, so drainage matters if rain comes early.",
      "Hợp mùa khô khi nước kênh thiếu hoặc nhiễm mặn, nhưng phần lớn kỵ ngập úng, nên cần thoát nước tốt nếu mưa đến sớm.",
    ),
  },
  {
    id: "pest-break",
    group: "crop",
    term: L("Pest-cycle break", "Cắt vòng đời sâu bệnh"),
    short: L("Changing the crop family so pests that live on one crop lose their food.", "Đổi họ cây để sâu bệnh sống trên một loại cây mất nguồn thức ăn."),
    long: L(
      "Rice after rice after rice keeps a continuous host for rice pests such as planthoppers. The app counts how often the crop family changes between seasons over 3 years.",
      "Lúa nối tiếp lúa giữ nguồn thức ăn liên tục cho sâu bệnh hại lúa như rầy nâu. App đếm số lần đổi họ cây giữa các vụ trong 3 năm.",
    ),
  },
  {
    id: "heat-stress",
    group: "risk",
    term: L("Heat stress", "Sốc nhiệt"),
    short: L("Days hot enough (about 35 °C and above) to damage flowering and grain filling.", "Những ngày đủ nóng (khoảng từ 35 °C) để làm hỏng lúc ra hoa, vào chắc."),
    long: L(
      "The app counts days with a daily maximum of 35 °C or more from NASA POWER daily data. This reanalysis can run warmer than local stations, so compare with your own experience.",
      "App đếm số ngày có nhiệt độ cao nhất từ 35 °C trở lên theo số liệu ngày NASA POWER. Số liệu này có thể nóng hơn trạm đo địa phương, nên đối chiếu với kinh nghiệm thực tế.",
    ),
  },
  {
    id: "frost",
    group: "risk",
    term: L("Frost risk", "Nguy cơ sương giá"),
    short: L("Nights at or below 0 °C that can kill tender crops.", "Những đêm từ 0 °C trở xuống có thể làm chết cây non."),
    long: L(
      "Not a concern in the Mekong Delta, but important in temperate regions. The app shows a frost row only where NASA POWER records frost days.",
      "Không đáng lo ở ĐBSCL nhưng quan trọng ở vùng ôn đới. App chỉ hiện hàng sương giá khi NASA POWER ghi nhận có ngày sương giá.",
    ),
  },
  {
    id: "salinity",
    group: "risk",
    term: L("Salinity intrusion", "Xâm nhập mặn"),
    short: L("Sea water moving up rivers and canals in the dry season.", "Nước biển lấn sâu vào sông, kênh trong mùa khô."),
    long: L(
      "It reduces usable irrigation water from February to May and harms salt-sensitive crops such as mung bean and sesame. The app uses the risk level you entered for your farm.",
      "Làm giảm nước tưới dùng được từ tháng 2 đến tháng 5 và hại cây nhạy mặn như đậu xanh, mè. App dùng mức rủi ro anh/chị nhập cho trang trại.",
    ),
  },
  {
    id: "waterlogging",
    group: "risk",
    term: L("Waterlogging", "Ngập úng"),
    short: L("Roots sitting in water for days; most upland crops suffer.", "Rễ bị ngâm nước nhiều ngày; phần lớn cây màu bị hại."),
    long: L(
      "Rice and Sesbania tolerate it; mung bean, sesame, peanut and maize do not. Raised beds and drainage furrows reduce the risk.",
      "Lúa và điền thanh chịu được; đậu xanh, mè, đậu phộng, bắp thì không. Lên liếp và làm rãnh thoát nước giúp giảm rủi ro.",
    ),
  },
  {
    id: "shannon",
    group: "model",
    term: L("Diversity index (Shannon H′)", "Chỉ số đa dạng (Shannon H′)"),
    short: L("0 means the same crop every season; above 0.9 means a varied rotation.", "0 là cùng một cây mọi vụ; trên 0,9 là luân canh đa dạng."),
    long: L(
      "It grows when there are more crops and when seasons are shared more evenly between them, counted over the last 3 years.",
      "Chỉ số tăng khi có nhiều loại cây hơn và các vụ chia đều hơn giữa chúng, tính trong 3 năm gần nhất.",
    ),
  },
  {
    id: "range",
    group: "model",
    term: L("Range (10–90%)", "Khoảng dao động (10–90%)"),
    short: L("The spread of results across dry and wet years in the 10-year record.", "Độ trải của kết quả giữa năm khô và năm ẩm trong chuỗi 10 năm."),
    long: L(
      "Each season is computed with the weather of every past year. The middle value is shown; 10% of years needed less and 10% needed more than the range shows.",
      "Mỗi vụ được tính với thời tiết của từng năm trong quá khứ. App hiện giá trị giữa; 10% số năm cần ít hơn và 10% cần nhiều hơn khoảng này.",
    ),
  },
  {
    id: "scenario",
    group: "model",
    term: L("Scenario, not a forecast", "Kịch bản, không phải dự báo"),
    short: L("“If you plant this, under these assumptions, this could happen.”", "“Nếu trồng thế này, với những giả định này, có thể xảy ra điều này.”"),
    long: L(
      "The app replays past weather with your planting plan. It does not know next year's weather, prices or pests. Use it to compare options, then decide with local experts.",
      "App chạy lại thời tiết quá khứ với kế hoạch trồng của anh/chị. App không biết thời tiết, giá cả hay sâu bệnh năm tới. Dùng để so sánh các lựa chọn, rồi quyết định cùng chuyên gia địa phương.",
    ),
  },
];

export const GLOSSARY_MAP: Record<string, GlossaryEntry> = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));
