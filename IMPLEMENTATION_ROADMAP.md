# Implementation Roadmap: Module A, B, C (Stocktaking + Analytics)

## Executive Summary

Based on `implement_plan_stocktaking.md` and actual codebase exploration, this document maps the three modules to real file paths and implementation steps.

---

## **Module A: Stocktaking (Kiểm kê kho) — FOUNDATION**

### Priority: **HIGH** (Foundation for Modules B & C)

### Timeline: **2-3 days**

### Backend Implementation

#### 1. Entity (Already Exists)

- **File:** [backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/model/StockCount.java](backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/model/StockCount.java)
- **Status:** Entity already created with correct structure (DRAFT|CONFIRMED status, variance calculations)

#### 2. Database Migration

- **File:** [backend/inventory-optimization-service/src/main/resources/migration_stock_counts.sql](backend/inventory-optimization-service/src/main/resources/migration_stock_counts.sql)
- **Status:** Migration script exists with proper indexes and unique constraint on (product_id, count_date)
- **Action:** Run this migration on database if not already applied

#### 3. Repository Layer

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/repository/StockCountRepository.java`
- **Template:**
  ```java
  @Repository
  public interface StockCountRepository extends JpaRepository<StockCount, Long> {
      List<StockCount> findByProductIdOrderByCountDateDesc(Long productId);

      Optional<StockCount> findByProductIdAndCountDate(Long productId, LocalDate countDate);

      Optional<StockCount> findLatestConfirmedBefore(Long productId, LocalDate date);

      List<StockCount> findByProductIdAndStatusAndCountDateBetween(
          Long productId, String status, LocalDate from, LocalDate to);
  }
  ```
- **Queries:** Use custom `@Query` JPQL for complex lookups (latest confirmed before date)

#### 4. Service Interface & Implementation

- **Interface file:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/StockCountService.java`
- **Implementation file:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/impl/StockCountServiceImpl.java`

- **Key Methods:**

  ```java
  StockCountResponse createDraft(Long productId, LocalDate countDate, String countedBy);
  // → Calls InventoryPlanningService.simulateInventoryAt(productId, countDate)

  StockCountResponse confirm(Long stockCountId, BigDecimal actualQuantity, String notes);
  // → Calculate: varianceQty = actual - system
  //              varianceRate = varianceQty / systemQuantity
  //              varianceValue = varianceQty * unitPriceC

  List<StockCountResponse> getHistory(Long productId);

  Optional<StockCount> findLatestConfirmedBefore(Long productId, LocalDate date);
  ```

- **Dependencies Needed:**
  - Inject: `StockCountRepository`, `InventoryPlanningService`, `ProductServiceClient`
  - Refactor `InventoryPlanningService.simulateInventory()` → **CHANGE from `private` to `public` method `simulateInventoryAt()`**

#### 5. Response DTO

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/dto/response/StockCountResponse.java`
- **Fields:**
  ```java
  Long id;
  Long productId;
  String productName;
  LocalDate countDate;
  BigDecimal systemQuantity;
  BigDecimal actualQuantity;
  BigDecimal varianceQty;
  BigDecimal varianceRate;           // Percentage (0.05 = 5%)
  BigDecimal varianceValue;          // In VND
  String countedBy;
  String notes;
  String status;                     // DRAFT | CONFIRMED
  LocalDateTime createdAt;
  LocalDateTime confirmedAt;
  ```

#### 6. Controller

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/controller/StockCountController.java`
- **Endpoints:**

  ```
  POST   /api/stock-counts
    Body: { productId: Long, countDate: LocalDate, countedBy: String }
    Returns: StockCountResponse (DRAFT status)

  PUT    /api/stock-counts/{id}/confirm
    Body: { actualQuantity: BigDecimal, notes?: String }
    Returns: StockCountResponse (CONFIRMED status with calculated variance)

  GET    /api/stock-counts/{productId}
    Params: from?, to? (LocalDate filters)
    Returns: List<StockCountResponse> sorted by countDate DESC

  GET    /api/stock-counts/{id}
    Returns: StockCountResponse detail
  ```

#### 7. Refactoring InventoryPlanningService

- **File:** [backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/impl/InventoryPlanningService.java](backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/impl/InventoryPlanningService.java)
- **Change:** Make `simulateInventory()` method **public** with name `simulateInventoryAt(Long productId, LocalDate targetDate)`
- **Used by:**
  - `StockCountService.createDraft()`
  - `ServiceLevelAnalytics.analyzeServiceLevel()` (Module C)
  - `InventoryPlanningService.predictInventory()` (existing, reuse)

#### 8. Integration Point: Auto-detect initialInventory

- **File:** Update `InventoryPlanningService.createAndCalculate()` method
- **Logic (priority order):**
  1. Use `request.initialInventory` if provided (highest priority)
  2. Use `StockCount.findLatestConfirmedBefore(productId, planStartDate)` if exists
  3. Fall back to `simulateInventoryAt()` from active predecessor plan

---

### Frontend Implementation

#### 1. Page Component

- **File to create:** [opt-frontend/src/pages/StocktakingPage.tsx](opt-frontend/src/pages/StocktakingPage.tsx)
- **Sections:**
  1. **Form section** - Create new stock count
     - Product selector (ProductSelector component)
     - Count date picker (date input)
     - Counted by (text input)
     - Button: "Create Draft"
  2. **History section** - List existing stock counts
     - Table with: countDate, productName, systemQty, actualQty, variance, status, actions
     - Status badge (DRAFT=gray, CONFIRMED=green)
     - Expandable row with variance details
  3. **Confirm modal** - Edit draft and confirm
     - Read-only: systemQuantity, countDate
     - Editable: actualQuantity, notes
     - Variance auto-calculated on input
     - Button: "Confirm" (moves to CONFIRMED status)

#### 2. API Service

- **File to create:** [opt-frontend/src/api/stocktakingApi.ts](opt-frontend/src/api/stocktakingApi.ts)
- **Exports:**
  ```typescript
  export const stocktakingApi = {
    create: (productId: number, countDate: string, countedBy: string) =>
      api.post("/stock-counts", { productId, countDate, countedBy }),

    confirm: (stockCountId: number, actualQuantity: number, notes?: string) =>
      api.put(`/stock-counts/${stockCountId}/confirm`, {
        actualQuantity,
        notes,
      }),

    getHistory: (productId: number, from?: string, to?: string) =>
      api.get(`/stock-counts/${productId}`, { params: { from, to } }),

    getDetail: (stockCountId: number) =>
      api.get(`/stock-counts/${stockCountId}`),
  };
  ```

#### 3. Type Definitions

- **File to create:** [opt-frontend/src/types/inventory-opt/StockCount.ts](opt-frontend/src/types/inventory-opt/StockCount.ts)
- **Interfaces:**

  ```typescript
  interface StockCount {
    id: number;
    productId: number;
    productName: string;
    countDate: string;
    systemQuantity: number;
    actualQuantity: number | null;
    varianceQty: number | null;
    varianceRate: number | null; // 0.05 = 5%
    varianceValue: number | null;
    countedBy: string | null;
    notes: string | null;
    status: "DRAFT" | "CONFIRMED";
    createdAt: string;
    confirmedAt: string | null;
  }

  interface CreateStockCountRequest {
    productId: number;
    countDate: string;
    countedBy: string;
  }
  ```

#### 4. Route Addition

- **File:** [opt-frontend/src/App.tsx](opt-frontend/src/App.tsx)
- **Add:**
  ```typescript
  <Route path="/stocktaking" element={<StocktakingPage />} />
  ```

#### 5. Navigation

- **File:** Update sidebar/navigation menu to add link to Stocktaking page

#### 6. Role-Based Access

- **File:** [opt-frontend/src/config/roleAccess.ts](opt-frontend/src/config/roleAccess.ts)
- **Add:** `/stocktaking` page restricted to `warehouse-manager` role

---

## **Module B: Loss Rate Analytics (Phân tích tỷ lệ thất thoát)**

### Priority: **MEDIUM** (Depends on Module A data)

### Timeline: **1-2 days** (after Module A complete + 1 month data collection)

### Backend Implementation

#### 1. Service Interface & Implementation

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/LossRateAnalyticsService.java`

- **Key Method:**

  ```java
  LossRateAnalysisResponse analyzeLossRate(Long productId, LocalDate from, LocalDate to);

  // Calculation logic:
  // 1. Get all CONFIRMED StockCount records in date range
  // 2. Sum varianceQty where negative (actual < system) → total loss quantity
  // 3. Calculate: lossRate = totalLossQty / totalSystemQty
  // 4. Sum varianceValue where negative → total loss value in VND
  // 5. Compare avgLossRate with WarehouseConfig.spoilageRate → suggest update
  ```

- **Thresholds:**
  - Warning if: `varianceRate.abs() > 0.05` (5%) on latest count
  - Suggest spoilageRate update if: `avgLossRate` differs >30% from configured rate

#### 2. Response DTO

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/dto/response/LossRateAnalysisResponse.java`
- **Fields:**
  ```java
  Long productId;
  String productName;
  LocalDate fromDate, toDate;
  int stockCountsUsed;                    // # of CONFIRMED records in range
  BigDecimal avgLossRate;                 // Average % loss across period
  BigDecimal totalLossValue;              // Total VND lost
  BigDecimal configuredSpoilageRate;      // From WarehouseConfig
  Boolean exceedsWarningThreshold;        // true if latest > 5%
  Boolean suggestUpdateSpoilageRate;      // true if differs significantly
  String message;
  List<StockCountDetailDto> details;      // Individual stock count records
  ```

#### 3. Controller Endpoint

- **File:** Update `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/controller/InventoryAnalyticsController.java` (create if not exists)
- **Endpoint:**
  ```
  GET /api/analytics/loss-rate/{productId}?from=YYYY-MM-DD&to=YYYY-MM-DD
    Returns: LossRateAnalysisResponse
  ```

---

### Frontend Implementation

#### 1. Page Component

- **File to create:** [opt-frontend/src/pages/LossRateAnalyticsPage.tsx](opt-frontend/src/pages/LossRateAnalyticsPage.tsx)
- **Layout:**
  - Product selector
  - Date range picker (from/to)
  - **KPI Cards:**
    - Average Loss Rate (%)
    - Total Loss Value (VND)
    - Stock Counts Used (#)
    - Status: Alert if exceeds threshold
  - **Table:** Detailed loss by stock count (date, variance, rate, value)
  - **Alert/Warning:** If exceeds 5% or differs significantly from config

#### 2. API Service

- **File to create:** [opt-frontend/src/api/analyticsApi.ts](opt-frontend/src/api/analyticsApi.ts)
- **Export:**
  ```typescript
  export const analyticsApi = {
    getLossRateAnalysis: (productId: number, from: string, to: string) =>
      api.get(`/analytics/loss-rate/${productId}`, { params: { from, to } }),
  };
  ```

#### 3. Type Definitions

- **File to create:** [opt-frontend/src/types/inventory-opt/Analytics.ts](opt-frontend/src/types/inventory-opt/Analytics.ts)

#### 4. Route & Navigation

- **File:** Update [opt-frontend/src/App.tsx](opt-frontend/src/App.tsx)
- **Add:** `/analytics/loss-rate` route
- **Role:** `warehouse-manager`

---

## **Module C: Service Level Analytics (Phân tích Service Level)**

### Priority: **MEDIUM-HIGH** (Complements planning analysis)

### Timeline: **1-2 days** (can be parallel with Module A)

### Backend Implementation

#### 1. Endpoint: Confirm Delivery

- **File:** Update [backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/controller/OrderScheduleController.java](backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/controller/OrderScheduleController.java)
- **New Endpoint:**
  ```
  PATCH /api/order-schedules/{id}/confirm-delivery
    Body: { actualDeliveryDate: LocalDate }
    Returns: OrderScheduleResponse
  ```

#### 2. Service Implementation

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/service/ServiceLevelAnalyticsService.java`

- **Key Method:**

  ```java
  ServiceLevelAnalysisResponse analyzeServiceLevel(Long productId, LocalDate from, LocalDate to);

  // Calculation:
  // 1. Get all OrderSchedule records in date range
  // 2. For each schedule:
  //    - Calculate delivery delay: days between expectedDeliveryDate and actualDeliveryDate
  //    - Simulate inventory during order cycle
  //    - Count stockout days (simulated inventory = 0)
  // 3. Aggregate:
  //    - Service Level = 1 - (stockout cycles / total cycles)
  //    - Avg stockout duration = total stockout days / stockout cycles
  //    - Avg delivery delay = total delay days / total cycles
  ```

- **Dependencies:** Reuse `InventoryPlanningService.simulateInventoryAt()` for daily inventory simulation

#### 3. Response DTO

- **File to create:** `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/dto/response/ServiceLevelAnalysisResponse.java`
- **Fields:**
  ```java
  Long productId;
  String productName;
  LocalDate fromDate, toDate;
  int totalCycles;                    // # of order schedules
  int stockoutCycles;                 // # with stock exhaustion
  double stockoutFrequency;           // stockoutCycles / totalCycles
  double serviceLevel;                // 1 - stockoutFrequency
  double avgStockoutDuration;         // Days per stockout event
  double avgDeliveryDelay;            // Days delay on average
  ```

#### 4. Controller Endpoint

- **File:** Update `backend/inventory-optimization-service/src/main/java/com/ecotel/inventory_optimization_service/controller/InventoryAnalyticsController.java`
- **Endpoint:**
  ```
  GET /api/analytics/service-level/{productId}?from=YYYY-MM-DD&to=YYYY-MM-DD
    Returns: ServiceLevelAnalysisResponse
  ```

---

### Frontend Implementation

#### 1. Page Component

- **File to create:** [opt-frontend/src/pages/ServiceLevelAnalyticsPage.tsx](opt-frontend/src/pages/ServiceLevelAnalyticsPage.tsx)
- **Layout:**
  - Product selector
  - Date range picker
  - **KPI Cards:**
    - Service Level (% - green if >95%)
    - Stockout Frequency (count of cycles)
    - Avg Stockout Duration (days)
    - Avg Delivery Delay (days)
  - **Visualization:**
    - Service Level trend chart (Recharts Line)
    - Delivery delay scatter plot
    - Stockout frequency bar chart

#### 2. API Service

- **File:** Update [opt-frontend/src/api/analyticsApi.ts](opt-frontend/src/api/analyticsApi.ts)
- **Add:**
  ```typescript
  getServiceLevelAnalysis: (productId: number, from: string, to: string) =>
    api.get(`/analytics/service-level/${productId}`, { params: { from, to } });
  ```

#### 3. Route & Navigation

- **Add:** `/analytics/service-level` route

---

## **Implementation Order & Dependencies**

```
PHASE 1 (Week 1)
├─ Step 1: Module A Foundation
│  ├─ Refactor InventoryPlanningService.simulateInventory() → public
│  ├─ Implement StockCountService + Controller
│  ├─ Create StocktakingPage frontend
│  └─ Test: Create draft, confirm, view history
│
└─ Step 2 (Parallel): Prepare Module C infrastructure
   └─ Add endpoint PATCH /api/order-schedules/{id}/confirm-delivery

PHASE 2 (Week 2, after 1-2 weeks data collection)
├─ Module C: Service Level Analytics
│  ├─ Implement ServiceLevelAnalyticsService
│  ├─ Create ServiceLevelAnalyticsPage frontend
│  └─ Test: View service level metrics
│
└─ Module B: Loss Rate Analytics (when Module A data accumulated)
   ├─ Implement LossRateAnalyticsService
   ├─ Create LossRateAnalyticsPage frontend
   └─ Test: View loss rate trends with alerts
```

---

## **Shared Utilities & Code Reuse**

### 1. Simulation Engine

- **Location:** `InventoryPlanningService.simulateInventoryAt(Long productId, LocalDate targetDate)`
- **Used by:**
  - StockCountService (create draft)
  - ServiceLevelAnalyticsService (stockout detection)
  - InventoryPlanningService (existing predictInventory)

### 2. Response Wrappers

- **Standard Response:** `ApiResponse<T>` (from shared-library)
- **Pagination:** `PageResponse<T>` (from shared-library)

### 3. Frontend Component Patterns

- **KPI Cards:** Reuse existing `KpiCard` component
- **Charts:** Recharts with consistent theme colors
- **Date Pickers:** shadcn/ui date input
- **Product Selector:** Reuse existing `ProductSelector` component
- **Data Tables:** Custom pagination with status badges

---

## **Testing Checklist**

### Module A - Stocktaking

- [ ] Create draft stock count → systemQuantity auto-calculated
- [ ] Update with actual quantity → variance calculated
- [ ] Confirm → status changes to CONFIRMED, variance locked
- [ ] History retrieval → sorted by date DESC
- [ ] Latest confirmed before date → used for initialInventory detection
- [ ] Unique constraint test → prevent duplicate count on same date

### Module B - Loss Rate

- [ ] Calculate with 2+ confirmed stock counts
- [ ] Loss rate percentage correct
- [ ] Total loss value in VND calculated
- [ ] Warning when >5%
- [ ] Compare with spoilageRate config

### Module C - Service Level

- [ ] Confirm delivery date → actual delay calculated
- [ ] Service level = 1 - (stockout cycles / total cycles)
- [ ] Avg stockout duration computed
- [ ] Avg delivery delay computed

---

## **Environment Setup**

### Backend Build & Run

```bash
cd backend/inventory-optimization-service
./mvnw clean package
./mvnw spring-boot:run
# Runs on http://localhost:8091
```

### Frontend Build & Run

```bash
cd opt-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Database Migrations

- Ensure `application.yml` has `jpa.hibernate.ddl-auto: none` (manual migration management)
- Apply all `migration_*.sql` files in order

---

## **Key Integration Points**

1. **InventoryPlanningService refactoring** - Make simulate method public/reusable
2. **StockCount entity** - Already exists, implement service layer
3. **OrderSchedule.actualDeliveryDate** - Already exists, need frontend to set + analytics to read
4. **WarehouseConfig** - Already exists, Module B compares loss rate vs configured spoilageRate
5. **Keycloak authentication** - All endpoints protected, frontend handles token injection

---

## **Files to Create (Summary)**

### Backend (Java)

1. `StockCountRepository.java`
2. `StockCountService.java` (interface)
3. `StockCountServiceImpl.java`
4. `StockCountResponse.java` (DTO)
5. `StockCountController.java`
6. `LossRateAnalyticsService.java`
7. `LossRateAnalysisResponse.java` (DTO)
8. `ServiceLevelAnalyticsService.java`
9. `ServiceLevelAnalysisResponse.java` (DTO)
10. `InventoryAnalyticsController.java` (new or update existing)

### Frontend (TypeScript/React)

1. `StocktakingPage.tsx`
2. `stocktakingApi.ts`
3. `StockCount.ts` (types)
4. `LossRateAnalyticsPage.tsx`
5. `ServiceLevelAnalyticsPage.tsx`
6. `analyticsApi.ts`
7. `Analytics.ts` (types)

### Database

- ✅ `migration_stock_counts.sql` (already exists)

### Configuration

- ✅ Update `App.tsx` with new routes (3 additions)
- ✅ Update `roleAccess.ts` with role restrictions

---

**Total Estimated Effort:** 5-7 days development + 1-2 weeks for data collection before analytics is meaningful to users.
