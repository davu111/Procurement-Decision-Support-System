package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.request.ProductRequest;
import com.ecotel.inventory_optimization_service.dto.response.ProductResponse;
import com.ecotel.inventory_optimization_service.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductResponse toProductResponse(Product product);
    Product toProduct(ProductRequest productRequest);

    void updateProductFromRequest(ProductRequest request, @MappingTarget Product product);
}
