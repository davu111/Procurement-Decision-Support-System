# Implement Plan: Kiểm kê kho & Phân tích hiệu quả tồn kho

## 1. Bối cảnh

Hệ thống hiện tại tính tồn kho hoàn toàn dựa trên mô phỏng (`simulateInventory`), không có điểm
neo thực tế nào từ việc đếm kho. Đồng thời, `actualDeliveryDate` đã tồn tại trong `OrderSchedule`
nhưng chưa được khai thác để phân tích hiệu quả vận hành. Tài liệu này bổ sung 3 module:

1. **Kiểm kê kho (Stocktaking)** — tạo điểm neo thực tế, đo thất thoát
2. **Phân tích tỷ lệ thất thoát (Loss Rate)** — dùng dữ liệu từ kiểm kê
3. **Phân tích Service Level / tỷ lệ chờ nhập hàng** — dùng dữ liệu giao hàng thực tế

**Quyết định đã chốt:**
- Tần suất kiểm kê: **hàng tháng**
- Ngưỡng cảnh báo thất thoát: **> 5%**
- Tính stockout: **on-the-fly** (không lưu bảng `StockoutEvent` riêng)

---

## 2. Module A — Kiểm kê kho (Stocktaking)

### Entity mới: `StockCount`

```java
@Entity
@Table(name = "stock_counts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "count_date"}))
public class StockCount {

    @Id @GeneratedValue
    private Long id;

    @ManyToOne @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "count_date", nullable = false)
    private LocalDate countDate;

    @Column(name = "system_quantity", precision = 18, scale = 4, nullable = false)
    private BigDecimal systemQuantity;     // tự động tính tại thời điểm tạo phiếu

    @Column(name = "actual_quantity", precision = 18, scale = 4)
    private BigDecimal actualQuantity;     // null cho đến khi người kiểm kê nhập

    @Column(name = "variance_qty", precision = 18, scale = 4)
    private BigDecimal varianceQty;        // = actual - system, tính khi confirm

    @Column(name = "variance_rate", precision = 8, scale = 4)
    private BigDecimal varianceRate;       // = varianceQty / systemQuantity

    @Column(name = "variance_value", precision = 18, scale = 4)
    private BigDecimal varianceValue;      // = varianceQty * unitPriceC tại thời điểm đó

    @Column(name = "counted_by", length = 100)
    private String countedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";       // DRAFT | CONFIRMED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
}
```

### Migration

```sql
CREATE TABLE stock_counts (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id       BIGINT NOT NULL,
    count_date       DATE NOT NULL,
    system_quantity  DECIMAL(18,4) NOT NULL,
    actual_quantity  DECIMAL(18,4) NULL,
    variance_qty     DECIMAL(18,4) NULL,
    variance_rate    DECIMAL(8,4) NULL,
    variance_value   DECIMAL(18,4) NULL,
    counted_by       VARCHAR(100) NULL,
    notes            TEXT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at     DATETIME NULL,

    CONSTRAINT fk_stock_count_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT uq_stock_count_product_date UNIQUE (product_id, count_date)
);

CREATE INDEX idx_stock_count_product_status ON stock_counts(product_id, status);
```

> Unique constraint `(product_id, count_date)` đảm bảo không tạo trùng phiếu kiểm kê cho cùng
> một sản phẩm trong cùng một ngày. Với tần suất hàng tháng, frontend nên gợi ý `count_date`
> mặc định là ngày cuối tháng hoặc đầu tháng kế tiếp.

### Service

**`StockCountService`:**

```java
public interface StockCountService {

    /**
     * Tạo phiếu kiểm kê mới — tự động tính systemQuantity bằng cách tái sử dụng
     * logic simulateInventory hiện có trong InventoryPlanningService tại countDate.
     */
    StockCountResponse createDraft(Long productId, LocalDate countDate, String countedBy);

    /**
     * Nhập actualQuantity và xác nhận phiếu — chốt variance, không sửa được nữa.
     */
    StockCountResponse confirm(Long stockCountId, BigDecimal actualQuantity, String notes);

    List<StockCountResponse> getHistory(Long productId);

    /**
     * Lấy checkpoint CONFIRMED gần nhất trước một ngày cụ thể.
     * Dùng để pre-fill initialInventory khi lập kế hoạch mới.
     */
    Optional<StockCount> findLatestConfirmedBefore(Long productId, LocalDate date);
}
```

**Lưu ý khi implement `createDraft`:** cần expose lại logic mô phỏng tồn kho trong
`InventoryPlanningService.simulateInventory()` thành một method dùng chung (hiện tại đang là
`private`), vì cả `predictInventory` lẫn `StockCountService` đều cần dùng.

```java
// Trong InventoryPlanningService, đổi visibility:
public BigDecimal simulateInventoryAt(Long productId, LocalDate targetDate) { ... }
```

### Tích hợp vào luồng lập kế hoạch

Trong `InventoryPlanningService.createAndCalculate()`, phần auto-detect tồn kho đầu kỳ cần
ưu tiên theo thứ tự:

```
1. request.initialInventory (người dùng nhập tay)               — ưu tiên cao nhất
2. StockCount CONFIRMED gần nhất trước planStartDate              — ưu tiên thứ hai (chính xác hơn)
3. simulateInventory() từ kế hoạch ACTIVE liền kề (như hiện tại) — fallback cuối cùng
```

### Endpoint

```
POST /api/stock-counts
  Body: { productId, countDate, countedBy }
  → tạo phiếu DRAFT, tự động tính systemQuantity

PUT /api/stock-counts/{id}/confirm
  Body: { actualQuantity, notes }
  → tính variance, chuyển status=CONFIRMED

GET /api/stock-counts/{productId}
  → lịch sử kiểm kê, sort theo countDate giảm dần
```

### Độ ưu tiên: **Cao** (nền tảng cho Module B)

---

## 3. Module B — Phân tích tỷ lệ thất thoát (Loss Rate Analytics)

### Phụ thuộc
Module A — chỉ tính được khi có ít nhất 1 phiếu `CONFIRMED`. Khuyến nghị có tối thiểu 2-3 kỳ
kiểm kê để kết quả có ý nghĩa thống kê.

### Công thức

```
lossRate(kỳ) = Σ |varianceQty|  (chỉ tính khi varianceQty < 0, tức actual < system)
               ──────────────────────────────────────────────────────────────────
               Σ systemQuantity (của các phiếu CONFIRMED trong kỳ)

lossValueTotal = Σ varianceValue  (chỉ tính phần âm)
```

### Logic cảnh báo (ngưỡng đã chốt: > 5%)

```java
if (latestVarianceRate.abs() > 0.05 && latestVarianceQty.signum() < 0) {
    // Cảnh báo thất thoát vượt ngưỡng cho LẦN KIỂM KÊ GẦN NHẤT
}

if (avgLossRate.compareTo(spoilageRate) ratio lệch > 30%) {
    // Đề xuất cập nhật spoilageRate trong WarehouseConfig
    // (liên kết với hệ số bảo quản I — xem phần "Liên kết hệ thống" bên dưới)
}
```

### DTO Response

```java
public class LossRateAnalysisResponse {
    Long productId;
    LocalDate fromDate, toDate;
    int stockCountsUsed;            // số phiếu CONFIRMED dùng để tính
    BigDecimal avgLossRate;         // tỷ lệ thất thoát trung bình trong kỳ
    BigDecimal totalLossValue;      // tổng giá trị thất thoát (VND)
    BigDecimal configuredSpoilageRate; // đang cấu hình trong WarehouseConfig
    Boolean exceedsWarningThreshold;   // true nếu > 5% ở lần kiểm kê gần nhất
    Boolean suggestUpdateSpoilageRate; // true nếu lệch đáng kể so với cấu hình
    String message;
    List<StockCountSummary> details;   // chi tiết từng phiếu kiểm kê trong kỳ
}
```

### Endpoint

```
GET /api/analytics/loss-rate/{productId}?from=&to=
```

### Độ ưu tiên: **Trung bình** (làm sau Module A, cần thời gian tích lũy dữ liệu)

---

## 4. Module C — Phân tích Service Level / Tỷ lệ chờ nhập hàng

### Việc cần làm trước: đảm bảo `actualDeliveryDate` được cập nhật

Kiểm tra hiện trạng: field này đã tồn tại trong `OrderSchedule` nhưng cần endpoint để người
dùng xác nhận ngày giao hàng thực tế.

```
PATCH /api/order-schedules/{id}/confirm-delivery
  Body: { actualDeliveryDate }
```

### Cách tính on-the-fly (theo quyết định đã chốt — không lưu bảng riêng)

```java
public ServiceLevelAnalysisResponse analyzeServiceLevel(
        Long productId, LocalDate from, LocalDate to) {

    List<OrderSchedule> schedules = scheduleRepository
            .findEffectiveByProductIdAndDateRange(productId, from, to);

    int totalCycles = 0;
    int stockoutCycles = 0;
    long totalDelayDays = 0;
    long totalStockoutDays = 0;

    for (OrderSchedule current : schedules) {
        totalCycles++;

        // Độ trễ giao hàng
        if (current.getActualDeliveryDate() != null) {
            long delay = ChronoUnit.DAYS.between(
                    current.getExpectedDeliveryDate(), current.getActualDeliveryDate());
            if (delay > 0) totalDelayDays += delay;
        }

        // Mô phỏng tồn kho trong chu kỳ này để xác định có chạm 0 không
        // → tái sử dụng simulateInventoryAt() theo từng ngày trong [orderDate, nextOrderDate)
        long stockoutDays = countStockoutDaysInCycle(current, schedules);
        if (stockoutDays > 0) {
            stockoutCycles++;
            totalStockoutDays += stockoutDays;
        }
    }

    double serviceLevel = totalCycles == 0 ? 1.0
            : 1.0 - ((double) stockoutCycles / totalCycles);

    return ServiceLevelAnalysisResponse.builder()
            .productId(productId)
            .totalCycles(totalCycles)
            .stockoutFrequency(totalCycles == 0 ? 0 : (double) stockoutCycles / totalCycles)
            .serviceLevel(serviceLevel)
            .avgStockoutDuration(stockoutCycles == 0 ? 0
                    : (double) totalStockoutDays / stockoutCycles)
            .avgDeliveryDelay(totalCycles == 0 ? 0
                    : (double) totalDelayDays / totalCycles)
            .build();
}
```

> **Lưu ý hiệu năng:** vì tính on-the-fly bằng mô phỏng từng ngày cho mỗi chu kỳ, với khoảng
> thời gian phân tích dài (nhiều năm) số lượng phép tính có thể lớn. Nếu sau này phát hiện
> chậm, có thể cân nhắc cache kết quả theo tháng thay vì tính lại từ đầu mỗi lần gọi — nhưng
> chưa cần làm ngay theo quyết định hiện tại.

### DTO Response

```java
public class ServiceLevelAnalysisResponse {
    Long productId;
    LocalDate fromDate, toDate;
    int totalCycles;
    double stockoutFrequency;     // số chu kỳ có stockout / tổng chu kỳ
    double serviceLevel;          // 1 - stockoutFrequency
    double avgStockoutDuration;   // ngày trung bình mỗi lần stockout
    double avgDeliveryDelay;      // ngày trễ giao hàng trung bình
}
```

### Endpoint

```
GET /api/analytics/service-level/{productId}?from=&to=
```

### Liên kết với implement_plan.md (Lead Time)

Dữ liệu `avgDeliveryDelay` tính ở module này chính là nguồn cho `stdDevLeadTime` trong
**Vấn đề 1 — Supplier Reliability Score** đã đề xuất trong `implement_plan.md`. Khi triển
khai cả hai, nên dùng chung hàm tính độ trễ giao hàng để tránh trùng lặp logic.

### Độ ưu tiên: **Trung bình–Cao** (không cần migration lớn, dữ liệu `actualDeliveryDate`
đã có sẵn — có thể làm song song hoặc ngay sau Module A)

---

## 5. Tổng hợp liên kết giữa các module

```
Module A (Kiểm kê)
   └─→ Checkpoint chính xác cho initialInventory khi lập kế hoạch / replan
   └─→ Nguồn dữ liệu duy nhất cho Module B

Module B (Thất thoát)
   └─→ So sánh với spoilageRate cấu hình → đề xuất cập nhật
   └─→ spoilageRate ảnh hưởng trực tiếp đến hệ số bảo quản I (đã thảo luận trước)

Module C (Service Level)
   └─→ avgDeliveryDelay → nguồn dữ liệu cho stdDevLeadTime
   └─→ Liên kết trực tiếp với Supplier Reliability Score (implement_plan.md)
```

---

## 6. Thứ tự triển khai đề xuất

```
Bước 1 (2-3 ngày)
  └─ Module A: Kiểm kê kho
     → Entity, migration, service, 3 endpoint cơ bản
     → Cần refactor simulateInventory() thành method dùng chung (public)
     → Tích hợp vào luồng auto-detect initialInventory hiện có

Bước 2 (1-2 ngày, có thể song song Bước 1)
  └─ Module C: Service Level
     → Không cần migration lớn, chỉ thêm endpoint confirm-delivery
       và endpoint phân tích on-the-fly
     → Cần coordinate với implement_plan.md (Vấn đề 1) để dùng chung
       logic tính độ trễ giao hàng

Bước 3 (1 ngày, sau khi có dữ liệu từ Bước 1)
  └─ Module B: Loss Rate
     → Phụ thuộc dữ liệu tích lũy từ Module A
     → Cần đợi ít nhất 1 kỳ kiểm kê để có dữ liệu thực tế trước khi release
       tính năng cảnh báo cho người dùng
```

---

## 7. Việc cần làm thêm (housekeeping)

- Đổi `InventoryPlanningService.simulateInventory()` từ `private` thành method dùng chung,
  đặt tên rõ ràng hơn (`simulateInventoryAt`), để cả `predictInventory`, `StockCountService`,
  và `ServiceLevelAnalytics` đều tái sử dụng được — tránh viết lại logic mô phỏng 3 lần.
- Cân nhắc thêm cron job nhắc nhở kiểm kê hàng tháng (ngoài phạm vi backend core, có thể để
  ở bước sau khi 3 module này ổn định).
