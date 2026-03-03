package com.ecotel.plan_service.dto.response.transaction;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class TransactionResponse {
    String planId;
    String planName;
    String planCode;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String note;
    String licensePlate;
    String driverId;
    String driverName;
    List<DetailTransactionResponse> detailTransactionResponses;
}
