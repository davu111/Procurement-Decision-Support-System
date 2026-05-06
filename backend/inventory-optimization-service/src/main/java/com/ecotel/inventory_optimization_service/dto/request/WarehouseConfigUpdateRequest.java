package com.ecotel.inventory_optimization_service.dto.response;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
public class WarehouseConfigResponse {
    private Long id;
    private BigDecimal interestRate; // lãi suất vốn vay/cơ hội (%/năm), ví dụ: 0.08
    private BigDecimal warehouseMonthlyCost; // chi phí thuê/khấu hao kho mỗi tháng
    private BigDecimal warehouseMaxCapacity; // sức chứa tối đa (cùng đơn vị với hàng hóa)
    private BigDecimal spoilageRate; // tỉ lệ hao hụt/hỏng hóc (%/năm), ví dụ: 0.02
    private BigDecimal insuranceRate; // phí bảo hiểm (%/năm), ví dụ: 0.005
    private BigDecimal storageCostCoefficient; // I được tính tự động
    private LocalDateTime updatedAt;
}
