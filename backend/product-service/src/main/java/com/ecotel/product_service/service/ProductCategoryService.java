package com.ecotel.product_service.service;

import com.ecotel.product_service.repository.ProductCategoryRepository;
import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.mapper.ProductCategoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCategoryService {
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductCategoryMapper productCategoryMapper;

    // GET BY ID
    public ProductCategoryResponse getProductCategoryById(String categoryId) {
        return productCategoryRepository.findById(categoryId)
                .map(productCategoryMapper::toProductCategoryResponse)
                .orElse(null);
    }

    // GET ALL
    public List<ProductCategoryResponse> getAllProductCategories() {
        return productCategoryRepository.findAll().stream()
                .map(productCategoryMapper::toProductCategoryResponse)
                .toList();
    }
}
