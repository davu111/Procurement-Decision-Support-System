package com.ecotel.inventory_optimization_service.dto.response;

import com.ecotel.inventory_optimization_service.model.InventoryResult;
import com.ecotel.inventory_optimization_service.model.Product;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderScheduleResponse {
    Long id;
    Long inventoryResultId; // để tiện trả về API, sẽ map sang InventoryResultResponse ở service
    Long productId; // để tiện trả về API, sẽ map sang ProductResponse ở service
    Integer orderSequence; // thứ tự lần đặt hàng (1, 2, 3...)
    LocalDate orderDate; // ngày đặt hàng
    LocalDate expectedDeliveryDate; // ngày dự kiến nhận hàng
    BigDecimal orderQuantity; // S* - số lượng đặt mua
    BigDecimal estimatedCost; // A + C*S* - chi phí ước tính lần đặt này
    Boolean isReorderWarning; // cảnh báo sắp đến điểm đặt hàng B
    LocalDate actualOrderDate; // ngày thực tế đặt (cập nhật sau)
    LocalDate actualDeliveryDate; // ngày thực tế nhận (cập nhật sau)
    BigDecimal actualQuantity; // số lượng thực tế nhận (cập nhật sau)
    LocalDateTime createdAt;
}
