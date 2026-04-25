package com.ecotel.product_service.mapper;

import com.ecotel.product_service.dto.request.ProductCategoryRequest;
import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.model.ProductCategory;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductCategoryMapper {
    ProductCategory toProductCategory(ProductCategoryRequest request);
    ProductCategoryResponse toProductCategoryResponse(ProductCategory productCategory);

    void updateProductCategoryFromRequest(ProductCategoryRequest request, @MappingTarget ProductCategory productCategory);
}
