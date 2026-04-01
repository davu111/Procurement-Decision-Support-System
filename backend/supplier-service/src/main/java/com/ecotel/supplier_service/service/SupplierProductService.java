package com.ecotel.supplier_service.service;

import com.ecotel.supplier_service.dto.request.SupplierProductRequest;
import com.ecotel.supplier_service.dto.request.SupplierProductUpdateRequest;
import com.ecotel.supplier_service.dto.response.SupplierProductResponse;
import com.ecotel.supplier_service.exception.ResourceNotFoundException;
import com.ecotel.supplier_service.mapper.SupplierProductMapper;
import com.ecotel.supplier_service.model.Supplier;
import com.ecotel.supplier_service.model.SupplierProduct;
import com.ecotel.supplier_service.repository.SupplierProductRepository;
import com.ecotel.supplier_service.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierProductService {

    private final SupplierProductRepository supplierProductRepository;
    private final SupplierRepository supplierRepository;
    private final SupplierProductMapper supplierProductMapper;

    public List<SupplierProductResponse> getBySupplierId(UUID supplierId) {
        return supplierProductRepository.findBySupplierId(supplierId)
                .stream().map(supplierProductMapper::toSupplierProductResponse).collect(Collectors.toList());
    }

    public SupplierProductResponse getById(UUID id) {
        return supplierProductMapper.toSupplierProductResponse(findById(id));
    }

    /**
     * Endpoint chính mà Inventory Service gọi khi tạo kỳ kế hoạch mới.
     * Trả về K, A, C, L của sản phẩm từ nhà cung cấp đang active.
     */
    public SupplierProductResponse getByProductId(Long productId) {
        SupplierProduct sp = supplierProductRepository
                .findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thông tin nhà cung cấp cho sản phẩm id: " + productId));
        return supplierProductMapper.toSupplierProductResponse(sp);
    }

    @Transactional
    public SupplierProductResponse create(UUID supplierId, SupplierProductRequest request) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", supplierId));

        if (supplierProductRepository.existsBySupplierIdAndProductId(supplierId, request.getProductId())) {
            throw new IllegalArgumentException(
                    "Nhà cung cấp này đã có thông tin cho sản phẩm id: " + request.getProductId());
        }

        SupplierProduct sp = supplierProductMapper.toSupplierProduct(request);
        sp.setSupplier(supplier);

        return supplierProductMapper.toSupplierProductResponse(supplierProductRepository.save(sp));
    }

    @Transactional
    public SupplierProductResponse update(SupplierProductUpdateRequest request) {
        SupplierProduct sp = findById(UUID.fromString(request.getId()));

        supplierProductMapper.updateSupplierProductFromRequest(request, sp);

        return supplierProductMapper.toSupplierProductResponse(supplierProductRepository.save(sp));
    }

    @Transactional
    public void deactivate(UUID id) {
        SupplierProduct sp = findById(id);
        sp.setIsActive(false);
        supplierProductRepository.save(sp);
    }

    @Transactional
    public void activate(UUID id) {
        SupplierProduct sp = findById(id);
        sp.setIsActive(true);
        supplierProductRepository.save(sp);
    }

    // -------------------------------------------------------
    private SupplierProduct findById(UUID id) {
        return supplierProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SupplierProduct", id));
    }
}
