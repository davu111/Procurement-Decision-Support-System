package com.ecotel.supplier_service.service;

import com.ecotel.supplier_service.dto.request.SupplierRequest;
import com.ecotel.supplier_service.dto.request.SupplierUpdateRequest;
import com.ecotel.supplier_service.dto.response.SupplierResponse;
import com.ecotel.supplier_service.exception.ResourceNotFoundException;
import com.ecotel.supplier_service.mapper.SupplierMapper;
import com.ecotel.supplier_service.model.Supplier;
import com.ecotel.supplier_service.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    public List<SupplierResponse> getAll() {
        return supplierRepository.findAll()
                .stream().map(supplierMapper::toSupplierResponse).collect(Collectors.toList());
    }

    public SupplierResponse getById(UUID id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", id));
        return supplierMapper.toSupplierResponse(supplier);
    }

    @Transactional
    public SupplierResponse create(SupplierRequest request) {
        if (supplierRepository.existsBySupplierCode(request.getSupplierCode())) {
            throw new IllegalArgumentException(
                    "Mã NCC '" + request.getSupplierCode() + "' đã tồn tại");
        }
        Supplier supplier = supplierMapper.toSupplier(request);
        return supplierMapper.toSupplierResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse update(SupplierUpdateRequest request) {
        UUID uuid = UUID.fromString(request.getId());
        Supplier supplier = findById(uuid);

        supplierMapper.updateSupplierFromRequest(request, supplier);

        return supplierMapper.toSupplierResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public void deactivate(UUID id) {
        Supplier supplier = findById(id);
        supplier.setIsActive(false);
        supplierRepository.save(supplier);
    }

    @Transactional
    public void active(UUID id) {
        Supplier supplier = findById(id);
        supplier.setIsActive(true);
        supplierRepository.save(supplier);
    }

    // -------------------------------------------------------
    private Supplier findById(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Nhà cung cấp", id));
    }
}
