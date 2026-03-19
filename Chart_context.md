## Tổng hợp: Import dữ liệu & Biểu đồ dự đoán

---

### 1. Chức năng Import file CSV/XLSX

#### 1.1 Cấu trúc file

**File bắt buộc — `consumption_history.csv`**

Map trực tiếp vào bảng `consumption_history`, là input cốt lõi cho cả 3 mô hình.

```csv
product_code,period_start_date,period_end_date,actual_consumption,planned_consumption,actual_lead_time_days,actual_supply_rate,notes
NL001,01-01-2023,31-01-2023,132.00,120.00,29,170.00,Tháng Tết
NL001,01-02-2023,28-02-2023,128.00,120.00,31,165.00,
NL001,01-03-2023,31-03-2023,105.00,100.00,28,168.00,
```

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `product_code` | String | ✓ | Phải khớp với `code` trong bảng `products` |
| `period_start_date` | Date (dd-MM-yyyy) | ✓ | Ngày đầu kỳ |
| `period_end_date` | Date (dd-MM-yyyy) | ✓ | Ngày cuối kỳ |
| `actual_consumption` | Decimal > 0 | ✓ | Q thực tế — biến mục tiêu của mọi mô hình |
| `planned_consumption` | Decimal | ✗ | Q kế hoạch — để tính sai số hồi tố |
| `actual_lead_time_days` | Integer ≥ 1 | ✓ | L thực tế — cần để forecast L kỳ sau |
| `actual_supply_rate` | Decimal | ✗ | K thực tế — validate với K từ Supplier Service |
| `notes` | String | ✗ | Ghi chú tự do |

**File bổ sung — `external_factors.csv`**

Quyết định Seasonal Regression có thực sự tốt hơn Holt-Winters không. Nếu thiếu file này, Seasonal Regression không có biến độc lập — về bản chất chỉ là Holt-Winters phức tạp hơn.

```csv
period_start_date,month,quarter,is_tet_holiday,is_summer,is_year_end,working_days,avg_temperature,promotion_flag
01-01-2023,1,1,1,0,0,21,20.5,0
01-02-2023,2,1,1,0,0,17,21.2,0
01-06-2023,6,2,0,1,0,25,32.5,0
01-07-2023,7,3,0,1,0,26,33.2,0
```

| Trường | Kiểu | Lý do cần thiết |
|---|---|---|
| `period_start_date` | Date | Key để join với consumption_history |
| `month` | Integer 1–12 | Seasonal index theo tháng |
| `quarter` | Integer 1–4 | Seasonal index theo quý |
| `is_tet_holiday` | 0/1 | Tết âm lịch trôi dạt giữa tháng 1–2 mỗi năm, dùng `month` sẽ bị nhiễu — cần dummy variable riêng |
| `is_summer` | 0/1 | Tháng 6–8, tiêu thụ nhóm thực phẩm tăng rõ rệt |
| `is_year_end` | 0/1 | Tháng 12, tích trữ cuối năm |
| `working_days` | Integer | Số ngày làm việc thực tế — correlation cao nhất với actual_consumption trong ngành sản xuất, thường > 0.7 |
| `avg_temperature` | Decimal | Tốt hơn `is_summer` vì là biến liên tục, relevant cho dầu ăn, nước uống |
| `promotion_flag` | 0/1 | Nếu không đánh dấu, model học sai — tưởng tháng đó mùa vụ cao trong khi thực ra do khuyến mãi |

---

#### 1.2 Validation trước khi đưa vào mô hình

**Validation cứng — lỗi thì reject toàn bộ file:**

- `product_code` không tồn tại trong bảng `products`
- `actual_consumption ≤ 0` — giá trị 0 thường là missing data, không phải tiêu thụ thật
- `period_end_date < period_start_date`
- Trùng lặp `(product_code, period_start_date)` trong cùng file
- Trùng lặp với dữ liệu đã có trong database

**Validation mềm — cảnh báo nhưng vẫn import:**

- Missing period: có khoảng trống giữa các kỳ liên tiếp — WMA và Holt-Winters bị sai nếu chuỗi thời gian không liên tục
- `actual_consumption` lệch hơn 3 lần so với trung bình các kỳ lân cận — có thể là outlier hoặc nhập sai
- `actual_lead_time_days` quá lớn so với `committed_lead_time_days` trong Supplier Service — NCC giao trễ bất thường

---

#### 1.3 Ngưỡng dữ liệu và mô hình được chọn

Sau khi import, hệ thống tự chọn mô hình dựa trên số điểm dữ liệu của từng `product_code`:

| Số kỳ dữ liệu | Mô hình | Chất lượng dự đoán | Hiển thị với người dùng |
|---|---|---|---|
| < 6 | WMA | Kém — chỉ dựa trên vài điểm gần nhất | ⚠️ "Cần thêm dữ liệu để dự đoán tốt hơn" |
| 6–18 | Holt-Winters | Trung bình — detect được trend và seasonality cơ bản | ℹ️ "Đủ dữ liệu cho dự đoán có trend theo mùa" |
| > 18 (lý tưởng ≥ 24) | Seasonal Regression | Tốt — dùng được external factors | ✓ "Mô hình đầy đủ, kết quả tin cậy" |

Ngưỡng 24 kỳ (2 năm) là lý tưởng vì Holt-Winters cần ít nhất 2 chu kỳ mùa vụ hoàn chỉnh để ước lượng seasonal component chính xác. Dưới 2 chu kỳ, gamma (seasonal smoothing) bị ước lượng thiếu dữ liệu.

---

### 2. Biểu đồ thể hiện dự đoán

#### 2.1 Loại biểu đồ — Line Chart với Confidence Band

Biểu đồ chuẩn cho chuỗi thời gian có dự đoán. Cần vẽ đồng thời 4 thành phần:

**Đường 1 — Lịch sử thực tế** (màu xanh đậm, nét liền): toàn bộ `actual_consumption` đã import. Đây là sự thật đã xảy ra.

**Đường 2 — Dự đoán** (màu cam, nét đứt): giá trị Q dự đoán các kỳ tới. Nét đứt để người dùng hiểu ngay đây là ước tính.

**Vùng 3 — Confidence band** (màu cam nhạt, bán trong suốt): khoảng tin cậy tính từ MAPE. Nếu MAPE = 12% và Q dự đoán = 100 thì band là [88, 112]. Vùng rộng hay hẹp trực tiếp cho người dùng thấy mô hình đang tự tin hay không — không cần họ hiểu MAPE là gì.

**Đường 4 — Kế hoạch cũ** (màu xám nhạt, nét đứt mờ, optional): `planned_consumption` nếu có trong file import — để so sánh dự đoán mới với kế hoạch đã nhập trước đó.

**Đường thẳng đứng tại "Hôm nay"**: chia chart thành hai vùng rõ ràng — trái là lịch sử, phải là tương lai.

```
Tiêu thụ (tấn)
    │
140 │         ╭─╮                      ╭╌╌╌╌╌╌╮
    │        ╱   ╲                  ╭╯╌        ╰╌ upper bound
120 │   ╭───╯     ╲    ╭──╮       ╭╯
    │  ╱           ╲  ╱   ╲     ╭╯  ╌╌╌╌╌╌╌╌╌    dự đoán
100 │─╯              ╲╱    ╲   ╱
    │                       ╲ ╱  ╲╌╌╌╌╌╌╌╌╌╯     lower bound
 80 │                        │
    └────────────────────────┼──────────────────
                          Hôm nay
          ◄── Lịch sử ───►  ◄─── Dự đoán ───►
```

---

#### 2.2 Thông tin bổ sung quanh biểu đồ

**Model Badge — đặt ngay dưới tiêu đề:**

Hiển thị mô hình đang dùng và mức độ tin cậy. Màu badge thay đổi theo MAPE:

```
┌──────────────────────────────────────────────┐
│  Bột mì số 11 — Dự đoán tháng 4/2025        │
│  [Holt-Winters]   MAPE: 8.3%   ✓ Tin cậy cao│
└──────────────────────────────────────────────┘
```

| MAPE | Màu badge | Nhãn | Hành động |
|---|---|---|---|
| < 10% | Xanh lá | ✓ Tin cậy cao | Cho phép dùng giá trị dự đoán |
| 10–20% | Vàng | ⚠️ Chấp nhận được | Cho phép dùng, hiện cảnh báo |
| > 20% | Đỏ | ✗ Cần xem xét lại | Disable nút "Dùng giá trị này", bắt nhập thủ công |

Khi MAPE > 20% phải disable nút "Dùng giá trị này" — tránh tình huống kế hoạch được tạo từ dự đoán sai mà người dùng không hay biết.

**Summary Panel — 3 con số đặt bên phải chart:**

```
┌──────────────┬──────────────┬──────────────┐
│  Dự đoán Q  │  So kỳ trước │  So TB 6 kỳ  │
│   112 tấn   │   ▲ +5.6%   │   ▼ -3.1%    │
└──────────────┴──────────────┴──────────────┘
```

Hai con số so sánh giúp người dùng phát hiện dự đoán bất thường ngay lập tức — nếu tăng 40% so với kỳ trước thì cần kiểm tra lại trước khi dùng.

**Seasonality Insight — chỉ hiện khi dùng Holt-Winters hoặc Seasonal Regression:**

```
💡 Tháng 4 thường thấp hơn trung bình 8% (dựa trên 2 năm lịch sử)
   Tháng cao nhất: Tháng 1 (+32%)   Tháng thấp nhất: Tháng 11 (-17%)
```

Đây là thứ phân biệt hệ thống với một spreadsheet đơn giản — model không chỉ đưa ra con số mà còn giải thích tại sao.

---

#### 2.3 Layout màn hình tổng thể

```
┌──────────────────────────────────────────────────────────────┐
│  Bột mì số 11                         [Tháng] [Quý] [Năm]  │
│  [Holt-Winters]  MAPE: 8.3%  ✓ Tin cậy cao                  │
├──────────────────────────────────────┬───────────────────────┤
│                                      │   Dự đoán Q           │
│                                      │  ┌─────────────────┐  │
│                                      │  │    112 tấn      │  │
│        LINE CHART CHÍNH              │  └─────────────────┘  │
│   (lịch sử + dự đoán + band)        │  ▲ +5.6% so kỳ trước  │
│                                      │  ▼ -3.1% so TB 6 kỳ  │
│                                      ├───────────────────────┤
│                                      │  Khoảng tin cậy       │
│                                      │  [ 88 tấn — 118 tấn ] │
│                                      ├───────────────────────┤
│                                      │  💡 Tháng 4 thường    │
│                                      │  thấp hơn TB 8%       │
│                                      │  dựa trên 2 năm       │
├──────────────────────────────────────┴───────────────────────┤
│   [✓ Dùng giá trị dự đoán: 112 tấn]    [Nhập thủ công]      │
└──────────────────────────────────────────────────────────────┘
```

---

#### 2.4 Kết nối với luồng tạo kỳ kế hoạch

Hai nút ở cuối màn hình là điểm kết nối trực tiếp với `InventoryParameterRequest`:

**Nút "Dùng giá trị dự đoán"** → tự động điền vào request:
```json
{
  "demandQ": 112,
  "qIsSuggested": true,
  "suggestionModel": "HOLT_WINTERS",
  "suggestionMape": 8.3
}
```

**Nút "Nhập thủ công"** → mở input field cho người dùng tự nhập Q, `qIsSuggested = false`. Luôn hiển thị nút này kể cả khi MAPE tốt — người dùng có thể có thông tin thực tế mà mô hình không biết (ví dụ: sắp có đơn hàng lớn bất thường).