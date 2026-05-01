package com.ecotel.transaction_service.service;

import com.ecotel.transaction_service.dto.response.ReportDetail;
import com.ecotel.transaction_service.dto.response.TransactionReport;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.apache.xmlbeans.XmlException;
import java.util.regex.Pattern;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTP;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTRow;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTcPr;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;

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
     * Tạo file Word từ template, điền dữ liệu từ TransactionReport
     */
    public ByteArrayOutputStream generateTransactionReport(
            TransactionReport transaction,
            String templateFileName) throws IOException, XmlException {

        log.info("Generating report for transaction id: {}", transaction.getId());

        Resource resource = new ClassPathResource(templatePath + templateFileName);

        try (InputStream is = resource.getInputStream();
             XWPFDocument document = new XWPFDocument(is)) {

            // Bước 1: Thay thế placeholders trong tất cả paragraphs thường
            processAllParagraphs(document, transaction);

            // Bước 2: Xử lý tất cả tables
            processAllTables(document, transaction);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);

            log.info("Report generated successfully for transaction: {}", transaction.getId());
            return outputStream;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Upload file Word lên MinIO
     */
    public String uploadToMinio(ByteArrayOutputStream outputStream, String fileName) throws Exception {
        return minioService.uploadWordFile(outputStream, fileName);
    }

    /**
     * Lấy presigned URL download từ MinIO
     */
    public String getDownloadUrl(String objectName) throws Exception {
        return minioService.getPresignedUrl(objectName);
    }

    // =========================================================================
    // STEP 1 — XỬ LÝ PARAGRAPHS THƯỜNG (ngoài table)
    // =========================================================================

    /**
     * Duyệt tất cả paragraphs trong document (không bao gồm bên trong table)
     * và thay thế mọi placeholder {{...}}
     */
    private void processAllParagraphs(XWPFDocument document, TransactionReport transaction) {
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            replacePlaceholdersInParagraph(paragraph, transaction);
        }
    }

    /**
     * Thay thế tất cả placeholders trong một paragraph.
     *
     * Vấn đề quan trọng của Apache POI: Word có thể split một placeholder
     * thành nhiều XWPFRun khác nhau, ví dụ:
     *   Run 0: "{{transaction."
     *   Run 1: "warehouse"
     *   Run 2: "Name}}"
     *
     * Giải pháp: gộp text của tất cả runs, thay thế, rồi ghi lại vào run đầu tiên
     * và xóa các run còn lại.
     */
    private void replacePlaceholdersInParagraph(XWPFParagraph paragraph, TransactionReport transaction) {
        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) {
            return;
        }

        // Gộp toàn bộ text của paragraph
        StringBuilder fullText = new StringBuilder();
        for (XWPFRun run : runs) {
            String t = run.getText(0);
            fullText.append(t != null ? t : "");
        }

        String combined = fullText.toString();

        // Chỉ xử lý nếu có placeholder
        if (!combined.contains("{{")) {
            return;
        }

        // Thay thế tất cả placeholders
        String replaced = resolvePlaceholders(combined, transaction);

        // Ghi kết quả vào run đầu tiên, xóa nội dung các run còn lại
        runs.get(0).setText(replaced, 0);
        for (int i = 1; i < runs.size(); i++) {
            runs.get(i).setText("", 0);
        }
    }

    // =========================================================================
    // STEP 2 — XỬ LÝ TẤT CẢ TABLES
    // =========================================================================

    /**
     * Duyệt tất cả tables trong document:
     * - Nếu là "product details table" → populate dữ liệu từ transaction.details
     * - Nếu là table thông thường → chỉ thay thế placeholders
     */
    private void processAllTables(XWPFDocument document, TransactionReport transaction)
            throws Exception {

        for (XWPFTable table : document.getTables()) {
            if (isProductDetailsTable(table)) {
                log.debug("Found product details table, populating...");
                populateProductDetailsTable(table, transaction);
            } else {
                log.debug("Found regular table, replacing placeholders...");
                replaceTablePlaceholders(table, transaction);
            }
        }
    }

    /**
     * Thay thế placeholders trong table thông thường (không phải bảng sản phẩm)
     */
    private void replaceTablePlaceholders(XWPFTable table, TransactionReport transaction) {
        for (XWPFTableRow row : table.getRows()) {
            for (XWPFTableCell cell : row.getTableCells()) {
                for (XWPFParagraph paragraph : cell.getParagraphs()) {
                    replacePlaceholdersInParagraph(paragraph, transaction);
                }
            }
        }
    }

    // =========================================================================
    // PRODUCT DETAILS TABLE — DETECTION
    // =========================================================================

    /**
     * Nhận biết "bảng sản phẩm" bằng cách tìm placeholder {{transaction.details.*}}
     * hoặc {{details.*}} hoặc {{stt}} trong BẤT KỲ row nào của table.
     *
     * Lý do không chỉ check row index 1: template của bạn có 3 header rows
     * (Row 0, Row 1, Row 2) và template row thực sự ở Row 3.
     */
    private boolean isProductDetailsTable(XWPFTable table) {
        for (XWPFTableRow row : table.getRows()) {
            for (XWPFTableCell cell : row.getTableCells()) {
                String text = getCellFullText(cell);
                if (text.contains("{{transaction.details.")
                        || text.contains("{{details.")
                        || text.equals("{{stt}}")) {
                    return true;
                }
            }
        }
        return false;
    }

    // =========================================================================
    // PRODUCT DETAILS TABLE — POPULATE
    // =========================================================================

    /**
     * Populate bảng sản phẩm:
     * 1. Tìm template row (row chứa {{transaction.details.*}})
     * 2. Tìm total row (row chứa "Cộng" hoặc {{grandTotal}})
     * 3. Clone template row thành N bản (N = số lượng details)
     * 4. Điền dữ liệu vào từng bản clone
     * 5. Cập nhật grandTotal và grandTotalInText
     */
    private void populateProductDetailsTable(XWPFTable table, TransactionReport transaction)
            throws Exception {

        if (transaction.getDetails() == null || transaction.getDetails().isEmpty()) {
            log.warn("No details found for transaction: {}", transaction.getId());
            return;
        }

        int templateRowIndex = findTemplateRowIndex(table);
        if (templateRowIndex < 0) {
            log.error("Cannot find template row in product details table");
            return;
        }

        XWPFTableRow templateRow = table.getRow(templateRowIndex);

        // --- Tìm total row index (trước khi xóa bất kỳ row nào) ---
        int totalRowIndex = findTotalRowIndex(table);

        List<CellInfo> cellInfos = readCellPlaceholders(templateRow);

        // Clone XML template row để dùng sau
        CTRow templateCtRowCopy = CTRow.Factory.parse(templateRow.getCtRow().newInputStream());
        XWPFTableRow safeTemplateRow = new XWPFTableRow(templateCtRowCopy, table);

        // ✅ FIX 1: Xóa tất cả các "empty data rows" nằm giữa template row và total row
        // Template row + các empty rows phía sau đều phải bị xóa
        // Xác định số row cần xóa: từ templateRowIndex đến (totalRowIndex - 1)
        int rowsToDelete = (totalRowIndex > templateRowIndex)
                ? totalRowIndex - templateRowIndex   // xóa template row + tất cả empty rows
                : 1;                                  // chỉ xóa template row

        for (int i = 0; i < rowsToDelete; i++) {
            table.removeRow(templateRowIndex); // luôn xóa tại cùng index vì list dịch lên
        }

        // Cập nhật lại totalRowIndex sau khi đã xóa các rows
        int adjustedTotalRowIndex = totalRowIndex - rowsToDelete;
        int insertAt = templateRowIndex;

        // --- Điền dữ liệu ---
        BigDecimal grandTotal = BigDecimal.ZERO;
        List<ReportDetail> details = transaction.getDetails();

        for (int i = 0; i < details.size(); i++) {
            ReportDetail detail = details.get(i);
            int stt = i + 1;

            BigDecimal totalPrice = calcTotalPrice(detail);
            grandTotal = grandTotal.add(totalPrice);

            // ✅ THAY bằng
            XWPFTableRow newRow = insertClonedRow(table, insertAt + i, safeTemplateRow.getCtRow());

            for (CellInfo cellInfo : cellInfos) {
                String value = resolveDetailPlaceholder(cellInfo.placeholder, detail, stt, totalPrice, transaction);
                setCellValue(newRow.getCell(cellInfo.cellIndex), value, safeTemplateRow.getCell(cellInfo.cellIndex));
            }
        }

        // Điều chỉnh totalRowIndex sau khi thêm các data rows
        int finalTotalRowIndex = adjustedTotalRowIndex + details.size();

        // ✅ FIX 2: Cập nhật grandTotal — tìm trong tất cả rows từ finalTotalRowIndex trở đi
        // vì "Cộng" và "{{grandTotal}}" có thể ở 2 rows khác nhau
        updateAllTotalRows(table, grandTotal, finalTotalRowIndex);
    }
    /**
     * Insert một row đã clone vào đúng vị trí trong table.
     *
     * VẤN ĐỀ với insertNewTableRow() + getCtRow().set():
     *   Apache POI tạo XWPFTableRow với CTRow rỗng, track cells trong internal _cells list.
     *   Sau khi .set() thay XML, _cells vẫn rỗng → getTableCells() trả về [] → createCell()
     *   tạo thêm N cell mới → CTRow có 2N cells (N clone + N mới) → setCellValue() điền
     *   vào N cell mới (cuối), trong khi N cell clone đầu vẫn còn placeholder.
     *
     * GIẢI PHÁP: Insert CTRow clone trực tiếp vào CTTbl XML, sau đó dùng reflection
     * để thêm XWPFTableRow tương ứng vào _rows list của XWPFTable.
     * XWPFTableRow constructor đọc cells từ CTRow ngay lúc khởi tạo → cells đúng ngay.
     */
    private XWPFTableRow insertClonedRow(XWPFTable table, int pos, CTRow sourceCtRow)
            throws Exception {

        // Bước 1: Clone CTRow XML
        CTRow clonedCtRow = CTRow.Factory.parse(sourceCtRow.newInputStream());

        // Bước 2: Insert CTRow clone vào CTTbl XML tại đúng vị trí
        // getCTTbl().insertNewTr(pos) tạo row rỗng rồi trả về tham chiếu đó
        // Ta dùng nó như một "slot" rồi set nội dung vào
        org.openxmlformats.schemas.wordprocessingml.x2006.main.CTTbl ctTbl = table.getCTTbl();
        CTRow newCtRowInXml = ctTbl.insertNewTr(pos);
        newCtRowInXml.set(clonedCtRow);

        // Bước 3: Tạo XWPFTableRow từ CTRow đã có đầy đủ cells trong XML
        // Constructor này đọc tất cả <w:tc> từ CTRow → _cells được populate đúng
        XWPFTableRow newRow = new XWPFTableRow(newCtRowInXml, table);

        // Bước 4: Dùng reflection để insert vào _rows list của XWPFTable
        // (XWPFTable không có public addRow/insertRow nhận XWPFTableRow)
        java.lang.reflect.Field rowsField = XWPFTable.class.getDeclaredField("tableRows");
        rowsField.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<XWPFTableRow> rows = (List<XWPFTableRow>) rowsField.get(table);
        rows.add(pos, newRow);

        return newRow;
    }

    /**
     * Tìm index của template row: row đầu tiên chứa placeholder {{transaction.details.*}}
     */
    private int findTemplateRowIndex(XWPFTable table) {
        List<XWPFTableRow> rows = table.getRows();
        for (int i = 0; i < rows.size(); i++) {
            for (XWPFTableCell cell : rows.get(i).getTableCells()) {
                String text = getCellFullText(cell);
                if (text.contains("{{transaction.details.")
                        || text.contains("{{details.")
                        || "{{stt}}".equals(text.trim())) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Tìm index của total row: row chứa "Cộng" hoặc {{grandTotal}}
     */
    private int findTotalRowIndex(XWPFTable table) {
        List<XWPFTableRow> rows = table.getRows();
        for (int i = 0; i < rows.size(); i++) {
            for (XWPFTableCell cell : rows.get(i).getTableCells()) {
                String text = getCellFullText(cell);
                if (text.contains("{{grandTotal}}") || text.trim().equals("Cộng")) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Đọc danh sách (cellIndex → placeholder) từ template row
     */
    private List<CellInfo> readCellPlaceholders(XWPFTableRow templateRow) {
        List<CellInfo> result = new ArrayList<>();
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");

        List<XWPFTableCell> cells = templateRow.getTableCells();
        for (int i = 0; i < cells.size(); i++) {
            String cellText = getCellFullText(cells.get(i));
            Matcher matcher = pattern.matcher(cellText);
            if (matcher.find()) {
                result.add(new CellInfo(i, matcher.group(1).trim(), cellText));
            } else {
                // Cell không có placeholder (ví dụ cell trống) — vẫn ghi nhận để giữ thứ tự
                result.add(new CellInfo(i, null, cellText));
            }
        }
        return result;
    }

    /**
     * Cập nhật giá trị grandTotal vào total row
     */
    private void updateAllTotalRows(XWPFTable table, BigDecimal grandTotal, int startIndex) {
        List<XWPFTableRow> rows = table.getRows();
        for (int i = startIndex; i < rows.size(); i++) {
            for (XWPFTableCell cell : rows.get(i).getTableCells()) {
                String text = getCellFullText(cell);
                if (text.contains("{{grandTotal}}")) {
                    setCellValue(cell, formatCurrency(grandTotal), null);
                    return; // tìm thấy rồi thì dừng
                }
            }
        }
    }

    // =========================================================================
    // PLACEHOLDER RESOLUTION — GENERAL
    // =========================================================================

    /**
     * Thay thế tất cả {{...}} trong một chuỗi text bằng giá trị thực từ transaction
     */
    private String resolvePlaceholders(String text, TransactionReport transaction) {
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");
        Matcher matcher = pattern.matcher(text);

        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            String value = getPlaceholderValue(placeholder, transaction);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * Lấy giá trị cho một placeholder từ transaction.
     * Hỗ trợ:
     *   {{day}}, {{month}}, {{year}}      → từ transaction.createdAt
     *   {{grandTotalInText}}              → tổng tiền viết bằng chữ
     *   {{grandTotal}}                    → tổng tiền định dạng tiền tệ
     *   {{transaction.field}}             → field trực tiếp của TransactionReport
     *   {{transaction.obj.field}}         → nested field
     *   {{field}}                         → shorthand cho transaction.field
     */
    private String getPlaceholderValue(String placeholder, TransactionReport transaction) {
        if (placeholder == null || placeholder.isEmpty()) {
            return "";
        }

        // --- Ngày tháng từ createdAt ---
        if ("day".equals(placeholder)) {
            return transaction.getCreatedAt() != null
                    ? String.valueOf(transaction.getCreatedAt().getDayOfMonth()) : "";
        }
        if ("month".equals(placeholder)) {
            return transaction.getCreatedAt() != null
                    ? String.valueOf(transaction.getCreatedAt().getMonthValue()) : "";
        }
        if ("year".equals(placeholder)) {
            return transaction.getCreatedAt() != null
                    ? String.valueOf(transaction.getCreatedAt().getYear()) : "";
        }

        // --- Tổng tiền viết bằng chữ ---
        if ("grandTotalInText".equals(placeholder)) {
            return convertNumberToVietnameseWords(calculateGrandTotal(transaction));
        }

        // --- Tổng tiền số ---
        if ("grandTotal".equals(placeholder)) {
            return formatCurrency(calculateGrandTotal(transaction));
        }

        // --- transaction.field hoặc transaction.obj.field ---
        if (placeholder.startsWith("transaction.")) {
            return resolveTransactionField(placeholder.substring("transaction.".length()), transaction);
        }

        // --- Shorthand: field (không có prefix) ---
        return resolveTransactionField(placeholder, transaction);
    }

    /**
     * Resolve field path từ TransactionReport (hỗ trợ 1 hoặc 2 cấp)
     * Ví dụ: "warehouseName", "status", "someObject.field"
     */
    private String resolveTransactionField(String fieldPath, TransactionReport transaction) {
        if (transaction == null || fieldPath == null || fieldPath.isEmpty()) {
            return "";
        }

        String[] parts = fieldPath.split("\\.", 2);
        try {
            if (parts.length == 1) {
                // Direct field
                return formatFieldValue(getFieldByReflection(transaction, parts[0]));
            } else {
                // Nested: obj.field
                Object nested = getFieldByReflection(transaction, parts[0]);
                if (nested != null) {
                    return formatFieldValue(getFieldByReflection(nested, parts[1]));
                }
            }
        } catch (Exception e) {
            log.debug("Cannot resolve field '{}': {}", fieldPath, e.getMessage());
        }
        return "";
    }

    // =========================================================================
    // PLACEHOLDER RESOLUTION — DETAIL ROW
    // =========================================================================

    /**
     * Resolve placeholder cho một hàng trong bảng sản phẩm.
     * Hỗ trợ:
     *   {{stt}}                                  → số thứ tự
     *   {{transaction.details.totalPrice}}        → thành tiền (tính toán)
     *   {{transaction.details.fieldName}}         → field của ReportDetail
     *   {{details.fieldName}}                     → shorthand
     */
    private String resolveDetailPlaceholder(
            String placeholder,
            ReportDetail detail,
            int stt,
            BigDecimal totalPrice,
            TransactionReport transaction) {

        if (placeholder == null) {
            return "";
        }

        // STT
        if ("stt".equals(placeholder)) {
            return String.valueOf(stt);
        }

        // Thành tiền (computed field, không có trong ReportDetail)
        if ("transaction.details.totalPrice".equals(placeholder)
                || "details.totalPrice".equals(placeholder)) {
            return formatCurrency(totalPrice);
        }

        // transaction.details.fieldName
        if (placeholder.startsWith("transaction.details.")) {
            String fieldName = placeholder.substring("transaction.details.".length());
            return getDetailFieldValue(detail, fieldName);
        }

        // details.fieldName
        if (placeholder.startsWith("details.")) {
            String fieldName = placeholder.substring("details.".length());
            return getDetailFieldValue(detail, fieldName);
        }

        // Fallback: field của transaction
        if (placeholder.startsWith("transaction.")) {
            return resolveTransactionField(placeholder.substring("transaction.".length()), transaction);
        }

        log.debug("Unresolved placeholder for detail row: '{}'", placeholder);
        return "";
    }

    /**
     * Lấy và format giá trị field từ ReportDetail theo tên field
     */
    private String getDetailFieldValue(ReportDetail detail, String fieldName) {
        if (detail == null || fieldName == null) {
            return "";
        }
        try {
            Object value = getFieldByReflection(detail, fieldName);
            if (value == null) {
                return "";
            }
            if (value instanceof BigDecimal) {
                BigDecimal bd = (BigDecimal) value;
                // Price → format tiền tệ
                if (fieldName.toLowerCase().contains("price")) {
                    return formatCurrency(bd);
                }
                // Quantity → bỏ số 0 thừa ở cuối
                return bd.stripTrailingZeros().toPlainString();
            }
            return value.toString();
        } catch (Exception e) {
            log.debug("Cannot get detail field '{}': {}", fieldName, e.getMessage());
            return "";
        }
    }

    // =========================================================================
    // REFLECTION UTILITIES
    // =========================================================================

    /**
     * Lấy giá trị field từ object bằng reflection.
     * Thử theo thứ tự: tên gốc → camelCase → snake_case → tìm trong superclass
     */
    private Object getFieldByReflection(Object obj, String fieldName) throws Exception {
        if (obj == null || fieldName == null) {
            return null;
        }

        java.lang.reflect.Field field = findField(obj.getClass(), fieldName);
        field.setAccessible(true);
        return field.get(obj);
    }

    /**
     * Tìm field trong class (và superclass), thử nhiều variant tên
     */
    private java.lang.reflect.Field findField(Class<?> clazz, String fieldName) throws NoSuchFieldException {
        // Thử các variant của tên field
        String[] candidates = {
                fieldName,
                snakeToCamel(fieldName),
                camelToSnake(fieldName)
        };

        for (String candidate : candidates) {
            Class<?> c = clazz;
            while (c != null && c != Object.class) {
                try {
                    return c.getDeclaredField(candidate);
                } catch (NoSuchFieldException e) {
                    c = c.getSuperclass();
                }
            }
        }

        throw new NoSuchFieldException(
                "Field '" + fieldName + "' not found in " + clazz.getSimpleName());
    }

    // =========================================================================
    // CELL UTILITIES
    // =========================================================================

    /**
     * Lấy toàn bộ text của một cell (gộp từ tất cả paragraphs và runs)
     */
    private String getCellFullText(XWPFTableCell cell) {
        StringBuilder sb = new StringBuilder();
        for (XWPFParagraph paragraph : cell.getParagraphs()) {
            for (XWPFRun run : paragraph.getRuns()) {
                String t = run.getText(0);
                if (t != null) sb.append(t);
            }
        }
        return sb.toString();
    }

    /**
     * Ghi giá trị vào cell:
     * - Nếu có templateCell → copy formatting (font, bold, alignment, border) trước, rồi set text
     * - Nếu không có → set text vào run đầu tiên của paragraph đầu tiên
     */
    private void setCellValue(XWPFTableCell cell, String value, XWPFTableCell templateCell) {
        if (value == null) value = "";

        // Copy cell-level properties
        if (templateCell != null
                && templateCell.getCTTc() != null
                && templateCell.getCTTc().getTcPr() != null) {
            cell.getCTTc().setTcPr(
                    (CTTcPr) templateCell.getCTTc().getTcPr().copy()
            );
        }

        XWPFParagraph paragraph;
        if (cell.getParagraphs().isEmpty()) {
            paragraph = cell.addParagraph();
        } else {
            paragraph = cell.getParagraphs().get(0);
        }

        // Copy paragraph alignment từ template
        if (templateCell != null && !templateCell.getParagraphs().isEmpty()) {
            XWPFParagraph templatePara = templateCell.getParagraphs().get(0);
            if (templatePara.getAlignment() != null) {
                paragraph.setAlignment(templatePara.getAlignment());
            }
        }

        // Đọc run formatting từ template TRƯỚC khi xóa
        String fontFamily = null;
        int fontSize = -1;
        boolean bold = false;
        boolean italic = false;
        if (templateCell != null && !templateCell.getParagraphs().isEmpty()) {
            List<XWPFRun> templateRuns = templateCell.getParagraphs().get(0).getRuns();
            if (!templateRuns.isEmpty()) {
                XWPFRun tr = templateRuns.get(0);
                fontFamily = tr.getFontFamily();
                fontSize = tr.getFontSize();
                bold = tr.isBold();
                italic = tr.isItalic();
            }
        }

        // ✅ Xóa tất cả <w:r> trực tiếp từ XML của CTPPr (không chỉ Java object list)
        CTP ctp = paragraph.getCTP();
        // Xóa toàn bộ run elements từ XML
        for (int i = ctp.sizeOfRArray() - 1; i >= 0; i--) {
            ctp.removeR(i);
        }

        // Tạo run mới
        XWPFRun run = paragraph.createRun();
        run.setText(value);
        if (fontFamily != null) run.setFontFamily(fontFamily);
        if (fontSize > 0) run.setFontSize(fontSize);
        run.setBold(bold);
        run.setItalic(italic);
    }

    // =========================================================================
    // GRAND TOTAL
    // =========================================================================

    /**
     * Tính tổng thành tiền = SUM(price * actualQuantity) từ tất cả details
     */
    private BigDecimal calculateGrandTotal(TransactionReport transaction) {
        if (transaction.getDetails() == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal total = BigDecimal.ZERO;
        for (ReportDetail detail : transaction.getDetails()) {
            total = total.add(calcTotalPrice(detail));
        }
        return total;
    }

    /**
     * Tính thành tiền cho 1 detail = price * actualQuantity
     */
    private BigDecimal calcTotalPrice(ReportDetail detail) {
        if (detail.getPrice() != null && detail.getActualQuantity() != null) {
            return detail.getPrice().multiply(detail.getActualQuantity());
        }
        return BigDecimal.ZERO;
    }

    // =========================================================================
    // FORMATTING UTILITIES
    // =========================================================================

    /**
     * Format giá trị field sang String, xử lý các kiểu đặc biệt
     */
    private String formatFieldValue(Object value) {
        if (value == null) return "";
        if (value instanceof java.time.LocalDate) {
            return ((java.time.LocalDate) value).format(dateFormatter);
        }
        if (value instanceof LocalDateTime) {
            return ((LocalDateTime) value).format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        }
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).stripTrailingZeros().toPlainString();
        }
        if (value instanceof Enum) {
            return ((Enum<?>) value).name();
        }
        return value.toString();
    }

    /**
     * Format số tiền theo định dạng Việt Nam
     */
    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0";
        return currencyFormatter.format(amount);
    }

    // =========================================================================
    // SỐ TIỀN VIẾT BẰNG CHỮ TIẾNG VIỆT
    // =========================================================================

    /**
     * Chuyển số tiền thành chữ tiếng Việt
     * Ví dụ: 1_020_123 → "Một triệu không trăm hai mươi nghìn một trăm hai mươi ba đồng"
     */
    private String convertNumberToVietnameseWords(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return "Không đồng";
        }
        long number = amount.longValue();
        if (number == 0) return "Không đồng";

        String words = numberToWords(number);
        return Character.toUpperCase(words.charAt(0)) + words.substring(1) + " đồng";
    }

    private String numberToWords(long number) {
        if (number == 0) return "không";
        if (number < 0) return "âm " + numberToWords(-number);

        String[] UNITS = {"", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"};
        String[] TENS = {"", "mười", "hai mươi", "ba mươi", "bốn mươi",
                "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"};

        if (number < 10) return UNITS[(int) number];

        if (number < 20) {
            int unit = (int) (number % 10);
            return "mười" + (unit == 0 ? "" : " " + UNITS[unit]);
        }

        if (number < 100) {
            int unit = (int) (number % 10);
            int ten = (int) (number / 10);
            if (unit == 0) return TENS[ten];
            if (unit == 1) return TENS[ten] + " mốt";
            if (unit == 5) return TENS[ten] + " lăm";
            return TENS[ten] + " " + UNITS[unit];
        }

        if (number < 1_000) {
            int hundred = (int) (number / 100);
            int remainder = (int) (number % 100);
            String result = UNITS[hundred] + " trăm";
            if (remainder == 0) return result;
            if (remainder < 10) return result + " lẻ " + UNITS[remainder];
            return result + " " + numberToWords(remainder);
        }

        if (number < 1_000_000) {
            long thousand = number / 1_000;
            long remainder = number % 1_000;
            String result = numberToWords(thousand) + " nghìn";
            if (remainder == 0) return result;
            if (remainder < 10) return result + " lẻ " + UNITS[(int) remainder];
            if (remainder < 100) return result + " không trăm " + numberToWords(remainder);
            return result + " " + numberToWords(remainder);
        }

        if (number < 1_000_000_000) {
            long million = number / 1_000_000;
            long remainder = number % 1_000_000;
            String result = numberToWords(million) + " triệu";
            if (remainder == 0) return result;
            if (remainder < 10) return result + " lẻ " + UNITS[(int) remainder];
            if (remainder < 100) return result + " không trăm " + numberToWords(remainder);
            if (remainder < 1_000) return result + " không nghìn " + numberToWords(remainder);
            return result + " " + numberToWords(remainder);
        }

        if (number < 1_000_000_000_000L) {
            long billion = number / 1_000_000_000;
            long remainder = number % 1_000_000_000;
            String result = numberToWords(billion) + " tỷ";
            if (remainder == 0) return result;
            if (remainder < 10) return result + " lẻ " + UNITS[(int) remainder];
            if (remainder < 100) return result + " không trăm " + numberToWords(remainder);
            if (remainder < 1_000) return result + " không nghìn " + numberToWords(remainder);
            if (remainder < 1_000_000) return result + " không triệu " + numberToWords(remainder);
            return result + " " + numberToWords(remainder);
        }

        return "Số quá lớn";
    }

    // =========================================================================
    // STRING UTILITIES
    // =========================================================================

    /** "full_name" → "fullName" */
    private String snakeToCamel(String s) {
        if (s == null || !s.contains("_")) return s;
        StringBuilder sb = new StringBuilder();
        boolean cap = false;
        for (char c : s.toCharArray()) {
            if (c == '_') { cap = true; }
            else if (cap) { sb.append(Character.toUpperCase(c)); cap = false; }
            else { sb.append(c); }
        }
        return sb.toString();
    }

    /** "fullName" → "full_name" */
    private String camelToSnake(String s) {
        if (s == null) return null;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isUpperCase(c)) {
                if (i > 0) sb.append('_');
                sb.append(Character.toLowerCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    // =========================================================================
    // INNER CLASS
    // =========================================================================

    /** Lưu thông tin placeholder của một cell trong template row */
    private static class CellInfo {
        final int cellIndex;
        final String placeholder;   // null nếu cell không có placeholder
        final String originalText;

        CellInfo(int cellIndex, String placeholder, String originalText) {
            this.cellIndex = cellIndex;
            this.placeholder = placeholder;
            this.originalText = originalText;
        }

        @Override
        public String toString() {
            return "CellInfo{cell=" + cellIndex + ", placeholder='" + placeholder + "'}";
        }
    }
}
