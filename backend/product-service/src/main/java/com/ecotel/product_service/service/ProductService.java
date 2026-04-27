package com.ecotel.product_service.service;

import com.ecotel.product_service.dto.request.ProductRequest;
import com.ecotel.product_service.model.ProductCategory;
import com.ecotel.product_service.repository.ProductCategoryRepository;
import com.ecotel.product_service.repository.ProductRepository;
import com.ecotel.product_service.dto.response.*;
import com.ecotel.product_service.enums.ProductStatus;
import com.ecotel.product_service.mapper.ProductMapper;
import com.ecotel.product_service.model.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductMapper productMapper;
    private final WebClient webClient;

    // GET PRODUCTS WITH FILTERS
    public List<ProductResponse> getProducts(String categoryId, ProductStatus status) {
//        String tokenValue = getToken();
        Specification<Product> spec = (root, query, cb) -> null;

        if (categoryId != null && !"all".equals(categoryId)){
            spec = (spec).and((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }

        if (status != null){
            spec = (spec).and((root, query, cb) ->
                    cb.equal(root.get("status"), status));
        }

        return productRepository.findAll(spec).stream()
                .map(productMapper::toProductResponse)
                .toList();
    }

    // GET PRODUCT BY ID
    public ProductResponse getProductById(String productId) {
        return productRepository.findById(productId)
                .map(productMapper::toProductResponse)
                .orElse(null);
    }

    // AGGREGATE PRODUCT
    @Cacheable(value = "inventory",
            key = "#categoryId + '_' + #warehouseId + '_' + #status",
            unless = "#result.totalItems == 0")
    public ProductInventoryResponse getGroupedInventory(
            String categoryId,
            String warehouseId,
            String siteId,
            ProductStatus status
    ) {
        // 1. Get filtered products from Product Service
        List<ProductResponse> products = getProducts(categoryId, status);

        if (products.isEmpty()) {
            return ProductInventoryResponse.empty();
        }

        // 2. Get product IDs
        List<String> productIds = products.stream()
                .map(ProductResponse::getId)
                .toList();

        // 3. Get inventory data from Warehouse Service
        List<InventoryResponse> inventories = webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/inventories/by-products")
                        .queryParamIfPresent("warehouseId", Optional.ofNullable(warehouseId))
                        .queryParamIfPresent("siteId", Optional.ofNullable(siteId))
                        .build())
//                .headers(headers -> {
//                    assert tokenValue != null;
//                    headers.setBearerAuth(tokenValue);
//                }) // ✅ Gắn Authorization header
                .bodyValue(productIds)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<InventoryResponse>>>() {})
                .map(ApiResponse::getData)  // ⚡ Lấy data từ wrapper
                .block();                         // ⚠️ block để dùng sync

        // 4. Get warehouse info if needed
        Map<String, WarehouseResponse> warehouseMap = new HashMap<>();
        if (!"all".equals(warehouseId)) {
            WarehouseResponse warehouse = webClient.get()
                    .uri("/warehouses/{id}", warehouseId)
//                    .headers(headers -> {
//                        assert tokenValue != null;
//                        headers.setBearerAuth(tokenValue);
//                    }) // ✅ Gắn Authorization header
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<WarehouseResponse>>() {})
                    .map(ApiResponse::getData)
                    .block();
            if (warehouse != null ) {
                if ("all".equals(siteId) || warehouse.getSiteId().equals(siteId)) {
                    warehouseMap.put(warehouse.getId(), warehouse);
                }
            }
        } else if (!"all".equals(siteId)){
            List<WarehouseResponse> warehouses = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/warehouses/by-site/{siteId}")
                            .build(siteId))
//                       .headers(headers -> {
//                           assert tokenValue != null;
//                           headers.setBearerAuth(tokenValue);
//                       }) // ✅ Gắn Authorization header
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<WarehouseResponse>>>() {})
                    .map(ApiResponse::getData)
                    .block();
            if (warehouses != null) {
                for (WarehouseResponse wh : warehouses) {
                    warehouseMap.put(wh.getId(), wh);
                }
            }
        } else {
            // All warehouses involved in the inventories
            assert inventories != null;
            List<String> warehouseIds = inventories.stream()
                    .map(InventoryResponse::getWarehouseId)
                    .distinct()
                    .toList();
            List<WarehouseResponse> warehouses = webClient.post()
                    .uri("/warehouses/batch")
//                    .headers(headers -> {
//                        assert tokenValue != null;
//                        headers.setBearerAuth(tokenValue);
//                    }) // ✅ Gắn Authorization header
                    .bodyValue(warehouseIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<ApiResponse<List<WarehouseResponse>>>() {})
                    .map(ApiResponse::getData)
                    .block();
            if (warehouses != null) {
                for (WarehouseResponse wh : warehouses) {
                    warehouseMap.put(wh.getId(), wh);
                }
            }
        }

        System.out.println(products);
        System.out.println(inventories);
        System.out.println(warehouseMap);
        // 5. Aggregate data
        return aggregateInventoryData(products, inventories, warehouseMap);
    }

    // Helper method to aggregate inventory data
    private ProductInventoryResponse aggregateInventoryData(
            List<ProductResponse> products,
            List<InventoryResponse> inventories,
            Map<String, WarehouseResponse> warehouseMap) {

        // Create product map for quick lookup
        Map<String, ProductResponse> productMap = new HashMap<>();
        for (ProductResponse product : products) {
            productMap.put(product.getId(), product);
        }

        // Group inventory by product
        Map<String, List<InventoryResponse>> inventoryByProduct = new HashMap<>();
        if (inventories != null) {
            for (InventoryResponse inventory : inventories) {
                inventoryByProduct
                        .computeIfAbsent(inventory.getProductId(), k -> new ArrayList<>())
                        .add(inventory);
            }
        }

        // Build response
        List<ProductInventoryItem> items = inventoryByProduct.entrySet().stream()
                .map(entry -> {
                    String productId = entry.getKey();
                    List<InventoryResponse> productInventories = entry.getValue();
                    ProductResponse product = productMap.get(productId);

                    if (product == null) return null;

                    List<WarehouseStock> warehouseStocks = productInventories.stream()
                            .map(inv -> {
                                WarehouseResponse warehouse = warehouseMap.get(inv.getWarehouseId());
                                return WarehouseStock.builder()
                                        .warehouseId(inv.getWarehouseId())
                                        .warehouseName(warehouse != null ? warehouse.getWarehouseName() : "Unknown")
                                        .quantity(inv.getQuantity())
                                        .build();
                            })
                            .toList();
                    BigDecimal totalQuantity = warehouseStocks.stream()
                            .map(WarehouseStock::getQuantity)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return ProductInventoryItem.builder()
                            .productId(product.getId())
                            .name(product.getProductName())
                            .categoryId(product.getCategoryId())
                            .categoryName(product.getCategoryName())
                            .unit(product.getUnit())
                            .totalQuantity(totalQuantity)
                            .warehouses(warehouseStocks)
                            .build();
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(ProductInventoryItem::getName))
                .toList();

        BigDecimal totalStock = items.stream()
                .map(ProductInventoryItem::getTotalQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ProductInventoryResponse.builder()
                .totalStock(totalStock)
                .items(items)
                .totalItems(items.size())
                .build();
    }

    // GET PRODUCT NAME BY ID
    public String getProductNameById(String productId) {
        return productRepository.findById(productId)
                .map(Product::getProductName)
                .orElse(null);
    }

    // GET PRODUCT NAMES BY ID
    public Map<String, String> getProductNameByIds(List<String> productIds) {
        List<Product> products = productRepository.findAllById(productIds);
        Map<String, String> productNames = new HashMap<>();
        for (Product product : products) {
            productNames.put(product.getId(), product.getProductName());
        }
        return productNames;
    }

    public ProductResponse create(ProductRequest productRequest) {
        Product product = productMapper.toProduct(productRequest);
        ProductCategory productCategory = productCategoryRepository.findById(productRequest.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        product.setCategory(productCategory);
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse update(String id, ProductRequest productRequest) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
        productMapper.updateProductFromRequest(productRequest, product);
        ProductCategory productCategory = productCategoryRepository.findById(productRequest.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại"));
        product.setCategory(productCategory);
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse deactivate(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
        product.setStatus(ProductStatus.INACTIVE);
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse active(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mặt hàng không tồn tại"));
        product.setStatus(ProductStatus.ACTIVE);
        return productMapper.toProductResponse(productRepository.save(product));
    }

}
