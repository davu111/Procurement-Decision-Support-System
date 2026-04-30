package com.ecotel.transaction_service.service;

import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import com.ecotel.transaction_service.dto.response.ReportDetail;
import com.ecotel.transaction_service.dto.response.TransactionReport;
import com.ecotel.transaction_service.enums.WorkType;
import com.ecotel.transaction_service.mapper.InOutDetailMapper;
import com.ecotel.transaction_service.mapper.InOutTransactionMapper;
import com.ecotel.transaction_service.model.InOutDetail;
import com.ecotel.transaction_service.model.InOutTransaction;
import com.ecotel.transaction_service.model.TransactionFile;
import com.ecotel.transaction_service.repository.InOutTransactionRepository;
import com.ecotel.transaction_service.service.external.OrderScheduleService;
import com.ecotel.transaction_service.service.external.SupplierService;
import com.ecotel.transaction_service.service.external.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {
    private final InOutTransactionRepository transactionRepository;
    private final InOutTransactionMapper transactionMapper;
    private final InOutDetailMapper detailMapper;
    private final WordService wordService;
    private final WarehouseService warehouseService;
    private final ProductService productService;
    private final OrderScheduleService orderScheduleService;
    private final SupplierService supplierService;
    private final FileManagementService fileManagementService;
    private final LibreOfficeService libreOfficeService;
    /**
     * Tạo file Word
     *
     * @param transactionId ID
     * @return Đường dẫn file được tạo
     */
    public Long generateReport(String transactionId) throws Exception {
        log.info("Generating transaction warehouse import report for transaction id: {}", transactionId);

        // 1. Lấy thông tin transaction từ database
        InOutTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found: " + transactionId));

        // 2. Map dữ liệu sang TransactionReport
        TransactionReport transactionReport = mapToTransactionReport(transaction);
        System.out.println(transactionReport);

        ByteArrayOutputStream wordOutput = new ByteArrayOutputStream();
        String fileName = "";
        if (transaction.getWorkType().equals(WorkType.IMPORT)) {

            // 3. Tạo file Word từ template
            wordOutput = wordService.generateTransactionReport(
                    transactionReport,
                    "phieu-nhap-kho-theo-thong-tu-99.docx"  // Tên file template
            );

            // 4. Upload file lên MinIO
            fileName = String.format("phieu-nhap-kho-hoan-chinh_%s_%s.docx",
                    LocalDate.now(),
                    transactionId);
        } else {
            // 3. Tạo file Word từ template
            wordOutput = wordService.generateTransactionReport(
                    transactionReport,
                    "phieu-xuat-kho-theo-thong-tu-99.docx"  // Tên file template
            );

            // 4. Upload file lên MinIO
            fileName = String.format("phieu-xuat-kho-hoan-chinh_%s_%s.docx",
                    LocalDate.now(),
                    transactionId);
        }

        // 🔥 NEW: convert DOCX → PDF
        byte[] pdfBytes = libreOfficeService.convertToPdf(wordOutput);

        String pdfFileName = fileName.replace(".docx", ".pdf");

        TransactionFile uploadedFile = fileManagementService.uploadAndSave(
                new ByteArrayOutputStream() {{
                    write(pdfBytes);
                }},
                pdfFileName,
                transactionId
        );
        System.out.println(uploadedFile);

        return uploadedFile.getId();
    }

    // HELPER METHOD
    private TransactionReport mapToTransactionReport(InOutTransaction transaction){
        TransactionReport transactionReport = transactionMapper.toTransactionReport(transaction);

        transactionReport.setWarehouseName(warehouseService.getWarehouseNameById(transaction.getWarehouseId()));

        List<ReportDetail> reportDetails = new ArrayList<>();
        transaction.getDetails().forEach(detail -> {
            ReportDetail reportDetail = detailMapper.toReportDetail(detail);
            reportDetails.add(reportDetail);
        });

        List<String> productIds = transaction.getDetails().stream()
                .map(InOutDetail::getProductId)
                .toList();

        Map<String, ProductResponse> productMap = productService.getProductMapByIds(productIds);

        Map<String, BigDecimal> orderScheduleMap = orderScheduleService.getLastOrder(productIds);

        Map<String, BigDecimal> productUnit = supplierService.getMapProductUnit(productIds);

        System.out.println("Product Map" + productMap);
        System.out.println("OrderSchedule Map" + orderScheduleMap);
        System.out.println("Product Unit" + productUnit);

        for (ReportDetail rp: reportDetails) {
            String productId = rp.getProductId();

            rp.setProductName(productMap.get(productId).getProductName());
            rp.setProductCode(productMap.get(productId).getCode());
            rp.setUnit(productMap.get(productId).getUnit());

            rp.setPlannedQuantity(orderScheduleMap.get(productId));

            rp.setPrice(productUnit.get(productId));
        }

        transactionReport.setDetails(reportDetails);
        return transactionReport;
    }
}
