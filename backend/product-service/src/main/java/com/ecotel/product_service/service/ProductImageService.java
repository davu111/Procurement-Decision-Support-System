package com.ecotel.product_service.service;

import com.ecotel.product_service.dto.response.ProductImageResponse;
import com.ecotel.product_service.mapper.ProductImageMapper;
import com.ecotel.product_service.repository.ProductImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductImageService {
    private final ProductImageRepository repository;
    private final ProductImageMapper mapper;

    public ProductImageResponse getByProductId(String productId) {
        return repository.findByProductId(productId)
                .map(mapper::toProductImageResponse)
                .orElse(null);
    }

    public List<ProductImageResponse> getAll() {
        return repository.findAll().stream()
                .map(mapper::toProductImageResponse)
                .collect(Collectors.toList());
    }
}
