package com.ecotel.product_service.service;

import com.ecotel.product_service.dto.request.ProductCategoryRequest;
import com.ecotel.product_service.dto.request.ProductCategoryRequest;
import com.ecotel.product_service.dto.response.ProductCategoryResponse;
import com.ecotel.product_service.enums.ProductStatus;
import com.ecotel.product_service.model.Product;
import com.ecotel.product_service.model.ProductCategory;
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
    
    // CREATE
    public ProductCategoryResponse createProductCategory(ProductCategoryRequest request) {
        ProductCategory productCategory = productCategoryMapper.toProductCategory(request);
        return productCategoryMapper.toProductCategoryResponse(productCategoryRepository.save(productCategory));
    }

    public ProductCategoryResponse update(String id, ProductCategoryRequest productRequest) {
        ProductCategory product = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        productCategoryMapper.updateProductCategoryFromRequest(productRequest, product);
        return productCategoryMapper.toProductCategoryResponse(productCategoryRepository.save(product));
    }

    public ProductCategoryResponse deactivate(String id) {
        ProductCategory product = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        product.setIsActive(false);
        return productCategoryMapper.toProductCategoryResponse(productCategoryRepository.save(product));
    }

    public ProductCategoryResponse active(String id) {
        ProductCategory product = productCategoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        product.setIsActive(true);
        return productCategoryMapper.toProductCategoryResponse(productCategoryRepository.save(product));
    }
}
