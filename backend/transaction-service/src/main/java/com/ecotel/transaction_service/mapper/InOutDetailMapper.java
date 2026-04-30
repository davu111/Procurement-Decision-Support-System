package com.ecotel.transaction_service.mapper;

import com.ecotel.transaction_service.dto.request.InOutDetailRequest;
import com.ecotel.transaction_service.dto.response.InOutDetailResponse;
import com.ecotel.transaction_service.dto.response.ReportDetail;
import com.ecotel.transaction_service.model.InOutDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface InOutDetailMapper {
    InOutDetailResponse toInOutDetailResponse(InOutDetail inOutDetail);
    @Mapping(target = "transaction", ignore = true)
    InOutDetail toInOutDetail(InOutDetailRequest inOutDetailRequest);

    @Mapping(target = "actualQuantity", source = "quantity")
    ReportDetail toReportDetail(InOutDetail inOutDetail);

    void updateInOutDetail(@MappingTarget InOutDetail existingDetail, InOutDetailRequest request);
}
