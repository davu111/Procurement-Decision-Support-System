package com.ecotel.transaction_service.dto.request;

import com.ecotel.transaction_service.enums.TransactionStatus;
import com.ecotel.transaction_service.enums.WorkType;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InOutTransactionUpdateRequest {
    String id;
    String transactionCode;
    String planId;
    String warehouseId;
    String vehicleId;
    WorkType workType;
    TransactionStatus status;
    LocalDateTime createdAt;
    LocalDateTime confirmedAt;
    LocalDateTime updatedAt;
    List<InOutDetailRequest> inOutDetails;
}
