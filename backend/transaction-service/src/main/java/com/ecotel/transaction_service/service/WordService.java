package com.ecotel.transaction_service.service;

import com.ecotel.transaction_service.dto.response.ReportDetail;
import com.ecotel.transaction_service.dto.response.TransactionReport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.xmlbeans.XmlException;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTRow;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
@RequiredArgsConstructor
public class WordService {
    private final MinioService minioService;

    @Value("${app.template.path}")
    private String templatePath;

    @Value("${app.output.path}")
    private String outputPath;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    /**
     * Tạo file Word từ template
     */
    public ByteArrayOutputStream generateTransactionReport(TransactionReport transaction, String templateFileName) throws IOException, XmlException {
        log.info("Generating transaction warehouse import report for transaction id: {}", transaction.getId());

        // Đọc file template
        Resource resource = new ClassPathResource(templatePath + templateFileName);

        try (InputStream is = resource.getInputStream();
             XWPFDocument document = new XWPFDocument(is)) {
            // Bước 1: Thay thế placeholders ngày/tháng/năm từ createdAt
            replaceDatePlaceholders(document, transaction);

            // Bước 2: Thay thế placeholders trong paragraphs (các text thông thường)
            replacePlaceholdersInParagraphs(document, transaction);

            // Bước 3: Xử lý tables (bao gồm populate details và thay thế placeholders)
            replaceAndPopulateTables(document, transaction);

            // Ghi ra ByteArrayOutputStream
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);

            log.info("TransactionReport report generated successfully");
            return outputStream;
        }
    }

    /**
     * Thay thế placeholders trong paragraphs
     * Placeholders có dạng: {{field_name}} hoặc {{transaction.field}} hoặc {{transaction.relation.field}}
     */
    private void replacePlaceholdersInParagraphs(XWPFDocument document, TransactionReport transaction) {
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            for (XWPFRun run : paragraph.getRuns()) {
                String text = run.getText(0);
                if (text != null && text.contains("{{")) {
                    text = replacePlaceholders(text, transaction);
                    run.setText(text, 0);
                }
            }
        }
    }

    /**
     * Thay thế placeholders trong tables
     */
    private void replaceAndPopulateTables(XWPFDocument document, TransactionReport transaction) throws XmlException, IOException {
        for (XWPFTable table : document.getTables()) {
            if (isProductDetailsTable(table)) {
                // Xử lý table sản phẩm
                populateProductDetailsTable(table, transaction);
            } else {
                // Xử lý table thông thường - thay thế placeholders
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph paragraph : cell.getParagraphs()) {
                            for (XWPFRun run : paragraph.getRuns()) {
                                String text = run.getText(0);
                                if (text != null && text.contains("{{")) {
                                    text = replacePlaceholders(text, transaction);
                                    run.setText(text, 0);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private boolean isProductDetailsTable(XWPFTable table) {
        if (table.getRows().size() < 2) {
            return false;
        }

        // Kiểm tra template row (row index 1) có chứa placeholder details
        XWPFTableRow templateRow = table.getRow(1);
        for (XWPFTableCell cell : templateRow.getTableCells()) {
            String cellText = getCellText(cell);

            // Nếu tìm thấy placeholder của details → đây là product table
            if (cellText.contains("{{transaction.details.") ||
                    cellText.contains("{{details.")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Populate bảng sản phẩm với dữ liệu từ transaction.details
     * Tự động detect placeholders trong template row
     */
    private void populateProductDetailsTable(XWPFTable table, TransactionReport transaction) throws XmlException, IOException {
        if (transaction.getDetails() == null || transaction.getDetails().isEmpty()) {
            log.warn("No details found in transaction");
            return;
        }

        List<ReportDetail> details = transaction.getDetails();

        int lastRowIndex = table.getRows().size() - 1;
        XWPFTableRow templateRow = table.getRow(1);
        XWPFTableRow totalRow = null;

        // Kiểm tra row cuối có phải row tổng không
        String lastRowText = getCellText(table.getRow(lastRowIndex).getCell(0));
        if (lastRowText.contains("Cộng") || lastRowText.contains("Tổng") ||
                lastRowText.contains("{{grandTotal}}")) {
            totalRow = table.getRow(lastRowIndex);
        }

        // Phát hiện cấu trúc của template row (placeholder nào ở cell nào)
        List<CellPlaceholderInfo> cellInfos = detectTemplateCellPlaceholders(templateRow);

        // Clone XML trước khi remove
        CTRow ctRowCopy = CTRow.Factory.parse(templateRow.getCtRow().newInputStream());
        XWPFTableRow safeTemplateRow = new XWPFTableRow(ctRowCopy, table);
        // Xóa các row data cũ (giữ header và total)
        int rowsToRemove = totalRow != null ? lastRowIndex - 1 : table.getRows().size() - 1;
        for (int i = 0; i < rowsToRemove; i++) {
            table.removeRow(1);
        }

        // Tính tổng tiền
        BigDecimal grandTotal = BigDecimal.ZERO;

        // Thêm dữ liệu cho từng detail
        int stt = 1;
        for (ReportDetail detail : details) {
            // Tính thành tiền cho từng sản phẩm
            BigDecimal totalPrice = detail.getPrice() != null && detail.getActualQuantity() != null
                    ? detail.getPrice().multiply(detail.getActualQuantity())
                    : BigDecimal.ZERO;

            grandTotal = grandTotal.add(totalPrice);

            // Tạo row mới
            XWPFTableRow newRow = table.insertNewTableRow(stt);
            copyRowStyle(safeTemplateRow, newRow);

            // Đảm bảo row có đủ số cell
            int cellCount = templateRow.getTableCells().size();
            while (newRow.getTableCells().size() < cellCount) {
                newRow.createCell();
            }

            // Điền dữ liệu vào từng cell dựa trên placeholder
            for (CellPlaceholderInfo cellInfo : cellInfos) {
                String value = resolvePlaceholderForDetail(
                        cellInfo.placeholder,
                        detail,
                        stt,
                        totalPrice,
                        transaction
                );
                setCellText(newRow.getCell(cellInfo.cellIndex), value);
            }

            stt++;
        }

        // Cập nhật tổng tiền vào row tổng
        if (totalRow != null) {
            for (int i = 0; i < totalRow.getTableCells().size(); i++) {
                XWPFTableCell cell = totalRow.getCell(i);
                String cellText = getCellText(cell);
                if (cellText.contains("{{grandTotal}}")) {
                    setCellText(cell, formatCurrency(grandTotal));
                    break;
                }
            }
        }
    }

    /**
     * Phát hiện placeholders trong template row
     */
    private List<CellPlaceholderInfo> detectTemplateCellPlaceholders(XWPFTableRow templateRow) {
        List<CellPlaceholderInfo> cellInfos = new ArrayList<>();

        for (int i = 0; i < templateRow.getTableCells().size(); i++) {
            String cellText = getCellText(templateRow.getCell(i));

            // Tìm placeholder trong cell
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}");
            java.util.regex.Matcher matcher = pattern.matcher(cellText);

            if (matcher.find()) {
                String placeholder = matcher.group(1).trim();
                cellInfos.add(new CellPlaceholderInfo(i, placeholder, cellText));
            } else if (!cellText.trim().isEmpty()) {
                // Cell có text nhưng không có placeholder - giữ nguyên
                cellInfos.add(new CellPlaceholderInfo(i, null, cellText));
            }
        }

        return cellInfos;
    }

    /**
     * Resolve placeholder cho detail item
     * Hỗ trợ: {{stt}}, {{transaction.details.field}}, {{transaction.details.totalPrice}}
     */
    private String resolvePlaceholderForDetail(
            String placeholder,
            ReportDetail detail,
            int stt,
            BigDecimal totalPrice,
            TransactionReport transaction) {

        if (placeholder == null) {
            return "";
        }

        // Xử lý {{stt}}
        if ("stt".equals(placeholder)) {
            return String.valueOf(stt);
        }

        // Xử lý {{transaction.details.totalPrice}} - field tính toán
        if ("transaction.details.totalPrice".equals(placeholder) ||
                "details.totalPrice".equals(placeholder)) {
            return formatCurrency(totalPrice);
        }

        // Xử lý {{transaction.details.field}}
        if (placeholder.startsWith("transaction.details.")) {
            String fieldName = placeholder.substring("transaction.details.".length());
            return getDetailFieldValue(detail, fieldName);
        }

        // Xử lý {{details.field}} (cú pháp ngắn gọn)
        if (placeholder.startsWith("details.")) {
            String fieldName = placeholder.substring("details.".length());
            return getDetailFieldValue(detail, fieldName);
        }

        // Xử lý các field khác của transaction (nếu cần)
        if (placeholder.startsWith("transaction.")) {
            return getTransactionReportValue(
                    placeholder.substring("transaction.".length()),
                    transaction
            );
        }

        return "";
    }

    /**
     * Lấy giá trị field từ ReportDetail
     */
    private String getDetailFieldValue(ReportDetail detail, String fieldName) {
        if (detail == null || fieldName == null) {
            return "";
        }

        try {
            Object value = getFieldValueByName(detail, fieldName);

            if (value == null) {
                return "";
            }

            // Xử lý formatting
            if (value instanceof BigDecimal) {
                BigDecimal decimalValue = (BigDecimal) value;

                // Nếu là price, format với currency
                if (fieldName.toLowerCase().contains("price")) {
                    return formatCurrency(decimalValue);
                }

                // Nếu là quantity, bỏ số 0 thừa
                return decimalValue.stripTrailingZeros().toPlainString();
            }

            return value.toString();
        } catch (Exception e) {
            log.debug("Error getting detail field: {}", fieldName, e);
            return "";
        }
    }

    /**
     * Inner class để lưu thông tin về cell và placeholder
     */
    private static class CellPlaceholderInfo {
        int cellIndex;
        String placeholder;
        String originalText;

        CellPlaceholderInfo(int cellIndex, String placeholder, String originalText) {
            this.cellIndex = cellIndex;
            this.placeholder = placeholder;
            this.originalText = originalText;
        }
    }

    /**
     * Thay thế các placeholders với dữ liệu thực
     * Hỗ trợ: {{field}}, {{transaction.field}}, {{transaction.relation.field}}, {{routine_health_check.field}}
     */
    private String replacePlaceholders(String text, TransactionReport transaction) {
        // Tìm tất cả placeholders
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            String value = getPlaceholderValue(placeholder, transaction);
            matcher.appendReplacement(result, java.util.regex.Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);
        
        return result.toString();
    }

    /**
     * Lấy giá trị của placeholder từ transaction
     * Hỗ trợ nested objects: transaction.position.name, transaction.organization.name, etc.
     */
    private String getPlaceholderValue(String placeholder, TransactionReport transaction) {
        if (placeholder == null || placeholder.isEmpty()) {
            return "";
        }
        // Xử lý {{grandTotalInText}} - cần tính từ details
        if ("grandTotalInText".equals(placeholder)) {
            BigDecimal total = calculateGrandTotal(transaction);
            return convertNumberToVietnameseWords(total);
        }

        // Pattern 1: {{transaction.field}}
        if (placeholder.startsWith("transaction.")) {
            return getTransactionReportValue(placeholder.substring(12), transaction);
        }

        // Pattern 2: {{field}}
        return getTransactionReportValue(placeholder, transaction);
    }

    /**
     * Tính tổng tiền từ details
     */
    private BigDecimal calculateGrandTotal(TransactionReport transaction) {
        if (transaction.getDetails() == null || transaction.getDetails().isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal total = BigDecimal.ZERO;
        for (ReportDetail detail : transaction.getDetails()) {
            if (detail.getPrice() != null && detail.getActualQuantity() != null) {
                BigDecimal itemTotal = detail.getPrice().multiply(detail.getActualQuantity());
                total = total.add(itemTotal);
            }
        }

        return total;
    }

    /**
     * Lấy giá trị từ TransactionReport entity (hỗ trợ nested objects)
     */
    private String getTransactionReportValue(String fieldPath, TransactionReport transaction) {
        if (transaction == null || fieldPath == null || fieldPath.isEmpty()) {
            return "";
        }

        String[] parts = fieldPath.split("\\.");
        
        try {
            if (parts.length == 1) {
                // Direct field: transaction.full_name
                return getSimpleFieldValue(transaction, parts[0]);
            } else if (parts.length == 2) {
                // Nested object: transaction.position.position_name
                Object relatedObj = getFieldValue(transaction, parts[0]);
                if (relatedObj != null) {
                    return getSimpleFieldValue(relatedObj, parts[1]);
                }
            }
        } catch (Exception e) {
            log.warn("Error getting transaction field: {}.{}", parts.length > 0 ? parts[0] : "?", 
                    parts.length > 1 ? parts[1] : "?", e);
        }

        return "";
    }


    /**
     * Lấy giá trị của một field đơn giản từ object bằng reflection
     * Hỗ trợ snake_case (từ placeholder) → camelCase (Java field)
     */
    private String getSimpleFieldValue(Object obj, String fieldName) {
        if (obj == null || fieldName == null) {
            return "";
        }

        try {
            Object value = getFieldValueByName(obj, fieldName);
            
            if (value == null) {
                return "";
            }

            // Xử lý các loại dữ liệu đặc biệt
            if (value instanceof java.time.LocalDate) {
                return ((java.time.LocalDate) value).format(dateFormatter);
            } else if (value instanceof java.time.LocalDateTime) {
                return ((java.time.LocalDateTime) value).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            } else if (value instanceof BigDecimal) {
                return ((BigDecimal) value).stripTrailingZeros().toPlainString();
            } else if (value instanceof Enum) {
                return ((Enum<?>) value).name();
            }

            return value.toString();
        } catch (Exception e) {
            log.debug("Field not found or error accessing: {}", fieldName);
            return "";
        }
    }


    /**
     * Lấy field value từ object (cho nested access)
     * Hỗ trợ snake_case (từ placeholder) → camelCase (Java field)
     */
    private Object getFieldValue(Object obj, String fieldName) {
        if (obj == null || fieldName == null) {
            return null;
        }

        try {
            return getFieldValueByName(obj, fieldName);
        } catch (Exception e) {
            log.debug("Field not found or error accessing: {}", fieldName);
            return null;
        }
    }

    /**
     * Lấy field từ object, thử cả snake_case và camelCase
     * Ví dụ: "full_name" → thử "full_name" rồi thử "fullName"
     */
    private Object getFieldValueByName(Object obj, String fieldName) throws IllegalAccessException, NoSuchFieldException {
        if (obj == null || fieldName == null) {
            return null;
        }

        java.lang.reflect.Field field = null;
        
        // Thử 1: Dùng field name như trong placeholder (có thể đã là camelCase)
        try {
            field = obj.getClass().getDeclaredField(fieldName);
        } catch (NoSuchFieldException e1) {
            // Thử 2: Convert snake_case → camelCase
            String camelCaseFieldName = snakeToCamelCase(fieldName);
            try {
                field = obj.getClass().getDeclaredField(camelCaseFieldName);
            } catch (NoSuchFieldException e2) {
                // Thử 3: Thử cách khác - nếu placeholder là camelCase, chuyển thành snake_case
                String snakeCaseFieldName = camelToSnakeCase(fieldName);
                field = obj.getClass().getDeclaredField(snakeCaseFieldName);
            }
        }
        
        field.setAccessible(true);
        return field.get(obj);
    }

    /**
     * Thay thế placeholders ngày/tháng/năm từ transaction.createdAt
     */
    private void replaceDatePlaceholders(XWPFDocument document, TransactionReport transaction) {
        if (transaction.getCreatedAt() == null) {
            return;
        }

        LocalDateTime createdAt = transaction.getCreatedAt();
        String day = String.valueOf(createdAt.getDayOfMonth());
        String month = String.valueOf(createdAt.getMonthValue());
        String year = String.valueOf(createdAt.getYear());

        // Thay thế trong paragraphs
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            for (XWPFRun run : paragraph.getRuns()) {
                String text = run.getText(0);
                if (text != null) {
                    text = text.replace("{{day}}", day);
                    text = text.replace("{{month}}", month);
                    text = text.replace("{{year}}", year);
                    run.setText(text, 0);
                }
            }
        }

        // Thay thế trong tables
        for (XWPFTable table : document.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph paragraph : cell.getParagraphs()) {
                        for (XWPFRun run : paragraph.getRuns()) {
                            String text = run.getText(0);
                            if (text != null) {
                                text = text.replace("{{day}}", day);
                                text = text.replace("{{month}}", month);
                                text = text.replace("{{year}}", year);
                                run.setText(text, 0);
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * Upload file Word lên MinIO
     *
     * @param outputStream ByteArrayOutputStream chứa file Word
     * @param fileName     Tên file
     * @return Object name trên MinIO
     */
    public String uploadToMinio(ByteArrayOutputStream outputStream, String fileName) throws Exception {
        return minioService.uploadWordFile(outputStream, fileName);
    }

    /**
     * Lấy URL download từ MinIO
     */
    public String getDownloadUrl(String objectName) throws Exception {
        return minioService.getPresignedUrl(objectName);
    }

    /**
     * Chuyển snake_case thành camelCase
     * Ví dụ: "full_name" → "fullName", "birth_date" → "birthDate"
     */
    private String snakeToCamelCase(String snakeCase) {
        if (snakeCase == null || snakeCase.isEmpty()) {
            return snakeCase;
        }

        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = false;

        for (int i = 0; i < snakeCase.length(); i++) {
            char c = snakeCase.charAt(i);
            if (c == '_') {
                capitalizeNext = true;
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(c);
            }
        }

        return result.toString();
    }

    /**
     * Chuyển camelCase thành snake_case
     * Ví dụ: "fullName" → "full_name", "birthDate" → "birth_date"
     */
    private String camelToSnakeCase(String camelCase) {
        if (camelCase == null || camelCase.isEmpty()) {
            return camelCase;
        }

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < camelCase.length(); i++) {
            char c = camelCase.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) {
                    result.append('_');
                }
                result.append(Character.toLowerCase(c));
            } else {
                result.append(c);
            }
        }

        return result.toString();
    }
    /**
     * Lấy text từ cell
     */
    private String getCellText(XWPFTableCell cell) {
        StringBuilder text = new StringBuilder();
        for (XWPFParagraph paragraph : cell.getParagraphs()) {
            text.append(paragraph.getText());
        }
        return text.toString();
    }
    /**
     * Copy style từ template row sang new row
     */
    private void copyRowStyle(XWPFTableRow templateRow, XWPFTableRow newRow) {
        // Copy các cell từ template (để giữ style)
        for (int i = 0; i < templateRow.getTableCells().size(); i++) {
            XWPFTableCell templateCell = templateRow.getCell(i);
            XWPFTableCell newCell = newRow.getCell(i);

            if (newCell == null) {
                newCell = newRow.createCell();
            }

            // Copy cell properties (borders, background, etc.)
            if (templateCell.getCTTc() != null && newCell.getCTTc() != null) {
                newCell.getCTTc().setTcPr(templateCell.getCTTc().getTcPr());
            }
        }
    }

    /**
     * Set text cho cell
     */
    private void setCellText(XWPFTableCell cell, String text) {
        // Xóa tất cả paragraphs cũ
        while (cell.getParagraphs().size() > 0) {
            cell.removeParagraph(0);
        }

        // Tạo paragraph mới
        XWPFParagraph paragraph = cell.addParagraph();
        XWPFRun run = paragraph.createRun();
        run.setText(text != null ? text : "");
    }

    /**
     * Format tiền tệ
     */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return currencyFormatter.format(amount);
    }
    /**
     * Chuyển số tiền thành chữ tiếng Việt
     * Ví dụ: 1020123 -> "Một triệu không trăm hai mươi nghìn một trăm hai mươi ba"
     */
    private String convertNumberToVietnameseWords(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return "Không đồng";
        }

        // Làm tròn đến đơn vị (bỏ phần thập phân nếu có)
        long number = amount.longValue();

        if (number == 0) {
            return "Không đồng";
        }

        String result = convertNumberToWords(number);

        // Viết hoa chữ cái đầu và thêm "đồng" ở cuối
        return result.substring(0, 1).toUpperCase() + result.substring(1) + " đồng";
    }

    /**
     * Chuyển số thành chữ (phần core)
     */
    private String convertNumberToWords(long number) {
        if (number == 0) {
            return "không";
        }

        if (number < 0) {
            return "âm " + convertNumberToWords(-number);
        }

        String[] units = {"", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"};
        String[] tens = {"", "mười", "hai mươi", "ba mươi", "bốn mươi", "năm mươi",
                "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"};

        if (number < 10) {
            return units[(int) number];
        }

        if (number < 20) {
            return "mười " + (number == 10 ? "" : units[(int) (number % 10)]);
        }

        if (number < 100) {
            int unitDigit = (int) (number % 10);
            int tenDigit = (int) (number / 10);

            if (unitDigit == 0) {
                return tens[tenDigit];
            } else if (unitDigit == 1 && tenDigit >= 2) {
                return tens[tenDigit] + " mốt";
            } else if (unitDigit == 5 && tenDigit >= 1) {
                return tens[tenDigit] + " lăm";
            } else {
                return tens[tenDigit] + " " + units[unitDigit];
            }
        }

        if (number < 1000) {
            int hundred = (int) (number / 100);
            int remainder = (int) (number % 100);

            String result = units[hundred] + " trăm";

            if (remainder == 0) {
                return result;
            } else if (remainder < 10) {
                return result + " lẻ " + units[remainder];
            } else {
                return result + " " + convertNumberToWords(remainder);
            }
        }

        if (number < 1000000) {
            int thousand = (int) (number / 1000);
            int remainder = (int) (number % 1000);

            String result = convertNumberToWords(thousand) + " nghìn";

            if (remainder == 0) {
                return result;
            } else if (remainder < 10) {
                return result + " lẻ " + units[remainder];
            } else if (remainder < 100) {
                return result + " không trăm " + convertNumberToWords(remainder);
            } else {
                return result + " " + convertNumberToWords(remainder);
            }
        }

        if (number < 1000000000) {
            int million = (int) (number / 1000000);
            int remainder = (int) (number % 1000000);

            String result = convertNumberToWords(million) + " triệu";

            if (remainder == 0) {
                return result;
            } else if (remainder < 10) {
                return result + " lẻ " + units[remainder];
            } else if (remainder < 100) {
                return result + " không trăm " + convertNumberToWords(remainder);
            } else if (remainder < 1000) {
                return result + " không nghìn " + convertNumberToWords(remainder);
            } else {
                return result + " " + convertNumberToWords(remainder);
            }
        }

        if (number < 1000000000000L) {
            long billion = number / 1000000000;
            long remainder = number % 1000000000;

            String result = convertNumberToWords(billion) + " tỷ";

            if (remainder == 0) {
                return result;
            } else if (remainder < 10) {
                return result + " lẻ " + units[(int) remainder];
            } else if (remainder < 100) {
                return result + " không trăm " + convertNumberToWords(remainder);
            } else if (remainder < 1000) {
                return result + " không nghìn " + convertNumberToWords(remainder);
            } else if (remainder < 1000000) {
                return result + " không triệu " + convertNumberToWords(remainder);
            } else {
                return result + " " + convertNumberToWords(remainder);
            }
        }

        return "Số quá lớn";
    }
}
