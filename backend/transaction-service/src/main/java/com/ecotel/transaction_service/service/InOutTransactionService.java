package com.ecotel.transaction_service.service;

import com.ecotel.shared_library.service.ProductService;
import com.ecotel.transaction_service.dto.request.InOutDetailRequest;
import com.ecotel.transaction_service.dto.request.InOutTransactionRequest;
import com.ecotel.transaction_service.dto.request.InOutTransactionUpdateRequest;
import com.ecotel.transaction_service.dto.response.InOutDetailResponse;
import com.ecotel.transaction_service.dto.response.InOutTransactionResponse;
import com.ecotel.transaction_service.mapper.InOutDetailMapper;
import com.ecotel.transaction_service.mapper.InOutTransactionMapper;
import com.ecotel.transaction_service.model.InOutDetail;
import com.ecotel.transaction_service.model.InOutTransaction;
import com.ecotel.transaction_service.repository.InOutDetailRepository;
import com.ecotel.transaction_service.repository.InOutTransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class InOutTransactionService {
    private final InOutTransactionRepository inOutTransactionRepository;
    private final InOutDetailRepository inOutDetailRepository;
    private final InOutTransactionMapper inOutTransactionMapper;
    private final InOutDetailMapper inOutDetailMapper;
    private final ProductService productService;

    // GET TRANSACTION BY ID
    public InOutTransactionResponse getTransactionById(String transactionId) {
        log.info("Fetching transaction with id: {}", transactionId);
        InOutTransaction transaction = inOutTransactionRepository.findById(transactionId)
                .orElseThrow(() -> {
                    log.error("Transaction not found with id: {}", transactionId);
                    return new RuntimeException("Transaction not found with id: " + transactionId);
                });
        return mapToResponseWithDetails(transaction);
    }

    // GET TRANSACTION BY WAREHOUSEID
    public Page<InOutTransactionResponse> getTransactionByWarehouseId(
            String warehouseId,
            int page,
            int size,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        log.info("Fetching transactions with warehouseId={}, page={}, size={}",
                warehouseId, page, size);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<InOutTransaction> transactionPage =
                inOutTransactionRepository.findByWarehouseIdWithFilter(
                        warehouseId, startDate, endDate, pageable
                );

        return transactionPage.map(this::mapToResponseWithDetails);
    }

    // GET ALL TRANSACTIONS
    public Page<InOutTransactionResponse> getAllTransactions(
            int page,
            int size,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        log.info("Fetching transactions with filter: page={}, size={}, startDate={}, endDate={}",
                page, size, startDate, endDate);

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<InOutTransaction> transactionPage =
                inOutTransactionRepository.findAllWithFilter(startDate, endDate, pageable);

        return transactionPage.map(this::mapToResponseWithDetails);
    }

    /**
     * Tạo transaction mới với các details
     * - Transaction được lưu trước
     * - Details được map và liên kết với transaction
     * - Cascade CascadeType.ALL sẽ tự động save details
     */
    @Transactional
    public InOutTransactionResponse createTransaction(InOutTransactionRequest request) {
        log.info("Creating new transaction");
        
        // Map request thành entity transaction
        InOutTransaction transaction = inOutTransactionMapper.toInOutTransaction(request);
        
        // Xử lý details nếu có
        if (request.getInOutDetails() != null && !request.getInOutDetails().isEmpty()) {
            Set<InOutDetail> details = request.getInOutDetails().stream()
                    .map(detailRequest -> {
                        InOutDetail detail = inOutDetailMapper.toInOutDetail(detailRequest);
                        detail.setTransaction(transaction);  // Set relationship
                        return detail;
                    })
                    .collect(Collectors.toSet());
            transaction.setDetails(details);
        } else {
            transaction.setDetails(new HashSet<>());
        }
        
        // Save transaction - cascade sẽ tự động save details
        InOutTransaction savedTransaction = inOutTransactionRepository.save(transaction);
        log.info("Transaction created successfully with id: {}", savedTransaction.getId());
        
        return mapToResponseWithDetails(savedTransaction);
    }

    /**
     * Tạo hàng loạt transactions
     * Batch operation cho phép tạo nhiều transactions cùng lúc
     */
    @Transactional
    public List<InOutTransactionResponse> createTransactionBatch(List<InOutTransactionRequest> requests) {
        log.info("Creating batch of {} transactions", requests.size());
        
        List<InOutTransaction> transactions = requests.stream()
                .map(request -> {
                    InOutTransaction transaction = inOutTransactionMapper.toInOutTransaction(request);
                    
                    // Xử lý details
                    if (request.getInOutDetails() != null && !request.getInOutDetails().isEmpty()) {
                        Set<InOutDetail> details = request.getInOutDetails().stream()
                                .map(detailRequest -> {
                                    InOutDetail detail = inOutDetailMapper.toInOutDetail(detailRequest);
                                    detail.setTransaction(transaction);
                                    return detail;
                                })
                                .collect(Collectors.toSet());
                        transaction.setDetails(details);
                    } else {
                        transaction.setDetails(new HashSet<>());
                    }
                    
                    return transaction;
                })
                .collect(Collectors.toList());
        
        // Save batch - cascade sẽ tự động save tất cả details
        List<InOutTransaction> savedTransactions = inOutTransactionRepository.saveAll(transactions);
        log.info("Batch of {} transactions created successfully", savedTransactions.size());
        
        return savedTransactions.stream()
                .map(this::mapToResponseWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * Cập nhật transaction và details
     * - Cập nhật thông tin transaction
     * - Xoá các details cũ không còn trong request
     * - Thêm/cập nhật các details mới
     * 
     * Quan trọng: Explicitly delete details từ DB trước để tránh unique constraint violation
     */
    @Transactional
    public InOutTransactionResponse updateTransaction(String transactionId, InOutTransactionRequest request) {
        log.info("Updating transaction with id: {}", transactionId);

        InOutTransaction existingTransaction = inOutTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        inOutTransactionMapper.updateInOutTransactionFromRequest(request, existingTransaction);

        // Xử lý details
        if (request.getInOutDetails() != null) {
            Map<String, InOutDetailRequest> newDetailsMap = request.getInOutDetails().stream()
                    .collect(Collectors.toMap(InOutDetailRequest::getProductId, d -> d));

            // Xóa các detail không còn tồn tại trong request
            existingTransaction.getDetails().removeIf(detail -> {
                String productId = detail.getProductId();
                if (!newDetailsMap.containsKey(productId)) {
                    return true; // Xóa detail này
                } else {
                    // Cập nhật quantity nếu detail vẫn tồn tại
                    InOutDetailRequest detailRequest = newDetailsMap.get(productId);
                    detail.setQuantity(detailRequest.getQuantity());
                    newDetailsMap.remove(productId); // Đánh dấu đã xử lý
                    return false; // Giữ lại detail này
                }
            });

            // Thêm các detail mới
            newDetailsMap.values().forEach(detailRequest -> {
                InOutDetail newDetail = inOutDetailMapper.toInOutDetail(detailRequest);
                newDetail.setTransaction(existingTransaction);
                existingTransaction.getDetails().add(newDetail);
            });
        } else {
            existingTransaction.getDetails().clear();
        }

        InOutTransaction updatedTransaction = inOutTransactionRepository.save(existingTransaction);
        log.info("Transaction updated successfully");

        return mapToResponseWithDetails(updatedTransaction);
    }

    /**
     * Cập nhật hàng loạt transactions
     * Batch operation cho phép cập nhật nhiều transactions cùng lúc
     * 
     * Quan trọng: Explicitly delete details từ DB trước để tránh unique constraint violation
     */
    @Transactional
    public List<InOutTransactionResponse> updateTransactionBatch(List<InOutTransactionUpdateRequest> requests) {
        log.info("Updating batch of {} transactions", requests.size());
        
        List<InOutTransaction> updatedTransactions = requests.stream()
                .map(request -> {
                    String transactionId = request.getId();
                    InOutTransaction existingTransaction = inOutTransactionRepository.findById(transactionId)
                            .orElseThrow(() -> {
                                log.error("Transaction not found with id: {}", transactionId);
                                return new RuntimeException("Transaction not found with id: " + transactionId);
                            });
                    
                    // Cập nhật thông tin transaction
                    inOutTransactionMapper.updateInOutTransactionFromUpdateRequest(request, existingTransaction);

                    // Xử lý details
                    if (request.getInOutDetails() != null) {
                        Map<String, InOutDetailRequest> newDetailsMap = request.getInOutDetails().stream()
                                .collect(Collectors.toMap(InOutDetailRequest::getProductId, d -> d));

                        // Xóa các detail không còn tồn tại trong request
                        existingTransaction.getDetails().removeIf(detail -> {
                            String productId = detail.getProductId();
                            if (!newDetailsMap.containsKey(productId)) {
                                return true; // Xóa detail này
                            } else {
                                // Cập nhật quantity nếu detail vẫn tồn tại
                                InOutDetailRequest detailRequest = newDetailsMap.get(productId);
                                detail.setQuantity(detailRequest.getQuantity());
                                newDetailsMap.remove(productId); // Đánh dấu đã xử lý
                                return false; // Giữ lại detail này
                            }
                        });

                        // Thêm các detail mới
                        newDetailsMap.values().forEach(detailRequest -> {
                            InOutDetail newDetail = inOutDetailMapper.toInOutDetail(detailRequest);
                            newDetail.setTransaction(existingTransaction);
                            existingTransaction.getDetails().add(newDetail);
                        });
                    } else {
                        existingTransaction.getDetails().clear();
                    }
                    return existingTransaction;
                })
                .collect(Collectors.toList());
        
        // Save batch
        List<InOutTransaction> savedTransactions = inOutTransactionRepository.saveAll(updatedTransactions);
        log.info("Batch of {} transactions updated successfully", savedTransactions.size());
        
        return savedTransactions.stream()
                .map(this::mapToResponseWithDetails)
                .collect(Collectors.toList());
    }

    /**
     * Xoá transaction theo ID
     * - Cascade CascadeType.ALL và orphanRemoval = true
     * - Sẽ tự động xoá tất cả details liên quan
     */
    @Transactional
    public void deleteTransaction(String transactionId) {
        log.info("Deleting transaction with id: {}", transactionId);
        
        if (!inOutTransactionRepository.existsById(transactionId)) {
            log.error("Transaction not found with id: {}", transactionId);
            throw new RuntimeException("Transaction not found with id: " + transactionId);
        }
        
        inOutTransactionRepository.deleteById(transactionId);
        log.info("Transaction deleted successfully with id: {}", transactionId);
    }

    /**
     * Xoá hàng loạt transactions
     * Batch operation cho phép xoá nhiều transactions cùng lúc
     */
    @Transactional
    public void deleteTransactionBatch(List<String> transactionIds) {
        log.info("Deleting batch of {} transactions", transactionIds.size());
        
        // Validate tất cả transactions tồn tại
        List<InOutTransaction> transactionsToDelete = transactionIds.stream()
                .map(id -> inOutTransactionRepository.findById(id)
                        .orElseThrow(() -> {
                            log.error("Transaction not found with id: {}", id);
                            return new RuntimeException("Transaction not found with id: " + id);
                        }))
                .collect(Collectors.toList());
        
        // Delete all at once
        inOutTransactionRepository.deleteAll(transactionsToDelete);
        log.info("Batch of {} transactions deleted successfully", transactionIds.size());
    }

    /**
     * Lấy chi tiết của một transaction (chỉ details)
     */
    public List<InOutDetailResponse> getDetailsByTransactionId(String transactionId) {
        log.info("Fetching details for transaction: {}", transactionId);
        
        InOutTransaction transaction = inOutTransactionRepository.findById(transactionId)
                .orElseThrow(() -> {
                    log.error("Transaction not found with id: {}", transactionId);
                    return new RuntimeException("Transaction not found with id: " + transactionId);
                });
        
        return transaction.getDetails().stream()
                .map(inOutDetailMapper::toInOutDetailResponse)
                .collect(Collectors.toList());
    }

    /**
     * Helper method: Map InOutTransaction sang InOutTransactionResponse đầy đủ details
     */
    private InOutTransactionResponse mapToResponseWithDetails(InOutTransaction transaction) {
        InOutTransactionResponse response = inOutTransactionMapper.toInOutTransactionResponse(transaction);
        if (transaction.getDetails() != null && !transaction.getDetails().isEmpty()) {
            response.setInOutDetails(
                    transaction.getDetails().stream()
                            .map(inOutDetailMapper::toInOutDetailResponse)
                            .collect(Collectors.toList())
            );

            Map<String, String> productNames = productService.getProductNameByIds(
                    response.getInOutDetails().stream()
                            .map(InOutDetailResponse::getProductId)
                            .toList()
            );

            response.getInOutDetails().forEach(detail -> detail.setProductName(productNames.get(detail.getProductId())));
        }
        return response;
    }
}
