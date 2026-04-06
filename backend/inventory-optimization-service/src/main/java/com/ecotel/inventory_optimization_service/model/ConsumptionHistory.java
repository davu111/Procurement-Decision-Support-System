package com.ecotel.inventory_optimization_service.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Lịch sử tiêu thụ thực tế - nền tảng cho hệ thống đề xuất tự động
 * Mỗi record là dữ liệu tiêu thụ thực tế của 1 mặt hàng trong 1 kỳ
 */
@Entity
@Table(name = "consumption_history",
        uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "period_start_date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsumptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Luôn là ngày 1 của tháng (vd: 2025-01-01)
    @Column(name = "period_start_date", nullable = false)
    private LocalDate periodStartDate; // ngày đầu kỳ

    @Column(name = "period_end_date", nullable = false)
    private LocalDate periodEndDate; // ngày cuối kỳ

    @Column(name = "actual_consumption", nullable = false, precision = 18, scale = 4)
    private BigDecimal actualConsumption; // Q thực tế trong kỳ

    @Column(name = "planned_consumption", precision = 18, scale = 4)
    private BigDecimal plannedConsumption; // Q kế hoạch (để tính sai số)

    @Column(name = "actual_lead_time_days", precision = 8, scale = 2)
    private BigDecimal actualLeadTimeDays; // L thực tế (ngày) - tính từ ngày đặt đến ngày nhận

    @Column(name = "actual_supply_rate", precision = 18, scale = 4)
    private BigDecimal actualSupplyRate; // K thực tế trong kỳ

    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
