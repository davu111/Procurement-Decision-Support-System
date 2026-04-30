package com.ecotel.transaction_service.dto.response;

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
public class TransactionReport {
    String id;
    String warehouseId;
    String warehouseName;
    WorkType workType;
    TransactionStatus status;
    LocalDateTime createdAt;
    LocalDateTime confirmedAt;
    LocalDateTime updatedAt;
    List<ReportDetail> details;
}
