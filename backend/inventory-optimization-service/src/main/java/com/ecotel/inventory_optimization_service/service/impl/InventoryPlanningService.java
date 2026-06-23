package com.ecotel.inventory_optimization_service.service.impl;

import com.ecotel.inventory_optimization_service.dto.request.InventoryParameterRequest;
import com.ecotel.inventory_optimization_service.dto.request.supplier.SupplierProductData;
import com.ecotel.inventory_optimization_service.dto.response.*;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.mapper.InventoryPlanningMapper;
import com.ecotel.inventory_optimization_service.model.*;
import com.ecotel.inventory_optimization_service.repository.*;
import com.ecotel.inventory_optimization_service.service.InventoryCalculationService;
import com.ecotel.inventory_optimization_service.service.InventoryParameterService;
import com.ecotel.inventory_optimization_service.service.forecast.ForecastOrchestrator;
import com.ecotel.inventory_optimization_service.service.supplier.SupplierServiceClient;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryPlanningService {

    private final InventoryParameterRepository parameterRepository;
    private final InventoryResultRepository resultRepository;
    private final OrderScheduleRepository scheduleRepository;
    private final WarehouseConfigRepository warehouseConfigRepository;
    private final StockCountRepository stockCountRepository;
    private final InventoryCalculationService calculationService;
    private final ForecastOrchestrator forecastOrchestrator;
    private final SupplierServiceClient supplierServiceClient;
    private final InventoryPlanningMapper inventoryPlanningMapper;
    private final InventoryParameterService inventoryParameterService;
    private final ProductService productService;

    // -------------------------------------------------------
    // LUỒNG CHÍNH: TẠO / REPLAN KẾ HOẠCH
    // -------------------------------------------------------

    @Transactional
    public InventoryCalculationResult createAndCalculate(InventoryParameterRequest request, InventoryParameter previousParam) {
        LocalDate today = LocalDate.now();
        PeriodResolver.validate(request, today, null);
        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(request, today, null);

        LocalDate planStartDate = resolved.planStartDate();
        LocalDate planEndDate = resolved.planEndDate();
        LocalDate scheduleStartDate = resolved.scheduleStartDate();

        // Kiểm tra overlap — nếu có thì SUPERSEDE (không xóa)
//        List<InventoryParameter> overlapping = parameterRepository.findOverlapping(
//                request.getProductId(), planStartDate, planEndDate);
//        if (!overlapping.isEmpty()) {
//            throw new IllegalStateException(buildOverlapMessage(overlapping));
//        }

        ProductResponse product = findProduct(request.getProductId());
        WarehouseConfig config = resolveWarehouseConfig(request);
        SnapshotData snapshot = resolveSnapshot(request);

        // Q người dùng nhập = tổng cả kỳ → chia đều về tháng
        int totalMonths = request.getEndMonth() - request.getStartMonth() + 1;
        BigDecimal demandQPerMonth = request.getDemandQ()
                .divide(BigDecimal.valueOf(totalMonths), 4, RoundingMode.HALF_UP);

        // Auto-detect tồn kho và lô đang bay cho kế hoạch liền kề
        // Ưu tiên: request > auto-detect từ kỳ trước
        BigDecimal effectiveInitialInventory = request.getInitialInventory();
        BigDecimal effectiveReceiptQty = request.getScheduledReceiptQty();
        LocalDate effectiveReceiptDate = request.getScheduledReceiptDate();

        if (effectiveInitialInventory == null) {

            // ưu tiên 2: Kiểm tra StockCount CONFIRMED gần nhất trước planStartDate
            // (điểm neo thực tế chính xác hơn mô phỏng)
            StockCount latestConfirmed = stockCountRepository
                    .findConfirmedBeforeDate(request.getProductId(), planStartDate)
                    .stream().findFirst().orElse(null);

            if (latestConfirmed != null) {
                effectiveInitialInventory = latestConfirmed.getActualQuantity();
                log.info("Dùng StockCount CONFIRMED id={} ngày {} làm initialInventory={}",
                        latestConfirmed.getId(), latestConfirmed.getCountDate(), effectiveInitialInventory);
            } else {
                // ưu tiên 3: Kiểm tra kế hoạch ACTIVE liền kề và mô phỏng (fallback)
                LocalDate adjacentThreshold = planStartDate.minusMonths(1);
                List<InventoryParameter> adjacent = parameterRepository.findOverlapping(
                        request.getProductId(),
                        adjacentThreshold,
                        planStartDate.minusDays(1));

                boolean hasAdjacentPlan = adjacent.stream()
                        .anyMatch(p -> "ACTIVE".equals(p.getStatus()));

                if (hasAdjacentPlan) {
                    log.info("Phát hiện kế hoạch liền kề, tự động tính tồn kho tại {}",
                            planStartDate);
                    PredictedInventoryResponse predicted =
                            predictInventory(request.getProductId(), planStartDate);

                    if (predicted.getPredictedInventory() != null) {
                        effectiveInitialInventory = predicted.getPredictedInventory();
                        log.info("Auto initialInventory={} tại {}", effectiveInitialInventory, planStartDate);
                    }

                    // Lấy lô đang bay từ kỳ trước (nếu request chưa điền)
                    if (effectiveReceiptQty == null && !predicted.getPendingReceipts().isEmpty()) {
                        PredictedInventoryResponse.PendingReceipt firstReceipt =
                                predicted.getPendingReceipts().get(0);
                        effectiveReceiptQty = firstReceipt.getQuantity();
                        effectiveReceiptDate = firstReceipt.getExpectedDeliveryDate();
                        log.info("Auto scheduledReceipt qty={} date={}",
                                effectiveReceiptQty, effectiveReceiptDate);
                    }
                }
            }
        }

        InventoryParameter param = InventoryParameter.builder()
                .productId(product.getId())
                .warehouseConfig(config)
                .planStartDate(planStartDate)
                .planEndDate(planEndDate)
                .scheduleStartDate(scheduleStartDate)
                .demandQ(demandQPerMonth)
                .storageCostCoefficientI(
                        request.getStorageCostCoefficientI()
                                .divide(BigDecimal.valueOf(12), 6, RoundingMode.HALF_UP))
                .supplierProductId(snapshot.supplierProductId)
                .snapshotSupplyRateK(snapshot.supplyRateK)
                .snapshotFixedOrderCostA(snapshot.fixedOrderCostA)
                .snapshotUnitPriceC(snapshot.unitPriceC)
                .snapshotLeadTimeL(snapshot.leadTimeL)
                .leadTimeSource(snapshot.leadTimeSource != null ? snapshot.leadTimeSource : "COMMITTED")
                .supplierDataSource(snapshot.source)
                .initialInventory(effectiveInitialInventory)
                .scheduledReceiptQty(effectiveReceiptQty)
                .scheduledReceiptDate(effectiveReceiptDate)
                .status("ACTIVE")
                .paramReceipt(previousParam != null ? previousParam.getId() : null)
                .build();

        param = parameterRepository.save(param);

        InventoryCalculationResult calcResult = calculationService.calculate(param);

        // Gắn thông tin lead time source và cảnh báo deviation vào kết quả
        calcResult.setLeadTimeSourceUsed(snapshot.leadTimeSource != null ? snapshot.leadTimeSource : "COMMITTED");
        if (snapshot.deviationWarning) {
            calcResult.setLeadTimeDeviationWarning(true);
            calcResult.setLeadTimeDeviationMessage(snapshot.deviationMessage);
        }

        InventoryResult result = saveResult(param, calcResult);
        calcResult.setId(result.getId());
        calcResult.setInventoryParameterId(result.getInventoryParameter().getId());
        List<OrderSchedule> schedules = generateOrderSchedule(param, calcResult, previousParam);

        inventoryParameterService.updateActualDates(param, schedules, result);

        return calcResult;
    }

    /**
     * Replan: supersede kế hoạch cũ trong khoảng [start, end], tạo kế hoạch mới.
     * Kế hoạch cũ được đánh dấu SUPERSEDED, không bị xóa.
     */
    @Transactional
    public InventoryCalculationResult replan(InventoryParameterRequest request) {
        LocalDate today = LocalDate.now();
        PeriodResolver.validate(request, today, null);
        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(request, today, null);

        LocalDate planStartDate = resolved.planStartDate();
        LocalDate planEndDate = resolved.planEndDate();

        // Supersede kế hoạch cũ trong khoảng thời gian này
        InventoryParameter previousParam = parameterRepository.findActiveToSupersede(
                request.getProductId(), planStartDate, planEndDate).stream().findFirst().orElse(null);

        parameterRepository.supersede(request.getProductId(), planStartDate, planEndDate);

        // Cancelled nếu kế hoạch mới phủ ngày bắt đầu của kế hoạch cũ
        int updateCancelRow = parameterRepository.findOverlappingToCancel(request.getProductId(), planStartDate, planEndDate);
        log.info("Replan: cancel {} kế hoạch trùng (nếu có)", updateCancelRow);

        // Tạo kế hoạch mới (dùng lại logic createAndCalculate)
        return createAndCalculate(request, previousParam);
    }

    /**
     * Xóa kế hoạch cụ thể (khi người dùng xác nhận từ frontend).
     */
    @Transactional
    public void deleteParameter(Long parameterId) {
        InventoryParameter param = parameterRepository.findById(parameterId)
                .orElseThrow(() -> new ResourceNotFoundException("Kế hoạch", parameterId));

        resultRepository.findByInventoryParameterId(parameterId).ifPresent(result -> {
            scheduleRepository.deleteByInventoryResultId(result.getId());
            resultRepository.delete(result);
        });

        parameterRepository.delete(param);
    }

    // -------------------------------------------------------
    // GỢI Ý TỒNKHO KHI REPLAN
    // -------------------------------------------------------

    /**
     * Tính tồn kho dự đoán tại một ngày cụ thể từ kế hoạch ACTIVE gần nhất.
     * Frontend gọi để pre-fill trường initialInventory khi người dùng chọn ngày replan.
     * <p>
     * Công thức: mô phỏng theo mô hình bổ sung dần từ ngày bắt đầu kế hoạch active
     * đến targetDate, dựa trên Q/ngày và lịch đặt hàng hiện có.
     */
    public PredictedInventoryResponse predictInventory(String productId, LocalDate targetDate) {
        Optional<InventoryParameter> activeOpt =
                parameterRepository.findLatestActive(productId).stream().findFirst();

        if (activeOpt.isEmpty()) {
            return PredictedInventoryResponse.builder()
                    .predictedInventory(null)
                    .message("Chưa có kế hoạch ACTIVE. Vui lòng nhập tồn kho thủ công.")
                    .pendingReceipts(List.of())
                    .build();
        }

        InventoryParameter active = activeOpt.get();
        InventoryResult result = resultRepository
                .findByInventoryParameterId(active.getId())
                .orElse(null);

        if (result == null) {
            return PredictedInventoryResponse.builder()
                    .predictedInventory(null)
                    .message("Không tìm thấy kết quả tính toán của kế hoạch hiện tại.")
                    .pendingReceipts(List.of())
                    .build();
        }

        // Lấy danh sách đơn hàng đang bay (chưa nhận)
        List<OrderSchedule> pendingReceipts =
                scheduleRepository.findPendingReceipts(productId, targetDate);

        // Mô phỏng tồn kho từng ngày từ scheduleStartDate đến targetDate
        BigDecimal inv = simulateInventory(active, result, targetDate);

        // Gợi ý ngày bắt đầu hợp lý: sau ngày nhận lô hàng đang bay gần nhất
        LocalDate suggestedStartDate = targetDate;
        if (!pendingReceipts.isEmpty()) {
            LocalDate lastPendingDelivery = pendingReceipts.stream()
                    .map(OrderSchedule::getExpectedDeliveryDate)
                    .max(LocalDate::compareTo)
                    .orElse(targetDate);
            if (lastPendingDelivery.isAfter(targetDate)) {
                suggestedStartDate = lastPendingDelivery.plusDays(1);
            }
        }

        return PredictedInventoryResponse.builder()
                .predictedInventory(inv)
                .suggestedStartDate(suggestedStartDate)
                .message(suggestedStartDate.isAfter(targetDate)
                        ? "Có lô hàng giao " + lastDeliveryDate(pendingReceipts)
                        + ". Đề xuất bắt đầu kế hoạch từ " + suggestedStartDate + "."
                        : "Tồn kho dự đoán tại " + targetDate + ".")
                .pendingReceipts(pendingReceipts.stream()
                        .map(s -> PredictedInventoryResponse.PendingReceipt.builder()
                                .orderDate(s.getOrderDate())
                                .expectedDeliveryDate(s.getExpectedDeliveryDate())
                                .quantity(s.getOrderQuantity())
                                .build())
                        .toList())
                .build();
    }

    // -------------------------------------------------------
    // SINH LỊCH ĐẶT HÀNG — hỗ trợ initialInventory
    // -------------------------------------------------------

    private List<OrderSchedule> generateOrderSchedule(InventoryParameter param,
                                                      InventoryCalculationResult result,
                                                      InventoryParameter previousParam) {
        InventoryResult savedResult = resultRepository
                .findByInventoryParameterId(param.getId()).orElseThrow();

        scheduleRepository.deleteByInventoryResultId(savedResult.getId());

        long cycleDays = result.getOptimalCycleTimeTau()
                .multiply(java.math.BigDecimal.valueOf(30))
                .setScale(0, java.math.RoundingMode.HALF_UP)
                .longValue();
        long leadDays = Math.round(param.getSnapshotLeadTimeL().doubleValue() * 30);

        if (cycleDays <= 0) {
            log.error("cycleDays <= 0 cho parameterId={}", param.getId());
            return null;
        }

        // Tính ngày đặt hàng ĐẦU TIÊN
        LocalDate firstOrderDate = calcFirstOrderDate(param, result, leadDays, previousParam);

        List<OrderSchedule> schedules = new ArrayList<>();
        int sequence = 1;
        LocalDate orderDate = firstOrderDate;
        LocalDate planEnd = param.getPlanEndDate();

        while (!orderDate.isAfter(planEnd)) {
            LocalDate deliveryDate = orderDate.plusDays(leadDays);
            boolean isWarning = deliveryDate.isAfter(planEnd);

            BigDecimal estimatedCost = param.getSnapshotFixedOrderCostA()
                    .add(param.getSnapshotUnitPriceC().multiply(result.getOptimalOrderQtyS()));

            schedules.add(OrderSchedule.builder()
                    .inventoryResult(savedResult)
                    .productId(param.getProductId())
                    .orderSequence(sequence++)
                    .orderDate(orderDate)
                    .expectedDeliveryDate(deliveryDate)
                    .orderQuantity(result.getOptimalOrderQtyS())
                    .estimatedCost(estimatedCost)
                    .isReorderWarning(isWarning)
                    .build());

            orderDate = orderDate.plusDays(cycleDays);
        }

        scheduleRepository.saveAll(schedules);
        return schedules;
    }

    /**
     * Tính ngày đặt hàng đầu tiên dựa trên initialInventory.
     * <p>
     * Nếu initialInventory == null (kế hoạch đầu tiên):
     * → Bắt đầu từ scheduleStartDate
     * <p>
     * Nếu initialInventory != null (replan):
     * → Mô phỏng tồn kho từng ngày từ scheduleStartDate,
     * tính đúng cả giai đoạn đang nhận lô hàng cũ (tồn kho tăng)
     * và giai đoạn chỉ tiêu thụ (tồn kho giảm).
     * → Ngày đầu tiên tồn kho chạm B_new = ngày đặt hàng đầu tiên.
     * <p>
     * Lý do không dùng công thức tuyến tính (iEff - B) / (Q/30):
     * Công thức đó giả định tồn kho luôn giảm đều, bỏ qua giai đoạn
     * đang nhận lô hàng cũ khiến tồn kho tăng — dẫn đến tính sai ngày.
     */
    private LocalDate calcFirstOrderDate(InventoryParameter param,
                                         InventoryCalculationResult result,
                                         long leadDays,
                                         InventoryParameter previousParam) {
        if (previousParam != null) {

            BigDecimal B = result.getReorderPointB();
            BigDecimal Q = param.getDemandQ();        // Q/tháng
            BigDecimal previousQ = previousParam.getDemandQ(); // Dùng Q cũ nếu có để tính giai đoạn đang nhận
            BigDecimal K = param.getSnapshotSupplyRateK(); // K/tháng
            LocalDate start = param.getScheduleStartDate();
            LocalDate planEnd = param.getPlanEndDate();

//        double inv         = param.getInitialInventory().doubleValue();
            BigDecimal dailyConsume = previousQ.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP); // Dùng Q cũ để tính tiêu thụ hàng ngày
            double dailyRise = (K.doubleValue() - Q.doubleValue()) / 30.0;

            // Xác định giai đoạn đang nhận lô hàng cũ (nếu có)
            LocalDate recvStart = null;
            LocalDate recvEnd = null;
            long tnDays = previousParam.getInventoryResult().getReplenishmentTimeTn()
                    .multiply(java.math.BigDecimal.valueOf(30))
                    .setScale(0, java.math.RoundingMode.HALF_UP)
                    .longValue();
            LocalDate planStartDate = param.getPlanStartDate();

            OrderSchedule latestOrder = previousParam.getInventoryResult().getOrderSchedules()
                    .stream()
                    .filter(order -> order.getExpectedDeliveryDate() != null
                            && !order.getExpectedDeliveryDate().isAfter(planStartDate))
                    .max(Comparator.comparing(OrderSchedule::getExpectedDeliveryDate))
                    .orElse(null);
//            System.out.println(previousParam.getId());
//        System.out.println(latestOrder.getInventoryResult());
            recvStart = latestOrder != null ? latestOrder.getExpectedDeliveryDate() : null;
            recvEnd = recvStart != null ? recvStart.plusDays(tnDays) : null;
            log.info("Lô đang bay trước ngày {}: giao {}, Tn={} ngày, kết thúc nhận {}",
                    planStartDate, recvStart, tnDays, recvEnd);


            // Tìm ngày chạm B
            BigDecimal inv = previousParam.getInventoryResult().getMaxInventoryLevel();

            if (inv.compareTo(B) >= 0) {
                long plusDay = inv.subtract(B)
                        .divide(dailyConsume, 0, RoundingMode.CEILING)
                        .longValue();

                System.out.println("Ngày đặt hàng đầu tiên: " + recvEnd.plusDays(plusDay));
                return recvEnd.plusDays(plusDay);
            }
            // Nếu tồn kho không bao giờ chạm B trong kỳ → lùi lịch
            BigDecimal l_new = param.getSnapshotLeadTimeL() != null ? param.getSnapshotLeadTimeL() : param.getSnapshotLeadTimeL();
            l_new = l_new.multiply(BigDecimal.valueOf(30)).setScale(0, RoundingMode.CEILING);
            BigDecimal consumptionDays = inv.divide(dailyConsume, 0, RoundingMode.DOWN);
            assert l_new != null;
            System.out.println("l_new: " + l_new);
            System.out.println("consumptionDays: " + consumptionDays);
            BigDecimal days = l_new.subtract(consumptionDays);

            assert recvEnd != null;
            LocalDate orderDate = recvEnd.minusDays(days.longValue());
            if (orderDate.isBefore(LocalDate.now())) {
                log.warn("Tồn kho: {} không chạm B: {} trong kỳ, nhưng nếu lùi lịch sẽ vượt ngày hiện tại không thể tạo lịch (productId={})",
                        inv, B, param.getProductId());
            }
            log.warn("Tồn kho: {} không chạm B: {} trong kỳ, sinh lịch (productId={}) vào ngày {}",
                    inv, B, param.getProductId(), orderDate);
            return orderDate;
        }
        // -------------------------------------------------------
        // TRƯỜNG HỢP: LẦN ĐẦU TIÊN LẬP KỊCH
        // -------------------------------------------------------
        BigDecimal initialInventory = param.getInitialInventory();
        LocalDate scheduleStart = param.getScheduleStartDate();
        BigDecimal B = result.getReorderPointB();
        BigDecimal Q = param.getDemandQ();          // Q/tháng
        BigDecimal dailyConsume = Q.divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
        BigDecimal lNewDays = param.getSnapshotLeadTimeL()
                .multiply(BigDecimal.valueOf(30))
                .setScale(0, RoundingMode.CEILING);

        // Nhánh 1: Không có initialInventory → bắt đầu từ scheduleStartDate như cũ
        if (initialInventory == null) {
            log.info("Lần đầu lập kế hoạch, không có initialInventory " +
                    "→ bắt đầu sinh lịch từ scheduleStartDate={}", scheduleStart);
            return scheduleStart;
        }

        // Nhánh 2: initialInventory >= B → tồn kho đủ cao, chờ giảm xuống B rồi đặt
        if (initialInventory.compareTo(B) >= 0) {
            // Số ngày từ scheduleStart đến khi tồn kho chạm B
            long daysUntilB = initialInventory.subtract(B)
                    .divide(dailyConsume, 0, RoundingMode.CEILING)
                    .longValue();
            LocalDate firstOrderDate = scheduleStart.plusDays(daysUntilB);
            log.info("initialInventory={} >= B={}, đặt hàng đầu tiên vào ngày {} " +
                            "(sau {} ngày kể từ {})",
                    initialInventory, B, firstOrderDate, daysUntilB, scheduleStart);
            return firstOrderDate;
        }

        // Nhánh 3: initialInventory < B → phải đặt hàng ngay
        // Kiểm tra tồn kho có đủ duy trì trong Lead Time không
        BigDecimal inventoryDurability = initialInventory.divide(dailyConsume, 4, RoundingMode.DOWN);
        // Số ngày tồn kho còn duy trì được
        long daysCanSustain = inventoryDurability.setScale(0, RoundingMode.DOWN).longValue();

        if (initialInventory.compareTo(Q.multiply(param.getSnapshotLeadTimeL())) >= 0) {
            // Tồn kho đủ chịu đựng Lead Time → đặt ngay hôm nay, hàng về kịp
            log.info("initialInventory={} < B={} nhưng đủ duy trì qua Lead Time " +
                            "→ đặt hàng ngay tại scheduleStartDate={}",
                    initialInventory, B, scheduleStart);
            return scheduleStart;
        }

        // Tồn kho KHÔNG đủ duy trì qua Lead Time → sẽ stockout
        long stockoutDays = lNewDays.longValue() - daysCanSustain;
        log.warn("STOCKOUT DỰ KIẾN: initialInventory={} < Q*L={}, " +
                        "tồn kho hết sau {} ngày, hàng về sau {} ngày → thiếu hàng {} ngày. " +
                        "Khuyến nghị: tăng initialInventory hoặc giảm Lead Time L. (productId={})",
                initialInventory,
                Q.multiply(param.getSnapshotLeadTimeL()).setScale(2, RoundingMode.HALF_UP),
                daysCanSustain,
                lNewDays.longValue(),
                stockoutDays,
                param.getProductId());

        // Vẫn sinh lịch từ scheduleStartDate nhưng đã log cảnh báo
        // (hệ thống không chặn, để người dùng quyết định điều chỉnh)
        return scheduleStart;
    }


    /**
     * PUBLIC: Mô phỏng tồn kho tại targetDate — dùng bởi StockCountService.
     *
     * KHÁC với simulateInventory() (dùng cho replan/predictInventory) ở 2 điểm:
     *   1. Query schedules theo expectedDeliveryDate (không phải orderDate),
     *      đảm bảo không bỏ sót lô nào có cửa sổ nhận giao với [simStart, targetDate].
     *   2. dailyRise = (K-Q)/30 trực tiếp, không dùng maxInventoryLevel/tnDays
     *      (tránh sai số do làm tròn tnDays).
     *
     * Trả về null nếu không có kế hoạch ACTIVE nào.
     */
    public BigDecimal simulateStockCountInventoryAt(String productId, LocalDate targetDate) {
        Optional<InventoryParameter> activeOpt = parameterRepository.findCoveringPlan(productId, targetDate);
        if (activeOpt.isEmpty()) return null;

        InventoryParameter active = activeOpt.get();
        InventoryResult result = resultRepository
                .findByInventoryParameterId(active.getId())
                .orElse(null);
        if (result == null) return null;

        LocalDate simStart = active.getScheduleStartDate();
        // ── THÊM LOG NÀY ──
        log.info("[STOCK_SIM] productId={} | simStart={} | targetDate={} | initialInventory={}",
                productId, simStart, targetDate, active.getInitialInventory());

        // Nếu targetDate <= simStart → trả về tồn kho đầu kỳ
        if (!targetDate.isAfter(simStart)) {
            log.info("[STOCK_SIM] → EARLY RETURN (targetDate <= simStart), trả về {}",
                    active.getInitialInventory() != null ? active.getInitialInventory() : "reorderPointB");
            return active.getInitialInventory() != null
                    ? active.getInitialInventory()
                    : result.getReorderPointB();
        }

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(simStart, targetDate);
        long tnDays    = Math.round(result.getReplenishmentTimeTn().doubleValue() * 30);

        // dailyRise = (K-Q)/30 — tốc độ tăng tồn kho ròng khi đang nhận hàng
        double K            = active.getSnapshotSupplyRateK().doubleValue();
        double Q            = active.getDemandQ().doubleValue();
        double dailyConsume = Q / 30.0;
        double dailyRise    = (K - Q) / 30.0;
        double maxInv       = result.getMaxInventoryLevel().doubleValue();

        // Query theo expectedDeliveryDate để tìm đúng các lô có cửa sổ nhận
        // [delivDate, delivDate + tnDays - 1] giao với simulation period [simStart, targetDate].
        // Điều kiện:
        //   delivDate <= targetDate           (window bắt đầu trước targetDate)
        //   delivDate + tnDays - 1 >= simStart  → delivDate >= simStart - tnDays + 1
        LocalDate delivFrom = simStart.minusDays(Math.max(tnDays - 1, 0));
        LocalDate delivTo   = targetDate;

        List<OrderSchedule> schedules = scheduleRepository
                .findByProductIdAndExpectedDeliveryDateBetween(productId, delivFrom, delivTo);

        log.info("[STOCK_SIM] schedules found={}, delivWindow=[{}, {}]",
                schedules.size(), delivFrom, delivTo);
        if (!schedules.isEmpty()) {
            schedules.forEach(s -> log.info("[STOCK_SIM]   → delivery={}", s.getExpectedDeliveryDate()));
        }

        log.debug("simulateInventoryAt: productId={}, simStart={}, targetDate={}, "
                        + "tnDays={}, schedules={}, delivWindow=[{},{}]",
                productId, simStart, targetDate, tnDays, schedules.size(), delivFrom, delivTo);

        double inv = result.getReorderPointB().doubleValue();
        if (active.getInitialInventory() != null) {
            inv = active.getInitialInventory().doubleValue();
        }

        for (long day = 0; day < totalDays; day++) {
            LocalDate current = simStart.plusDays(day);

            // isReceiving: current nằm trong cửa sổ nhận hàng của BẤT KỲ lô nào
            boolean isReceiving = schedules.stream().anyMatch(s -> {
                LocalDate recvStart = s.getExpectedDeliveryDate();
                LocalDate recvEnd   = recvStart.plusDays(tnDays - 1);
                return !current.isBefore(recvStart) && !current.isAfter(recvEnd);
            });

            if (isReceiving) {
                inv = Math.min(inv + dailyRise, maxInv);
            } else {
                inv = Math.max(inv - dailyConsume, 0);
            }
        }

        return BigDecimal.valueOf(inv).setScale(2, RoundingMode.HALF_UP);
    }

    // -------------------------------------------------------
    // MÔ PHỎNG TỒN KHO
    // -------------------------------------------------------

    /**
     * Mô phỏng tồn kho theo mô hình bổ sung dần từ đầu kỳ kế hoạch đến targetDate.
     * Dùng để dự đoán tồn kho khi người dùng muốn replan.
     */
    private BigDecimal simulateInventory(InventoryParameter param,
                                         InventoryResult result,
                                         LocalDate targetDate) {
        LocalDate simStart = param.getScheduleStartDate();
        System.out.println("Param: " + param.getScheduleStartDate());
        System.out.println("Result: " + result.getCalculatedAt());
        System.out.println("TargetDate: " + targetDate);
        if (!targetDate.isAfter(simStart)) {
            return param.getInitialInventory() != null
                    ? param.getInitialInventory()
                    : result.getReorderPointB();
        }

        long totalDays = ChronoUnit.DAYS.between(simStart, targetDate);
        long leadDays = Math.round(param.getSnapshotLeadTimeL().doubleValue() * 30);
        long tnDays = Math.round(result.getReplenishmentTimeTn().doubleValue() * 30);
        long cycleDays = Math.round(result.getOptimalCycleTimeTau().doubleValue() * 30);

        double dailyConsume = param.getDemandQ().doubleValue() / 30.0;
        double dailyRise = result.getMaxInventoryLevel().doubleValue() / (tnDays > 0 ? tnDays : 1);

        // Xây dựng danh sách ngày nhận hàng từ lịch đặt hàng đã sinh
        List<OrderSchedule> schedules = scheduleRepository
                .findByProductIdAndOrderDateBetween(
                        param.getProductId(), simStart, targetDate.plusDays(leadDays));

        double inv = result.getReorderPointB().doubleValue();
        if (param.getInitialInventory() != null) {
            inv = param.getInitialInventory().doubleValue();
        }

        for (long day = 0; day < totalDays; day++) {
            LocalDate current = simStart.plusDays(day);
            boolean isReceiving = schedules.stream().anyMatch(s -> {
                LocalDate recvStart = s.getExpectedDeliveryDate();
                LocalDate recvEnd = recvStart.plusDays(tnDays - 1);
                return !current.isBefore(recvStart) && !current.isAfter(recvEnd);
            });

            if (isReceiving) {
                inv = Math.min(inv + dailyRise, result.getMaxInventoryLevel().doubleValue() * 1.1);
            } else {
                inv = Math.max(inv - dailyConsume, 0);
            }
        }

        return BigDecimal.valueOf(inv).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * PUBLIC wrapper của simulateInventory — dùng chung bởi:
     *   - StockCountService (tính systemQuantity khi tạo phiếu kiểm kê)
     *   - ServiceLevelAnalytics (đếm ngày stockout trong chu kỳ)
     *   - predictInventory (đã dùng private, giữ nguyên)
     *
     * Tự tìm kế hoạch ACTIVE gần nhất và mô phỏng từ scheduleStartDate đến targetDate.
     * Trả về null nếu không tìm thấy kế hoạch ACTIVE nào.
     */
    public BigDecimal simulateInventoryAt(String productId, LocalDate targetDate) {
        Optional<InventoryParameter> activeOpt =
                parameterRepository.findLatestActive(productId).stream().findFirst();
        if (activeOpt.isEmpty()) return null;

        InventoryParameter active = activeOpt.get();
        InventoryResult result = resultRepository
                .findByInventoryParameterId(active.getId())
                .orElse(null);
        if (result == null) return null;

        return simulateInventory(active, result, targetDate);
    }

    // -------------------------------------------------------
    // OVERLAP CHECK & SUGGEST
    // -------------------------------------------------------

    public List<InventoryParameter> findOverlapping(InventoryParameterRequest request) {
        LocalDate today = LocalDate.now();
        PeriodResolver.validate(request, today, null);
        PeriodResolver.ResolvedPeriod resolved = PeriodResolver.resolve(request, today, null);
        return parameterRepository.findOverlapping(
                request.getProductId(), resolved.planStartDate(), resolved.planEndDate());
    }

    public ForecastSuggestionResponse getSuggestion(String productId) {
        ForecastResult demandForecast = forecastOrchestrator.forecastDemand(productId);
        ForecastResult leadTimeForecast = forecastOrchestrator.forecastLeadTime(productId);

        Optional<SupplierProductData> supplierData = supplierServiceClient.getByProductId(productId);

        ForecastSuggestionResponse.ForecastSuggestionResponseBuilder builder =
                ForecastSuggestionResponse.builder()
                        .productId(productId)
                        .suggestedQ(demandForecast.getForecastValue() > 0
                                ? BigDecimal.valueOf(demandForecast.getForecastValue()) : null)
                        .demandForecast(demandForecast)
                        .leadTimeForecast(leadTimeForecast)
                        .requiresManualInput(demandForecast.isRequiresManualInput());

        supplierData.ifPresent(sp -> {
            builder.supplierName(sp.getSupplierName());
            builder.supplierProductId(sp.getId());
            builder.currentSupplyRateK(sp.getMaxSupplyPerMonth());
            builder.currentFixedOrderCostA(sp.getFixedOrderCost());
            builder.currentUnitPriceC(sp.getUnitPrice());
            builder.currentLeadTimeDays(sp.getCommittedLeadTimeDays());
        });

        return builder.build();
    }

    // -------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------

    private String buildOverlapMessage(List<InventoryParameter> overlapping) {
        String detail = overlapping.stream()
                .map(p -> "Tháng " + p.getPlanStartDate().getMonthValue()
                        + "–" + p.getPlanEndDate().getMonthValue()
                        + "/" + p.getPlanStartDate().getYear()
                        + " [" + p.getStatus() + "]")
                .reduce((a, b) -> a + ", " + b).orElse("");
        return "Khoảng thời gian bị trùng: " + detail
                + ". Dùng POST /api/inventory/replan nếu muốn thay thế kế hoạch cũ.";
    }

    private String lastDeliveryDate(List<OrderSchedule> schedules) {
        return schedules.stream()
                .map(s -> s.getExpectedDeliveryDate().toString())
                .max(String::compareTo).orElse("?");
    }

    private ProductResponse findProduct(String productId) {
        ProductResponse product = productService.getProductById(productId);
        if (product == null) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId);
        }
        return product;
    }

    private WarehouseConfig resolveWarehouseConfig(InventoryParameterRequest request) {
        if (request.getWarehouseConfigId() != null) {
            return warehouseConfigRepository.findById(request.getWarehouseConfigId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Cấu hình kho", request.getWarehouseConfigId()));
        }
        throw new RuntimeException("Not found warehouse config with request" + request);
    }

    private SnapshotData resolveSnapshot(InventoryParameterRequest request) {
        // Ngưỡng cảnh báo lệch lead time (20%)
        final double DEVIATION_WARNING_THRESHOLD = 0.20;

        Optional<SupplierProductData> supplierOpt =
                supplierServiceClient.getByProductId(request.getProductId());

        if (supplierOpt.isPresent()) {
            SupplierProductData sp = supplierOpt.get();
            log.info("Dùng SUPPLIER_SERVICE cho productId={}", request.getProductId());

            // Lead time cam kết từ nhà cung cấp (tháng)
            BigDecimal committedLeadTimeL = BigDecimal.valueOf(sp.getCommittedLeadTimeDays() / 30.0)
                    .setScale(4, RoundingMode.HALF_UP);

            // Xác định nguồn lead time
            String leadTimeSource = request.getLeadTimeSource();
            if (leadTimeSource == null || leadTimeSource.isBlank()) {
                leadTimeSource = "COMMITTED";
            }

            BigDecimal effectiveLeadTimeL = committedLeadTimeL;
            boolean deviationWarning = false;
            String deviationMessage = null;

            // Luôn lấy forecast lead time để kiểm tra deviation (nếu có dữ liệu)
            BigDecimal forecastLeadTimeL = null;
            try {
                ForecastResult ltForecast = forecastOrchestrator.forecastLeadTime(request.getProductId());
                if (!ltForecast.isRequiresManualInput() && ltForecast.getForecastValue() > 0) {
                    forecastLeadTimeL = BigDecimal.valueOf(ltForecast.getForecastValue() / 30.0)
                            .setScale(4, RoundingMode.HALF_UP);
                }
            } catch (Exception e) {
                log.warn("Không thể forecast lead time cho productId={}: {}", request.getProductId(), e.getMessage());
            }

            // Kiểm tra deviation giữa committed và forecast
            if (forecastLeadTimeL != null && sp.getCommittedLeadTimeDays() > 0) {
                double committedDays = sp.getCommittedLeadTimeDays();
                double forecastDays  = forecastLeadTimeL.doubleValue() * 30;
                double deviation = Math.abs(forecastDays - committedDays) / committedDays;
                if (deviation > DEVIATION_WARNING_THRESHOLD) {
                    deviationWarning = true;
                    deviationMessage = String.format(
                            "Cảnh báo: Lead time dự báo (%.1f ngày) lệch %.1f%% so với cam kết NCC (%d ngày). " +
                            "Cân nhắc chọn nguồn lead time phù hợp.",
                            forecastDays, deviation * 100, sp.getCommittedLeadTimeDays());
                    log.warn("Lead time deviation > {}% cho productId={}: committed={}d, forecast={}d",
                            (int)(DEVIATION_WARNING_THRESHOLD * 100), request.getProductId(),
                            committedDays, forecastDays);
                }
            }

            // Chọn lead time theo nguồn người dùng yêu cầu
            if ("FORECAST".equalsIgnoreCase(leadTimeSource) && forecastLeadTimeL != null) {
                effectiveLeadTimeL = forecastLeadTimeL;
                log.info("Dùng FORECAST lead time={} tháng cho productId={}",
                        effectiveLeadTimeL, request.getProductId());
            } else if ("MANUAL".equalsIgnoreCase(leadTimeSource) && request.getManualLeadTimeDays() != null) {
                effectiveLeadTimeL = request.getManualLeadTimeDays()
                        .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP);
                leadTimeSource = "MANUAL";
                log.info("Dùng MANUAL lead time={} ngày cho productId={}",
                        request.getManualLeadTimeDays(), request.getProductId());
            } else {
                leadTimeSource = "COMMITTED";
                log.info("Dùng COMMITTED lead time={} tháng cho productId={}",
                        effectiveLeadTimeL, request.getProductId());
            }

            return SnapshotData.builder()
                    .supplierProductId(UUID.fromString(sp.getId()))
                    .supplyRateK(sp.getMaxSupplyPerMonth())
                    .fixedOrderCostA(sp.getFixedOrderCost())
                    .unitPriceC(sp.getUnitPrice())
                    .leadTimeL(effectiveLeadTimeL)
                    .source("SUPPLIER_SERVICE")
                    .leadTimeSource(leadTimeSource)
                    .deviationWarning(deviationWarning)
                    .deviationMessage(deviationMessage)
                    .build();
        }

        Optional<InventoryParameter> previousOpt =
                parameterRepository.findTopByProductIdOrderByPlanStartDateDesc(request.getProductId());

        if (previousOpt.isPresent()) {
            InventoryParameter prev = previousOpt.get();
            log.warn("Dùng PREVIOUS_PERIOD cho productId={}", request.getProductId());
            return SnapshotData.builder()
                    .supplierProductId(prev.getSupplierProductId())
                    .supplyRateK(prev.getSnapshotSupplyRateK())
                    .fixedOrderCostA(prev.getSnapshotFixedOrderCostA())
                    .unitPriceC(prev.getSnapshotUnitPriceC())
                    .leadTimeL(prev.getSnapshotLeadTimeL())
                    .source("PREVIOUS_PERIOD")
                    .leadTimeSource("COMMITTED")
                    .build();
        }

        if (request.getManualSupplyRateK() != null
                && request.getManualFixedOrderCostA() != null
                && request.getManualUnitPriceC() != null
                && request.getManualLeadTimeDays() != null) {
            return SnapshotData.builder()
                    .supplierProductId(null)
                    .supplyRateK(request.getManualSupplyRateK())
                    .fixedOrderCostA(request.getManualFixedOrderCostA())
                    .unitPriceC(request.getManualUnitPriceC())
                    .leadTimeL(request.getManualLeadTimeDays()
                            .divide(BigDecimal.valueOf(30), 4, RoundingMode.HALF_UP))
                    .source("MANUAL")
                    .leadTimeSource("MANUAL")
                    .build();
        }

        throw new IllegalStateException(
                "Không thể lấy K,A,C,L cho sản phẩm id=" + request.getProductId());
    }

    private InventoryResult saveResult(InventoryParameter param, InventoryCalculationResult calc) {
        InventoryResult result = resultRepository
                .findByInventoryParameterId(param.getId())
                .orElse(InventoryResult.builder().inventoryParameter(param).build());

        result.setOptimalOrderQtyS(calc.getOptimalOrderQtyS());
        result.setOptimalOrderCountN(calc.getOptimalOrderCountN());
        result.setOptimalCycleTimeTau(calc.getOptimalCycleTimeTau());
        result.setMaxInventoryLevel(calc.getMaxInventoryLevel());
        result.setAvgInventoryLevel(calc.getAvgInventoryLevel());
        result.setReorderPointB(calc.getReorderPointB());
        result.setMinTotalCost(calc.getMinTotalCost());
        result.setTotalCostWithPurchase(calc.getTotalCostWithPurchase());
        result.setReplenishmentTimeTn(calc.getReplenishmentTimeTn());
        result.setMValue(calc.getMValue());

        resultRepository.save(result);
        return result;
    }

    public InventoryParameterResponse getParameterRange(String productId, YearMonth yearMonth) {
        int yearMonthInt = yearMonth.getYear() * 100 + yearMonth.getMonthValue(); // 202604
        InventoryParameter params = parameterRepository.findBestMatchByMonth(productId, yearMonthInt)
                .orElse(null);
        return inventoryPlanningMapper.toInventoryParameterResponse(params);
    }

    @lombok.Builder
    @lombok.Data
    private static class SnapshotData {
        UUID supplierProductId;
        BigDecimal supplyRateK;
        BigDecimal fixedOrderCostA;
        BigDecimal unitPriceC;
        BigDecimal leadTimeL;
        String source;          // SUPPLIER_SERVICE | PREVIOUS_PERIOD | MANUAL
        String leadTimeSource;  // COMMITTED | FORECAST | MANUAL (audit trail)
        boolean deviationWarning;
        String deviationMessage;
    }
}