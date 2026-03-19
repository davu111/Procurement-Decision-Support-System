# FRONTEND CONTEXT DOCUMENT
# Hệ thống Quản lý Dự trữ — Tài liệu cho AI Agent xây dựng Frontend
# Phiên bản: 1.0 | Ngày: 2026-03

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mục đích
Hệ thống giúp doanh nghiệp sản xuất/thương mại **tối ưu hóa kế hoạch nhập hàng** dựa trên
mô hình dự trữ bổ sung dần (Gradual Replenishment Model). Người dùng biết chính xác:
- Khi nào cần đặt hàng
- Đặt bao nhiêu
- Chi phí tổng thể tối thiểu là bao nhiêu

### 1.2 Đối tượng người dùng
- **Người vận hành kho** — theo dõi lịch đặt hàng hàng ngày, cập nhật thực tế
- **Quản lý** — nhìn tổng thể kế hoạch, chi phí, hiệu quả dự báo AI

### 1.3 Kiến trúc backend (2 microservice)

```
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│   inventory-service             │    │   supplier-service           │
│   Spring Boot 3.2               │    │   Spring Boot 3.2            │
│   Port: 8080                    │◄───│   Port: 8081                 │
│   DB: inventory_db (MySQL 8)    │    │   DB: inventory_db (MySQL 8) │
└─────────────────────────────────┘    └──────────────────────────────┘
              ▲
              │ REST API
              │
       [ Frontend ]
       React + Vite
       Port: 3000 (dev)
```

Lưu ý: Cả 2 service hiện dùng chung 1 database `inventory_db` nhưng tách biệt về logic.
Frontend chỉ giao tiếp với **inventory-service (8080)**. Không gọi trực tiếp supplier-service.

---

## 2. DATABASE SCHEMA (tham khảo — không gọi DB trực tiếp từ FE)

### Bảng chính và quan hệ

```
suppliers (1) ──────< supplier_products (n)
                            │
products (1) ──────────────┘ (product_id, external ref)
    │
    ├──< inventory_parameters (n)   ← tham số kỳ kế hoạch
    │         │
    │         └──── inventory_results (1)  ← kết quả S*, n*, τ*, B, Z
    │                     │
    │                     └──< order_schedules (n)  ← lịch đặt hàng
    │
    └──< consumption_history (n)    ← lịch sử tiêu thụ thực tế (nền AI)

warehouse_config  ← cấu hình kho, tính hệ số I tự động
```

### Các trường quan trọng cần hiểu

**order_schedules** — bảng FE dùng nhiều nhất:
```
id, product_id, order_sequence, order_date, expected_delivery_date,
order_quantity (S*), estimated_cost (A + C×S*),
is_reorder_warning (boolean — sắp đến điểm B),
actual_order_date (null = chưa thực hiện),
actual_delivery_date (null = chưa nhận hàng),
actual_quantity (null = chưa cập nhật)
```

**inventory_parameters** — tham số kỳ kế hoạch:
```
product_id, planning_unit (MONTH|QUARTER|YEAR), plan_start_date,
demand_q (Q), storage_cost_coefficient_i (I),
snapshot_supply_rate_k (K — từ supplier),
snapshot_fixed_order_cost_a (A — từ supplier),
snapshot_unit_price_c (C — từ supplier),
snapshot_lead_time_l (L — từ supplier, đã quy đổi về đơn vị kỳ),
supplier_data_source (SUPPLIER_SERVICE|PREVIOUS_PERIOD|MANUAL),
q_is_suggested (boolean — Q do AI đề xuất không)
```

**inventory_results** — kết quả tối ưu:
```
optimal_order_qty_s (S*), optimal_order_count_n (n*),
optimal_cycle_time_tau (τ*), max_inventory_level (S*(1-Q/K)),
avg_inventory_level (Z), reorder_point_b (B), min_total_cost (D_min),
total_cost_with_purchase (D_min + C×Q), replenishment_time_tn (Tn),
m_value (m = floor(L/τ*))
```

---

## 3. API REFERENCE — INVENTORY SERVICE (port 8080)

### Response wrapper chung
Mọi API đều trả về cấu trúc:
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```
Lỗi: `success: false`, `data: null`, `message` chứa mô tả lỗi.

---

### 3.1 Products API

#### GET /api/products
Lấy danh sách mặt hàng đang active.

**Response data:** `Array<ProductResponse>`
```json
[
  {
    "id": 1,
    "code": "NL001",
    "name": "Bột mì số 11",
    "unit": "Tấn",
    "description": "Bột mì nhập khẩu...",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00",
    "updatedAt": "2025-01-01T00:00:00"
  }
]
```

#### GET /api/products/{id}
Lấy chi tiết một mặt hàng.

#### POST /api/products
Tạo mặt hàng mới.

**Request body:**
```json
{
  "code": "NL005",
  "name": "Tên mặt hàng",
  "unit": "Tấn",
  "description": "Mô tả"
}
```

#### PUT /api/products/{id}
Cập nhật mặt hàng (không đổi được code).

#### DELETE /api/products/{id}
Vô hiệu hóa mặt hàng (soft delete, isActive = false).

---

### 3.2 Inventory Planning API

#### POST /api/inventory/calculate
**Màn hình dùng:** Form tạo kỳ kế hoạch mới.

Hệ thống tự gọi Supplier Service lấy K, A, C, L. Nếu thất bại → fallback về kỳ trước.

**Request body:**
```json
{
  "productId": 1,
  "warehouseConfigId": 1,
  "planningUnit": "YEAR",
  "planStartDate": "2025-01-01",
  "demandQ": 1200.0,
  "storageCostCoefficientI": 0.1128,

  "manualSupplyRateK": null,
  "manualFixedOrderCostA": null,
  "manualUnitPriceC": null,
  "manualLeadTimeDays": null
}
```

Lưu ý `planningUnit`: `MONTH` | `QUARTER` | `YEAR`
- Tất cả giá trị Q, K, L phải theo cùng đơn vị này
- I nhập theo năm, backend tự quy đổi về đơn vị kỳ

**Response data:** `InventoryCalculationResult`
```json
{
  "optimalOrderQtyS": 111.88,
  "optimalOrderCountN": 10.73,
  "optimalCycleTimeTau": 0.093200,
  "maxInventoryLevel": 44.75,
  "avgInventoryLevel": 22.38,
  "reorderPointB": 99.96,
  "minTotalCost": 42920000.00,
  "totalCostWithPurchase": 10242920000.00,
  "replenishmentTimeTn": 0.055940,
  "mValue": 0,
  "demandQ": 1200.00,
  "supplyRateK": 2000.00,
  "fixedOrderCostA": 2000000.00,
  "unitPriceC": 8500000.00,
  "storageCoefficientI": 0.1128,
  "leadTimeL": 0.0833,
  "kMinusQFactor": 0.40
}
```

#### GET /api/inventory/suggest/{productId}?planningUnit=MONTH
**Màn hình dùng:** Form tạo kỳ kế hoạch — nút "Lấy gợi ý AI".

Trả về Q do AI đề xuất từ lịch sử tiêu thụ + thông tin supplier hiện tại.

**Response data:** `ForecastSuggestionResponse`
```json
{
  "productId": 1,
  "planningUnit": "MONTH",
  "suggestedQ": 105.50,
  "requiresManualInput": false,
  "supplierName": "Công ty TNHH Lương thực Miền Nam",
  "supplierProductId": 1,
  "currentSupplyRateK": 166.67,
  "currentFixedOrderCostA": 2000000.00,
  "currentUnitPriceC": 8500000.00,
  "currentLeadTimeDays": 30,
  "demandForecast": {
    "forecastValue": 105.50,
    "modelUsed": "HOLT_WINTERS",
    "dataPointsUsed": 24,
    "mape": 8.3,
    "mapeWarning": false
  },
  "leadTimeForecast": {
    "forecastValue": 0.0967,
    "modelUsed": "WMA",
    "dataPointsUsed": 5,
    "mape": null,
    "mapeWarning": false
  }
}
```

`requiresManualInput: true` → chưa đủ dữ liệu lịch sử, cần nhập Q thủ công.
`mapeWarning: true` → MAPE > 20%, gợi ý không đáng tin — hiển thị cảnh báo.

#### GET /api/inventory/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
**Màn hình dùng:** Calendar Heatmap, Timeline tổng thể.

Lấy toàn bộ lịch đặt hàng trong khoảng thời gian (tất cả sản phẩm).

**Response data:** `Array<OrderSchedule>`
```json
[
  {
    "id": 1,
    "orderSequence": 1,
    "orderDate": "2025-01-01",
    "expectedDeliveryDate": "2025-02-01",
    "orderQuantity": 111.88,
    "estimatedCost": 952980000.00,
    "isReorderWarning": false,
    "actualOrderDate": "2025-01-01",
    "actualDeliveryDate": "2025-02-03",
    "actualQuantity": 112.00
  }
]
```

Lưu ý: `product` và `inventoryResult` bị `@JsonIgnore` — không có trong response.
FE cần gọi thêm `/api/inventory/schedule/{productId}` nếu cần filter theo sản phẩm,
hoặc gọi `/api/products` trước để có map productId → tên sản phẩm.

**Vấn đề hiện tại:** API schedule không trả về `productId` trong response vì entity dùng
`@JsonIgnore`. Cần thêm endpoint hoặc DTO mới — xem mục 7 (Known Issues).

#### GET /api/inventory/schedule/{productId}?from=YYYY-MM-DD&to=YYYY-MM-DD
Lấy lịch đặt hàng của một sản phẩm cụ thể.

---

### 3.3 Consumption History API

#### POST /api/consumption-history
**Màn hình dùng:** Form nhập tiêu thụ thực tế cuối kỳ.

Đây là dữ liệu nền cho AI. Cần nhập đều đặn sau mỗi kỳ.

**Request body:**
```json
{
  "productId": 1,
  "planningUnit": "MONTH",
  "periodStartDate": "2025-01-01",
  "periodEndDate": "2025-01-31",
  "actualConsumption": 132.0,
  "plannedConsumption": 120.0,
  "actualLeadTimeDays": 29.0,
  "actualSupplyRate": 170.0,
  "notes": "Tháng Tết, tiêu thụ cao"
}
```

**Response message** cho biết trạng thái AI:
- `"Cần 3 điểm nữa để dùng Holt-Winters."` (< 6 điểm → đang dùng WMA)
- `"Cần 5 điểm nữa để dùng Seasonal Regression."` (6-17 điểm → Holt-Winters)
- `"Đang dùng mô hình Seasonal Regression - độ chính xác cao nhất."` (≥ 18 điểm)

#### GET /api/consumption-history/{productId}?planningUnit=MONTH
Lấy lịch sử tiêu thụ theo mặt hàng.

**Màn hình dùng:** Biểu đồ sawtooth, màn hình xem lịch sử.

---

### 3.4 Warehouse Config API

#### GET /api/warehouse-config
Lấy danh sách cấu hình kho.

#### GET /api/warehouse-config/default
Lấy cấu hình kho đang là mặc định.

**Response data:**
```json
{
  "id": 1,
  "configName": "Kho chính - HCM 2025",
  "interestRate": 0.0850,
  "warehouseMonthlyCost": 50000000.00,
  "warehouseMaxCapacity": 5000.00,
  "spoilageRate": 0.0150,
  "insuranceRate": 0.0050,
  "storageCostCoefficient": 0.1128,
  "isDefault": true
}
```

#### POST /api/warehouse-config
Tạo cấu hình kho mới. Backend tự tính `storageCostCoefficient` (I).

---

## 4. THIẾT KẾ UI — CÁC MÀN HÌNH

### 4.1 Dashboard (màn hình chính)

**Mục đích:** Trả lời câu hỏi "Hôm nay tôi cần làm gì?"

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  [🔴 2 cần xử lý ngay]  [🟡 3 sắp đến hạn]  [🟢 Ổn định: 8]  │  ← KPI row
├─────────────────────────────────────────────────────────┤
│  CẢNH BÁO ĐẶT HÀNG                                      │
│  ─────────────────────────────────────────────────────  │
│  🔴 Dầu ăn thực vật  │ Đặt NGAY  │ 43.98 tấn │ 970tr   │
│  🟡 Đường tinh luyện │ 3 ngày    │ 54.76 tấn │ 834tr   │
│  🟡 Bột mì số 11     │ 18 ngày   │ 111.88 tấn│ 952tr   │
│  🟢 Bao bì carton    │ 25 ngày   │ 30,759 thg│ 962tr   │
└─────────────────────────────────────────────────────────┘
```

**Logic tính "ngày còn lại":**
Lấy `order_date` của lần đặt hàng tiếp theo (chưa có `actual_order_date`) trừ cho ngày hôm nay.

**Màu sắc:**
- 🔴 Đỏ: `order_date <= today` hoặc `is_reorder_warning = true`
- 🟡 Vàng: `order_date` trong vòng 7 ngày tới
- 🟢 Xanh: còn > 7 ngày

**API calls:**
```
GET /api/products
GET /api/inventory/schedule?from={today}&to={today+365}
```
Combine hai response để hiển thị bảng cảnh báo.

---

### 4.2 Calendar Heatmap (thay thế Timeline)

**Mục đích:** Nhìn tổng thể cả năm — tuần nào bận, ngày nào có nhiều đơn.

**Thiết kế:**
```
                    LỊCH ĐẶT HÀNG 2025
  T1   T2   T3   T4   T5   T6   T7   T8   T9   T10  T11  T12
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
T │  │██│  │  │  │  │  │  │  │  │  │  │  ← mỗi ô = 1 ngày
2 │  │  │  │██│  │██│  │  │  │  │  │  │
3 │██│  │  │  │  │  │██│  │  │  │██│  │
4 │  │  │██│  │  │  │  │  │  │██│  │  │
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
```

**Màu sắc ô:**
- Trắng/xám nhạt: không có đơn hàng nào
- Xanh nhạt (#c6e48b): 1 đơn hàng
- Xanh vừa (#7bc96f): 2 đơn hàng
- Xanh đậm (#239a3b): 3 đơn hàng
- Đỏ (#e05d44): có đơn quá hạn chưa xử lý

**Hover tooltip:**
```
┌─────────────────────────┐
│ Thứ Ba, 15/01/2025      │
│ ─────────────────────── │
│ • Bột mì    111.88 tấn  │
│ • Bao bì    30,759 thùng│
│ Tổng chi phí: 1.91 tỷ  │
└─────────────────────────┘
```

**Click vào ô:** Mở side panel danh sách chi tiết các đơn hàng ngày đó.

**API call:**
```
GET /api/inventory/schedule?from={year}-01-01&to={year}-12-31
```
Transform response thành `Map<date_string, Array<order>>` để render heatmap.

**Thư viện gợi ý:** `react-calendar-heatmap` (đã có sẵn tooltip support) hoặc tự viết bằng SVG/CSS grid.

---

### 4.3 Chi tiết mặt hàng (Sawtooth Chart)

**Mục đích:** Xem biểu đồ tồn kho lý thuyết theo thời gian cho một sản phẩm cụ thể.

**Biểu đồ:**
- Trục X: thời gian (theo kỳ kế hoạch)
- Trục Y: số lượng tồn kho
- **Đường xanh dạng răng cưa** (lý thuyết): tồn kho tăng khi nhận hàng, giảm dần theo nhu cầu
- **Đường đỏ ngang** tại điểm B (reorder_point_b): ngưỡng cần đặt hàng
- **Đường vàng ngang** tại Z (avg_inventory_level): tồn kho trung bình
- **Đường thực tế** (màu xám nét đứt): nếu có `actual_quantity` từ order_schedules

**Markers trên trục X:**
- ▲ Mũi tên lên: ngày nhận hàng (expected hoặc actual)
- ● Chấm tròn: ngày đặt hàng

**API calls:**
```
GET /api/inventory/schedule/{productId}?from=...&to=...
GET /api/consumption-history/{productId}?planningUnit=MONTH
```

**Thư viện gợi ý:** Recharts `ComposedChart` (kết hợp LineChart + ReferenceLine + scatter).

---

### 4.4 Form tạo kỳ kế hoạch mới

**Luồng UX:**
```
Bước 1: Chọn mặt hàng + kỳ kế hoạch
         ↓
Bước 2: [Lấy gợi ý AI] → hiển thị Q đề xuất + thông tin supplier
         ↓
Bước 3: Nhập/confirm Q, I → submit
         ↓
Bước 4: Hiển thị kết quả S*, n*, τ*, B, lịch sinh tự động
```

**Lưu ý UX quan trọng:**
- Sau khi nhấn "Lấy gợi ý AI", hiển thị readonly panel:
  ```
  Nhà cung cấp: Công ty TNHH Lương thực Miền Nam
  K (năng lực cung cấp): 166.67 tấn/tháng
  A (chi phí đặt hàng):  2,000,000 VNĐ/lần
  C (đơn giá):           8,500,000 VNĐ/tấn
  L (lead time):         30 ngày
  Nguồn: [SUPPLIER_SERVICE ✓] hoặc [PREVIOUS_PERIOD ⚠] hoặc [MANUAL ⚠]
  ```
- Nếu `requiresManualInput: true` → thêm cảnh báo màu vàng:
  "Chưa đủ dữ liệu lịch sử. Vui lòng nhập Q theo kinh nghiệm."
- Nếu `mapeWarning: true` → cảnh báo:
  "MAPE = X%. Dự báo kém chính xác, hãy kiểm tra lại trước khi dùng."

**API calls:**
```
GET  /api/inventory/suggest/{productId}?planningUnit=MONTH
GET  /api/warehouse-config/default
POST /api/inventory/calculate
```

---

### 4.5 Form nhập tiêu thụ thực tế

**Mục đích:** Nhập dữ liệu sau kỳ để tích lũy cho AI.

**Hiển thị tiến trình AI model:**
```
Dữ liệu lịch sử: ████████████░░░░ 12/18 điểm
Mô hình hiện tại: Holt-Winters (trung bình)
Cần thêm 6 điểm để dùng Seasonal Regression (cao nhất)
```

---

### 4.6 Quản lý Nhà cung cấp (gọi supplier-service qua inventory-service)

**Lưu ý:** Frontend không gọi supplier-service trực tiếp.
Cần thêm proxy endpoint ở inventory-service nếu muốn quản lý supplier từ FE.
Hoặc gọi thẳng `http://localhost:8081` trong môi trường dev (cần CORS config).

---

## 5. FRONTEND TECH STACK ĐỀ XUẤT

```
React 18 + Vite
├── Routing:          React Router v6
├── State management: Zustand (nhẹ, đủ dùng) hoặc React Query (nếu cần caching)
├── UI Components:    Ant Design 5 (bộ component đầy đủ, phù hợp B2B)
├── Charts:           Recharts (sawtooth chart) + react-calendar-heatmap (heatmap)
├── HTTP Client:      Axios
├── Date handling:    dayjs (nhẹ hơn moment.js)
└── Form:             React Hook Form + Zod (validation)
```

**Tại sao Ant Design:** Hệ thống B2B nội bộ, ưu tiên chức năng đầy đủ hơn custom design.
AntD có sẵn Table, DatePicker, Form, Modal đủ dùng mà không cần viết từ đầu.

---

## 6. CẤU HÌNH KẾT NỐI BACKEND

### Axios base config
```javascript
// src/api/axiosConfig.js
import axios from 'axios';

const inventoryApi = axios.create({
  baseURL: import.meta.env.VITE_INVENTORY_API_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: unwrap data từ ApiResponse wrapper
inventoryApi.interceptors.response.use(
  (response) => {
    if (response.data.success) return response.data; // { success, message, data }
    return Promise.reject(new Error(response.data.message));
  },
  (error) => {
    const message = error.response?.data?.message || 'Lỗi kết nối server';
    return Promise.reject(new Error(message));
  }
);

export default inventoryApi;
```

### Environment variables
```
# .env.development
VITE_INVENTORY_API_URL=http://localhost:8080
VITE_SUPPLIER_API_URL=http://localhost:8081
```

### CORS — Cần thêm vào inventory-service
```java
// Thêm vào InventoryManagementApplication.java hoặc tạo CorsConfig.java
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override
        public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:3000")
                    .allowedMethods("GET", "POST", "PUT", "DELETE");
        }
    };
}
```

---

## 7. KNOWN ISSUES — CẦN FIX BACKEND TRƯỚC KHI LÀM FE

### Issue 1: OrderSchedule response không có productId và productName
**Vấn đề:** `product` field trong `OrderSchedule` entity bị `@JsonIgnore`.
API `GET /api/inventory/schedule` trả về list order nhưng không biết order nào thuộc sản phẩm nào.

**Fix cần thiết:** Tạo `OrderScheduleResponse` DTO:
```java
public class OrderScheduleResponse {
    private Long id;
    private Long productId;       // thêm
    private String productCode;   // thêm
    private String productName;   // thêm
    private Integer orderSequence;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private BigDecimal orderQuantity;
    private BigDecimal estimatedCost;
    private Boolean isReorderWarning;
    private LocalDate actualOrderDate;
    private LocalDate actualDeliveryDate;
    private BigDecimal actualQuantity;
}
```
Cập nhật `InventoryPlanningController` trả về `OrderScheduleResponse` thay vì entity.

### Issue 2: Không có API cập nhật trạng thái đơn hàng thực tế
**Vấn đề:** `actual_order_date`, `actual_delivery_date`, `actual_quantity` trong
`order_schedules` chưa có endpoint để cập nhật.

**Fix cần thiết:**
```
PATCH /api/inventory/schedule/{id}/actual
Body: { "actualOrderDate": "...", "actualDeliveryDate": "...", "actualQuantity": 111.5 }
```

### Issue 3: WarehouseConfigController còn gọi product.getUnitPrice()
File `WarehouseConfigController.java` line tính `avgPrice` vẫn gọi `p.getUnitPrice()`
sau khi đã bỏ field này. Cần fix lại — tính avgPrice từ `supplier_products` hoặc
bỏ logic tự động tính, yêu cầu truyền `avgUnitPriceForCalculation` bắt buộc.

---

## 8. DATA TRANSFORMATION EXAMPLES

### 8.1 Transform order schedule list → heatmap data

```javascript
// Input: Array<OrderSchedule> từ API (sau khi fix Issue 1)
// Output: Map<dateString, Array<order>>

function transformToHeatmapData(orders) {
  return orders.reduce((map, order) => {
    const dateKey = order.orderDate; // "2025-01-15"
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(order);
    return map;
  }, {});
}

// Tính intensity cho màu sắc ô
function getHeatmapIntensity(orders) {
  if (!orders || orders.length === 0) return 0;
  const hasOverdue = orders.some(o =>
    !o.actualOrderDate && new Date(o.orderDate) < new Date()
  );
  if (hasOverdue) return 'overdue'; // màu đỏ
  return Math.min(orders.length, 4); // 1-4 → 4 mức xanh
}
```

### 8.2 Transform schedule → sawtooth chart data

```javascript
// Tính lý thuyết tồn kho tại mỗi thời điểm
// Dựa trên: mỗi chu kỳ τ*, tồn kho tăng S*(1-Q/K) khi nhận hàng, giảm đều về 0

function buildSawtoothData(result, schedules, startDate, endDate) {
  const data = [];
  // result: InventoryCalculationResult
  // schedules: Array<OrderSchedule> của sản phẩm đó

  const maxLevel = result.maxInventoryLevel;    // S*(1-Q/K)
  const dailyConsumption = result.demandQ / 365; // nếu YEAR

  let currentInventory = maxLevel;
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Kiểm tra có nhận hàng ngày này không
    const delivery = schedules.find(s => s.expectedDeliveryDate === dateStr);
    if (delivery) currentInventory = maxLevel; // reset lên max khi nhận hàng

    data.push({
      date: dateStr,
      inventory: Math.max(0, currentInventory),
      reorderPoint: result.reorderPointB,
      avgLevel: result.avgInventoryLevel,
    });

    currentInventory -= dailyConsumption;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
}
```

### 8.3 Tính "ngày còn lại" cho dashboard alert

```javascript
function getUrgencyInfo(orders) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Lấy lần đặt hàng tiếp theo chưa thực hiện
  const nextOrder = orders
    .filter(o => !o.actualOrderDate)
    .sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate))[0];

  if (!nextOrder) return { level: 'green', daysLeft: null };

  const orderDate = new Date(nextOrder.orderDate);
  const daysLeft = Math.floor((orderDate - today) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0 || nextOrder.isReorderWarning) return { level: 'red', daysLeft };
  if (daysLeft <= 7) return { level: 'yellow', daysLeft };
  return { level: 'green', daysLeft };
}
```

---

## 9. PROJECT STRUCTURE ĐỀ XUẤT

```
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── axiosConfig.js
│   │   ├── productApi.js
│   │   ├── inventoryApi.js        ← calculate, suggest, schedule
│   │   ├── consumptionApi.js
│   │   └── warehouseApi.js
│   ├── components/
│   │   ├── common/
│   │   │   ├── AlertBanner.jsx    ← cảnh báo đặt hàng khẩn
│   │   │   └── KpiCard.jsx
│   │   ├── heatmap/
│   │   │   ├── OrderHeatmap.jsx   ← Calendar Heatmap component chính
│   │   │   ├── HeatmapCell.jsx
│   │   │   └── HeatmapTooltip.jsx
│   │   ├── charts/
│   │   │   └── SawtoothChart.jsx  ← biểu đồ tồn kho theo thời gian
│   │   └── forms/
│   │       ├── PlanningForm.jsx   ← tạo kỳ kế hoạch
│   │       └── ConsumptionForm.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── HeatmapPage.jsx
│   │   ├── ProductDetail.jsx      ← sawtooth chart + lịch sử
│   │   ├── NewPlanPage.jsx
│   │   └── SettingsPage.jsx       ← warehouse config, products CRUD
│   ├── store/
│   │   └── useAppStore.js         ← Zustand store
│   ├── utils/
│   │   ├── heatmapTransform.js
│   │   ├── sawtoothTransform.js
│   │   └── dateUtils.js
│   ├── App.jsx
│   └── main.jsx
├── .env.development
├── .env.production
└── vite.config.js
```

---

## 10. THUẬT NGỮ QUAN TRỌNG (để hiển thị cho người dùng)

| Ký hiệu | Tên đầy đủ | Ý nghĩa cho người dùng |
|---------|-----------|------------------------|
| Q | Nhu cầu tiêu thụ | Tổng lượng cần dùng trong kỳ |
| K | Tốc độ bổ sung | Nhà cung cấp có thể giao tối đa bao nhiêu/kỳ |
| A | Chi phí đặt hàng | Chi phí cố định mỗi lần đặt (vận chuyển, hành chính) |
| C | Đơn giá | Giá mua một đơn vị hàng |
| I | Hệ số bảo quản | Chi phí giữ hàng trong kho (%/kỳ) |
| L | Lead time | Thời gian từ khi đặt đến khi nhận hàng |
| S* | Lượng đặt tối ưu | Mỗi lần đặt nên mua bao nhiêu |
| n* | Số lần đặt tối ưu | Nên đặt hàng bao nhiêu lần trong kỳ |
| τ* | Chu kỳ đặt hàng | Khoảng cách giữa 2 lần đặt |
| B | Điểm đặt hàng | Khi tồn kho còn bao nhiêu thì phải đặt ngay |
| Z | Tồn kho trung bình | Lượng hàng bình quân trong kho |
| D_min | Chi phí tối thiểu | Chi phí đặt hàng + bảo quản tối ưu (chưa gồm mua hàng) |

---

## 11. GHI CHÚ TRIỂN KHAI

- Backend chưa có authentication. Nếu cần, thêm JWT sau.
- Tất cả số tiền đơn vị **VNĐ**, format: `1,234,567` (không có ký hiệu đơn vị tiền tệ trong DB)
- Ngày tháng: (DD-MM-YYYY) cho date
- Số thập phân: backend trả về tối đa 4 chữ số sau dấu phẩy (DECIMAL(18,4))
- `planning_unit` enum: `MONTH` | `QUARTER` | `YEAR` — **viết hoa hoàn toàn**
- `supplier_data_source`: `SUPPLIER_SERVICE` | `PREVIOUS_PERIOD` | `MANUAL`
  → Hiển thị badge màu: xanh / vàng / xám tương ứng