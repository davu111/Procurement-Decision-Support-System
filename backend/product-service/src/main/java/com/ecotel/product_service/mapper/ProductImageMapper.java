package com.ecotel.product_service.mapper;

import com.ecotel.product_service.dto.response.ProductImageResponse;
import com.ecotel.product_service.model.ProductImage;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {
    ProductImageResponse toProductImageResponse(ProductImage productImage);
}
