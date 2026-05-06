package com.ecotel.product_service.mapper;

import com.ecotel.shared_library.dto.response.PageResponse;
import org.mapstruct.Mapper;
import org.springframework.data.domain.Page;

@Mapper(componentModel = "spring")
public interface PageMapper {

    default <T> PageResponse<T> toPageResponse(Page<T> page) {
        if (page == null) return null;

        return PageResponse.<T>builder()
                .content(page.getContent())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }
}
