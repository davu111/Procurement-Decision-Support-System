package com.ecotel.transaction_service.dto.response;

import com.ecotel.transaction_service.enums.TransactionStatus;
import com.ecotel.transaction_service.enums.WorkType;
import com.ecotel.transaction_service.model.InOutDetail;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InOutTransactionResponse {
    String id;
    String transactionCode;
    String warehouseId;
    WorkType workType;
    TransactionStatus status;
    LocalDateTime createdAt;
    LocalDateTime confirmedAt;
    LocalDateTime updatedAt;
    List<InOutDetailResponse> inOutDetails;
}
