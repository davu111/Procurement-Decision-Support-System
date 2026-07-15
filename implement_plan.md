# Implement Plan: Hỗ trợ quyết định nhập hàng dựa trên Lead Time

## 1. Bối cảnh

Hệ thống hiện tại đã lưu trữ dữ liệu lead time (`snapshotLeadTimeL`, `actualLeadTimeDays`) và có
forecast lead time (`ForecastOrchestrator.forecastLeadTime()`), nhưng các thành phần này chưa thực
sự kết nối với nhau để hỗ trợ quyết định nhập hàng. Cụ thể có 3 khoảng trống:

1. Forecast lead time chỉ mang tính tham khảo (hiển thị trong `ForecastSuggestionResponse`),
   không được dùng khi tính toán kế hoạch thực tế — hệ thống vẫn dùng `committedLeadTimeDays`
   từ nhà cung cấp.
2. Không có chỉ số đánh giá độ tin cậy nhà cung cấp (cam kết vs thực tế).
3. Điểm đặt hàng `B = Q × L` là công thức tất định, không có vùng đệm an toàn (safety stock)
   cho biến động lead time.

Tài liệu này mô tả kế hoạch triển khai cho cả 3 vấn đề.

---

## 2. Vấn đề 1 — Supplier Reliability Score

### Hiện trạng

`ConsumptionHistory.actualLeadTimeDays` đã lưu lead time thực tế theo từng kỳ, nhưng không có
nơi nào tổng hợp để so sánh với `committedLeadTimeDays` của nhà cung cấp.

### Mục tiêu

Tính toán và hiển thị độ lệch giữa lead time cam kết và thực tế, để người dùng biết nhà cung cấp
nào đáng tin cậy.

### Thiết kế

**Công thức:**

```
avgActualLeadTime = trung bình actualLeadTimeDays trong N kỳ gần nhất (N = 6 hoặc toàn bộ nếu dữ liệu lịch sử < 6>)
stdDevLeadTime     = độ lệch chuẩn actualLeadTimeDays trong N kỳ gần nhất
deviationRate      = (avgActualLeadTime - committedLeadTimeDays) / committedLeadTimeDays
reliabilityScore   = phân loại dựa trên deviationRate và stdDevLeadTime:
    - "RELIABLE"    : |deviationRate| <= 10% và stdDevLeadTime thấp
    - "MODERATE"    : |deviationRate| <= 25%
    - "UNRELIABLE"  : |deviationRate| > 25% hoặc stdDevLeadTime cao
```

### Thay đổi cần thiết

**DTO mới:** `SupplierReliabilityResponse`

```java
Long productId;
Integer committedLeadTimeDays;
Double  avgActualLeadTimeDays;
Double  stdDevLeadTimeDays;
Double  deviationRate;
String  reliabilityLevel;   // RELIABLE | MODERATE | UNRELIABLE
Integer dataPointsUsed;
String  recommendation;     // text gợi ý hành động
```

**Service:** thêm method trong `ForecastOrchestrator` hoặc tách riêng `SupplierReliabilityService`:

```java
SupplierReliabilityResponse calculateReliability(Long productId);
```

**Endpoint mới:**

```
GET /api/inventory/supplier-reliability/{productId}
```

### Không cần migration DB

Dữ liệu đã có sẵn trong `consumption_history` và `supplier_products` (qua `SupplierServiceClient`).

### Độ ưu tiên: **Cao** (nền tảng cho vấn đề 2 và 3)

---

## 3. Vấn đề 2 — Liên kết Forecast Lead Time vào tính toán thực tế

### Hiện trạng

`resolveSnapshot()` trong `InventoryPlanningService` luôn ưu tiên `committedLeadTimeDays` từ
supplier, bỏ qua `forecastLeadTime()` dù forecast có thể chính xác hơn dựa trên lịch sử thực tế.

### Mục tiêu

Cho phép người dùng chọn nguồn lead time khi lập kế hoạch: cam kết nhà cung cấp, hoặc dự đoán
từ lịch sử thực tế — đồng thời cảnh báo khi 2 nguồn lệch nhau đáng kể.

### Thiết kế

**Logic mới trong `resolveSnapshot()`:**

```
1. Lấy committedLeadTimeDays từ SupplierServiceClient (như cũ)
2. Lấy forecastLeadTime từ ForecastOrchestrator.forecastLeadTime(productId)
3. Nếu deviationRate (từ vấn đề 1) > ngưỡng cảnh báo (ví dụ 20%):
   → Đính kèm cảnh báo vào response, để frontend hiển thị
4. Nguồn L cuối cùng dùng để tính toán phụ thuộc vào lựa chọn người dùng:
   - request.leadTimeSource = "COMMITTED" (mặc định, giữ hành vi cũ)
   - request.leadTimeSource = "FORECAST"  (dùng forecastLeadTime)
   - request.leadTimeSource = "MANUAL"    (giữ hành vi cũ)
```

### Thay đổi cần thiết

**`InventoryParameterRequest`:** thêm field

```java
private String leadTimeSource; // "COMMITTED" | "FORECAST" | "MANUAL", mặc định COMMITTED
```

**`InventoryPlanningService.resolveSnapshot()`:** thêm nhánh xử lý `FORECAST`, gọi
`forecastOrchestrator.forecastLeadTime(productId)` và dùng `forecastValue` (đơn vị ngày) để
tính `leadTimeL`.

**`InventoryParameter`:** thêm field lưu lại nguồn đã dùng (audit trail)

```java
@Column(name = "lead_time_source", length = 20)
private String leadTimeSource;
```

**Response `InventoryCalculationResult`:** thêm field cảnh báo

```java
Boolean leadTimeDeviationWarning;
String  leadTimeDeviationMessage;
```

### Migration cần thiết

```sql
ALTER TABLE inventory_parameters
    ADD COLUMN lead_time_source VARCHAR(20) NOT NULL DEFAULT 'COMMITTED'
        AFTER snapshot_lead_time_l;
```

### Độ ưu tiên: **Trung bình** (phụ thuộc vấn đề 1 để có dữ liệu deviation)

---

## 4. Thứ tự triển khai đề xuất

```
Bước 1 (1-2 ngày)
  └─ Vấn đề 1: Supplier Reliability Score
     → Nền tảng dữ liệu (avgActualLeadTime, stdDevLeadTime) cho 2 bước sau
     → Không có migration, rủi ro thấp, có thể release độc lập

Bước 2 (2-3 ngày)
  └─ Vấn đề 2: Liên kết Forecast Lead Time
     → Thêm leadTimeSource, cảnh báo deviation
     → Migration nhỏ, không ảnh hưởng kế hoạch cũ (default COMMITTED giữ hành vi hiện tại)

```

## 6. Câu hỏi cần quyết định trước khi code

1. Ngưỡng N kỳ lịch sử tối thiểu để tính `stdDevLeadTime` đáng tin cậy là bao nhiêu? (đề xuất 3,
   tối ưu là 6+). Trả lời N = 3
2. Service level mặc định 95% (Z=1.65) có phù hợp với đặc thù hàng hóa (than, bao bì...) không? Trả lời: Phù hợp
