package com.ecotel.inventory_optimization_service.service;

import com.ecotel.inventory_optimization_service.dto.request.ConsumptionHistoryRequest;
import com.ecotel.inventory_optimization_service.dto.response.ImportResultResponse;
import com.ecotel.inventory_optimization_service.exception.ResourceNotFoundException;
import com.ecotel.inventory_optimization_service.mapper.ConsumptionHistoryMapper;
import com.ecotel.inventory_optimization_service.model.ConsumptionHistory;
import com.ecotel.inventory_optimization_service.repository.ConsumptionHistoryRepository;
import com.ecotel.shared_library.dto.response.ProductResponse;
import com.ecotel.shared_library.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Parse file CSV hoặc XLSX thành danh sách ConsumptionHistoryRequest.
 *
 * Cấu trúc cột (thứ tự cố định, header bắt buộc):
 *   product_id | period_start_date | period_end_date | actual_consumption
 *   | planned_consumption | actual_lead_time_days | actual_supply_rate | notes
 *
 * Định dạng ngày chấp nhận: yyyy-MM-dd, dd/MM/yyyy, MM/yyyy (→ tự điền ngày đầu/cuối tháng)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsumptionHistoryImportService {
    private final ConsumptionHistoryRepository historyRepository;
    private final ConsumptionHistoryMapper mapper;
    private final ProductService productService;

    private static final List<DateTimeFormatter> DATE_FORMATTERS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("d/M/yyyy")
    );

    // -------------------------------------------------------
    // ENTRY POINT
    // -------------------------------------------------------

    public List<ConsumptionHistoryRequest> parseFile(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return parseXlsx(file);
        } else if (filename.endsWith(".csv")) {
            return parseCsv(file);
        } else {
            throw new IllegalArgumentException(
                    "Định dạng file không hỗ trợ: chỉ chấp nhận .csv hoặc .xlsx");
        }
    }

    // -------------------------------------------------------
    // CSV PARSER
    // -------------------------------------------------------

    private List<ConsumptionHistoryRequest> parseCsv(MultipartFile file) throws Exception {
        List<ConsumptionHistoryRequest> result = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT
                     .builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            int rowNum = 2; // bắt đầu từ dòng 2 (dòng 1 là header)
            for (CSVRecord record : parser) {
                try {
                    result.add(parseRecord(
                            getCsvCell(record, "product_id"),
                            getCsvCell(record, "period_start_date"),
                            getCsvCell(record, "period_end_date"),
                            getCsvCell(record, "actual_consumption"),
                            getCsvCell(record, "planned_consumption"),
                            getCsvCell(record, "actual_lead_time_days"),
                            getCsvCell(record, "actual_supply_rate"),
                            getCsvCell(record, "notes"),
                            rowNum
                    ));
                } catch (Exception e) {
                    errors.add("Dòng " + rowNum + ": " + e.getMessage());
                }
                rowNum++;
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Lỗi khi đọc file:\n" + String.join("\n", errors));
        }
        return result;
    }

    private String getCsvCell(CSVRecord record, String columnName) {
        try {
            return record.get(columnName);
        } catch (IllegalArgumentException e) {
            return null; // cột không tồn tại → null → sẽ validate sau
        }
    }

    // -------------------------------------------------------
    // XLSX PARSER
    // -------------------------------------------------------

    private List<ConsumptionHistoryRequest> parseXlsx(MultipartFile file) throws Exception {
        List<ConsumptionHistoryRequest> result = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Đọc header từ dòng đầu tiên để map tên cột → index
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("File không có header ở dòng đầu tiên");
            }

            int colProductId          = findColumn(headerRow, "product_id");
            int colPeriodStart        = findColumn(headerRow, "period_start_date");
            int colPeriodEnd          = findColumn(headerRow, "period_end_date");
            int colActualConsumption  = findColumn(headerRow, "actual_consumption");
            int colPlanned            = findColumn(headerRow, "planned_consumption");
            int colLeadTime           = findColumn(headerRow, "actual_lead_time_days");
            int colSupplyRate         = findColumn(headerRow, "actual_supply_rate");
            int colNotes              = findColumn(headerRow, "notes");

            // Đọc từng dòng dữ liệu
            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = rowIdx + 1;
                try {
                    result.add(parseRecord(
                            getXlsxCell(row, colProductId),
                            getXlsxCell(row, colPeriodStart),
                            getXlsxCell(row, colPeriodEnd),
                            getXlsxCell(row, colActualConsumption),
                            getXlsxCell(row, colPlanned),
                            getXlsxCell(row, colLeadTime),
                            getXlsxCell(row, colSupplyRate),
                            getXlsxCell(row, colNotes),
                            rowNum
                    ));
                } catch (Exception e) {
                    errors.add("Dòng " + rowNum + ": " + e.getMessage());
                }
            }
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Lỗi khi đọc file:\n" + String.join("\n", errors));
        }
        return result;
    }

    private int findColumn(Row headerRow, String name) {
        for (Cell cell : headerRow) {
            if (name.equalsIgnoreCase(getCellString(cell).trim())) {
                return cell.getColumnIndex();
            }
        }
        return -1; // cột không bắt buộc có thể không tồn tại
    }

    private String getXlsxCell(Row row, int colIndex) {
        if (colIndex < 0) return null;
        Cell cell = row.getCell(colIndex);
        return cell == null ? null : getCellString(cell);
    }

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    // Excel date → LocalDate
                    LocalDate date = cell.getLocalDateTimeCellValue().toLocalDate();
                    yield date.toString(); // yyyy-MM-dd
                }
                // Số nguyên hay thập phân
                double val = cell.getNumericCellValue();
                yield val == Math.floor(val) ? String.valueOf((long) val) : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { yield cell.getStringCellValue(); }
            }
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK
                    && !getCellString(cell).isEmpty()) {
                return false;
            }
        }
        return true;
    }

    // -------------------------------------------------------
    // PARSE RECORD — dùng chung cho CSV và XLSX
    // -------------------------------------------------------

    private ConsumptionHistoryRequest parseRecord(
            String productIdStr, String startDateStr, String endDateStr,
            String actualConsumptionStr, String plannedStr,
            String leadTimeStr, String supplyRateStr, String notes,
            int rowNum) {

        // product_id — bắt buộc
        if (isBlank(productIdStr))
            throw new IllegalArgumentException("product_id không được trống");
        String productId;
        try {
            productId = productIdStr.trim();
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("product_id không hợp lệ: " + productIdStr);
        }

        // period_start_date — bắt buộc
        if (isBlank(startDateStr))
            throw new IllegalArgumentException("period_start_date không được trống");
        LocalDate startDate = parseDate(startDateStr.trim(), "period_start_date");

        // period_end_date — bắt buộc
        if (isBlank(endDateStr))
            throw new IllegalArgumentException("period_end_date không được trống");
        LocalDate endDate = parseDate(endDateStr.trim(), "period_end_date");

        if (endDate.isBefore(startDate))
            throw new IllegalArgumentException(
                    "period_end_date (" + endDate + ") không thể trước period_start_date (" + startDate + ")");

        // actual_consumption — bắt buộc, >= 0
        if (isBlank(actualConsumptionStr))
            throw new IllegalArgumentException("actual_consumption không được trống");
        BigDecimal actualConsumption;
        try {
            actualConsumption = new BigDecimal(actualConsumptionStr.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("actual_consumption không hợp lệ: " + actualConsumptionStr);
        }
        if (actualConsumption.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("actual_consumption phải >= 0");

        // Các trường tùy chọn
        BigDecimal planned     = parseBigDecimalOptional(plannedStr,    "planned_consumption");
        BigDecimal leadTime    = parseBigDecimalOptional(leadTimeStr,   "actual_lead_time_days");
        BigDecimal supplyRate  = parseBigDecimalOptional(supplyRateStr, "actual_supply_rate");

        return ConsumptionHistoryRequest.builder()
                .productId(productId)
                .periodStartDate(startDate)
                .periodEndDate(endDate)
                .actualConsumption(actualConsumption)
                .plannedConsumption(planned)
                .actualLeadTimeDays(leadTime)
                .actualSupplyRate(supplyRate)
                .notes(isBlank(notes) ? null : notes.trim())
                .build();
    }

    // -------------------------------------------------------
    // HELPERS
    // -------------------------------------------------------

    private LocalDate parseDate(String value, String fieldName) {
        // Thử từng formatter
        for (DateTimeFormatter fmt : DATE_FORMATTERS) {
            try {
                return LocalDate.parse(value, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        // Thử định dạng MM/yyyy → ngày đầu tháng
        try {
            DateTimeFormatter mmYyyy = DateTimeFormatter.ofPattern("MM/yyyy");
            return LocalDate.parse("01/" + value, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (DateTimeParseException ignored) {}

        throw new IllegalArgumentException(
                fieldName + " không đúng định dạng (chấp nhận: yyyy-MM-dd, dd/MM/yyyy): " + value);
    }

    private BigDecimal parseBigDecimalOptional(String value, String fieldName) {
        if (isBlank(value)) return null;
        try {
            return new BigDecimal(value.trim().replace(",", "."));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " không hợp lệ: " + value);
        }
    }

    @Transactional
    public ImportResultResponse importFromFile(MultipartFile file) {
        // 1. Parse file → danh sách request
        List<ConsumptionHistoryRequest> requests;
        try {
            requests = parseFile(file);
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể đọc file: " + e.getMessage(), e);
        }

        if (requests.isEmpty()) {
            throw new IllegalArgumentException("File không có dữ liệu (ngoài header)");
        }

        // 2. Lưu từng bản ghi, ghi nhận lỗi
        int successCount = 0;
        int skipCount    = 0;
        int errorCount   = 0;
        List<String> errors     = new ArrayList<>();
        String         lastProductId = null;

        for (int i = 0; i < requests.size(); i++) {
            ConsumptionHistoryRequest req = requests.get(i);
            int rowNum = i + 2; // +2 vì dòng 1 là header

            // Lưu vào DB
            try {
                ConsumptionHistory entity = mapper.toConsumptionHistory(req);
                historyRepository.save(entity);
                successCount++;
                lastProductId = req.getProductId();
            } catch (DataIntegrityViolationException e) {
                // Unique constraint (product_id, period_start_date) → skip
                log.debug("Skip trùng: productId={}, date={}", req.getProductId(), req.getPeriodStartDate());
                skipCount++;
            } catch (Exception e) {
                errors.add("Dòng " + rowNum + ": " + e.getMessage());
                errorCount++;
            }
        }

        // 3. Model readiness
        String readiness = "";
        if (lastProductId != null) {
            int total = historyRepository.countByProductId(lastProductId);
            readiness = modelReadinessMessage(total);
        }

        // Giới hạn 20 lỗi đầu
        List<String> errorsToReturn = errors.size() > 20
                ? new ArrayList<>(errors.subList(0, 20))
                : errors;
        if (errors.size() > 20) {
            errorsToReturn.add("... và " + (errors.size() - 20) + " lỗi khác");
        }

        return ImportResultResponse.builder()
                .totalRows(requests.size())
                .successCount(successCount)
                .skipCount(skipCount)
                .errorCount(errorCount)
                .errors(errorsToReturn)
                .modelReadiness(readiness)
                .build();
    }

    // -------------------------------------------------------

    private ProductResponse findProduct(String productId) {
        ProductResponse product = productService.getProductById(productId);
        if (product == null) {
            throw new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId);
        }
        return product;
    }

    private String modelReadinessMessage(int count) {
        if (count < 6)  return "Cần " + (6 - count)  + " điểm nữa để dùng Holt-Winters.";
        if (count < 18) return "Cần " + (18 - count) + " điểm nữa để dùng Seasonal Regression.";
        return "Đang dùng mô hình Seasonal Regression — độ chính xác cao nhất.";
    }

    // -------------------------------------------------------

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
