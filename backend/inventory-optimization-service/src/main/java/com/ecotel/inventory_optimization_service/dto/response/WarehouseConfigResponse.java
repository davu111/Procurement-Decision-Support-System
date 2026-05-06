package com.ecotel.inventory_optimization_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Cấu hình kho - dùng để tính tự động hệ số chi phí bảo quản I
 * I = interestRate + warehouseCostRate + spoilageRate + insuranceRate
 */
@Entity
@Table(name = "warehouse_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarehouseConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === Thành phần tính I ===

    @Column(name = "interest_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal interestRate; // lãi suất vốn vay/cơ hội (%/năm), ví dụ: 0.08

    // Alias để đồng bộ field name
    @Column(name = "warehouse_monthly_cost", nullable = false, precision = 18, scale = 4)
    private BigDecimal warehouseMonthlyCost; // chi phí thuê/khấu hao kho mỗi tháng

    @Column(name = "warehouse_max_capacity", nullable = false, precision = 18, scale = 4)
    private BigDecimal warehouseMaxCapacity; // sức chứa tối đa (cùng đơn vị với hàng hóa)

    @Column(name = "spoilage_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal spoilageRate; // tỉ lệ hao hụt/hỏng hóc (%/năm), ví dụ: 0.02

    @Column(name = "insurance_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal insuranceRate; // phí bảo hiểm (%/năm), ví dụ: 0.005

    // === Kết quả tính I ===

    @Column(name = "storage_cost_coefficient", nullable = false, precision = 8, scale = 4)
    private BigDecimal storageCostCoefficient; // I được tính tự động

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Tính lại I từ các thành phần
     * I = interestRate + (warehouseMonthlyCost*12)/(maxCapacity*avgUnitPrice) + spoilageRate + insuranceRate
     * Lưu ý: warehouseCostRate được tính dựa trên đơn giá trung bình truyền vào
     */
    public void recalculateCoefficient(BigDecimal avgUnitPrice) {
        BigDecimal warehouseAnnualCost = warehouseMonthlyCost.multiply(BigDecimal.valueOf(12));
        BigDecimal totalCapacityValue = warehouseMaxCapacity.multiply(avgUnitPrice);
        BigDecimal warehouseCostRate = totalCapacityValue.compareTo(BigDecimal.ZERO) > 0
                ? warehouseAnnualCost.divide(totalCapacityValue, 6, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        this.storageCostCoefficient = interestRate
                .add(warehouseCostRate)
                .add(spoilageRate)
                .add(insuranceRate);
    }

}
