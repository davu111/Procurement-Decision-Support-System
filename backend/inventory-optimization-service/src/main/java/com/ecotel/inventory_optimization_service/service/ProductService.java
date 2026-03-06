package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.ProductRequest;
import com.ecotel.inventory_optimization_service.dto.response.ProductResponse;
import com.ecotel.inventory_optimization_service.mapper.ProductMapper;
import com.ecotel.inventory_optimization_service.model.Product;
import com.ecotel.inventory_optimization_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public List<ProductResponse> getAll() {
        return productRepository.findByIsActiveTrue()
                .stream()
                .map(productMapper::toProductResponse)
                .toList();
    }

    public ProductResponse getById(Long id) {
        return productRepository.findById(id)
                .filter(Product::getIsActive)
                .map(productMapper::toProductResponse)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
    }

    public ProductResponse create(ProductRequest productRequest) {
        Product product = productMapper.toProduct(productRequest);
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
        productMapper.updateProductFromRequest(productRequest, product);
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse deactivate(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
        product.setIsActive(false);
        return productMapper.toProductResponse(productRepository.save(product));
    }
}
