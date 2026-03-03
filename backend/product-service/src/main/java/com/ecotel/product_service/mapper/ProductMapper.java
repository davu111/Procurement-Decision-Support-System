package com.ecotel.product_service.mapper;

import com.ecotel.product_service.dto.response.ProductResponse;
import com.ecotel.product_service.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.categoryName", target = "categoryName")
    ProductResponse toProductResponse(Product product);
}
