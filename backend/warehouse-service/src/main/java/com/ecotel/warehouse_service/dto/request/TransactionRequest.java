package com.ecotel.warehouse_service.dto.request;

import com.ecotel.warehouse_service.enums.WorkType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class TransactionRequest {
    String warehouseId;
    WorkType workType;
    Map<String, BigDecimal> productQuantities;
}
