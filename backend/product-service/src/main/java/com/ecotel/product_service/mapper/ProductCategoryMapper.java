package com.ecotel.product_service.mapper;

import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.model.ProductCategory;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProductCategoryMapper {
    ProductCategoryResponse toProductCategoryResponse(ProductCategory productCategory);
}
