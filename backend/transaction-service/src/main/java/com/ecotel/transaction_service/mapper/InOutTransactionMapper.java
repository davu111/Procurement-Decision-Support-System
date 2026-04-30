package com.ecotel.transaction_service.mapper;

import com.ecotel.transaction_service.dto.request.InOutTransactionRequest;
import com.ecotel.transaction_service.dto.request.InOutTransactionUpdateRequest;
import com.ecotel.transaction_service.dto.response.InOutTransactionResponse;
import com.ecotel.transaction_service.dto.response.TransactionReport;
import com.ecotel.transaction_service.model.InOutTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface InOutTransactionMapper {
    InOutTransactionResponse toInOutTransactionResponse(InOutTransaction inOutTransaction);
    @Mapping(target = "details", ignore = true)
    InOutTransaction toInOutTransaction(InOutTransactionRequest inOutTransactionRequest);

    @Mapping(target = "details", ignore = true)
    TransactionReport toTransactionReport(InOutTransaction inOutTransaction);

    void updateInOutTransactionFromRequest(InOutTransactionRequest request, @MappingTarget InOutTransaction existingTransaction);
    void updateInOutTransactionFromUpdateRequest(InOutTransactionUpdateRequest request, @MappingTarget InOutTransaction existingTransaction);
}
