package com.ecotel.quanlynhansu.service.word;

import com.ecotel.quanlynhansu.model.Employee;
import com.ecotel.quanlynhansu.model.RoutineHealthCheck;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class WordService {

    @Value("${app.template.path}")
    private String templatePath;

    @Value("${app.output.path}")
    private String outputPath;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final NumberFormat currencyFormatter = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));

    /**
     * Tạo file Word từ template với thông tin 1 nhân viên
     */
    public ByteArrayOutputStream generateEmployeeReport(Employee employee, RoutineHealthCheck routineHealthCheck, String templateFileName) throws IOException {
        log.info("Generating employee report for: {}", employee.getFullName());

        // Đọc file template
        Path templateFilePath = Paths.get(templatePath, templateFileName);

        try (FileInputStream fis = new FileInputStream(templateFilePath.toFile());
             XWPFDocument document = new XWPFDocument(fis)) {

            // Thay thế placeholders trong paragraphs
            replacePlaceholdersInParagraphs(document, employee, routineHealthCheck);

            // Thay thế placeholders trong tables
            replacePlaceholdersInTables(document, employee, routineHealthCheck);

            // Ghi ra ByteArrayOutputStream
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            document.write(outputStream);

            log.info("Employee report generated successfully");
            return outputStream;
        }
    }

    /**
     * Lưu file vào thư mục output
     */
    public String saveToFile(ByteArrayOutputStream outputStream, String fileName) throws IOException {
        Path outputDir = Paths.get(outputPath);

        // Tạo thư mục nếu chưa tồn tại
        if (!Files.exists(outputDir)) {
            Files.createDirectories(outputDir);
        }

        Path outputFile = outputDir.resolve(fileName);

        try (FileOutputStream fos = new FileOutputStream(outputFile.toFile())) {
            outputStream.writeTo(fos);
        }

        log.info("File saved to: {}", outputFile.toAbsolutePath());
        return outputFile.toAbsolutePath().toString();
    }

    /**
     * Thay thế placeholders trong paragraphs
     * Placeholders có dạng: {{field_name}} hoặc {{employee.field}} hoặc {{employee.relation.field}}
     */
    private void replacePlaceholdersInParagraphs(XWPFDocument document, Employee employee, RoutineHealthCheck routineHealthCheck) {
        for (XWPFParagraph paragraph : document.getParagraphs()) {
            for (XWPFRun run : paragraph.getRuns()) {
                String text = run.getText(0);
                if (text != null && text.contains("{{")) {
                    text = replacePlaceholders(text, employee, routineHealthCheck);
                    run.setText(text, 0);
                }
            }
        }
    }

    /**
     * Thay thế placeholders trong tables
     */
    private void replacePlaceholdersInTables(XWPFDocument document, Employee employee, RoutineHealthCheck routineHealthCheck) {
        for (XWPFTable table : document.getTables()) {
            for (XWPFTableRow row : table.getRows()) {
                for (XWPFTableCell cell : row.getTableCells()) {
                    for (XWPFParagraph paragraph : cell.getParagraphs()) {
                        for (XWPFRun run : paragraph.getRuns()) {
                            String text = run.getText(0);
                            if (text != null && text.contains("{{")) {
                                text = replacePlaceholders(text, employee, routineHealthCheck);
                                run.setText(text, 0);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Thay thế các placeholders với dữ liệu thực
     * Hỗ trợ: {{field}}, {{employee.field}}, {{employee.relation.field}}, {{routine_health_check.field}}
     */
    private String replacePlaceholders(String text, Employee employee, RoutineHealthCheck routineHealthCheck) {
        // Tìm tất cả placeholders
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}");
        java.util.regex.Matcher matcher = pattern.matcher(text);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String placeholder = matcher.group(1).trim();
            String value = getPlaceholderValue(placeholder, employee, routineHealthCheck);
            matcher.appendReplacement(result, java.util.regex.Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);
        
        return result.toString();
    }

    /**
     * Lấy giá trị của placeholder từ employee hoặc routineHealthCheck
     * Hỗ trợ nested objects: employee.position.name, employee.organization.name, etc.
     */
    private String getPlaceholderValue(String placeholder, Employee employee, RoutineHealthCheck routineHealthCheck) {
        if (placeholder == null || placeholder.isEmpty()) {
            return "";
        }

        // Xử lý routine_health_check placeholders
        if (placeholder.startsWith("routine_health_check.")) {
            return getRoutineHealthCheckValue(placeholder.substring(21), routineHealthCheck);
        }

        // Xử lý employee placeholders (bao gồm nested)
        if (placeholder.startsWith("employee.")) {
            return getEmployeeValue(placeholder.substring(9), employee);
        }

        // Xử lý user placeholders nếu có
        if (placeholder.startsWith("user.")) {
            return getUserValue(placeholder.substring(5));
        }

        return "";
    }

    /**
     * Lấy giá trị từ Employee entity (hỗ trợ nested objects)
     */
    private String getEmployeeValue(String fieldPath, Employee employee) {
        if (employee == null || fieldPath == null || fieldPath.isEmpty()) {
            return "";
        }

        String[] parts = fieldPath.split("\\.");
        
        try {
            if (parts.length == 1) {
                // Direct field: employee.full_name
                return getSimpleFieldValue(employee, parts[0]);
            } else if (parts.length == 2) {
                // Nested object: employee.position.position_name
                Object relatedObj = getFieldValue(employee, parts[0]);
                if (relatedObj != null) {
                    return getSimpleFieldValue(relatedObj, parts[1]);
                }
            }
        } catch (Exception e) {
            log.warn("Error getting employee field: {}.{}", parts.length > 0 ? parts[0] : "?", 
                    parts.length > 1 ? parts[1] : "?", e);
        }

        return "";
    }

    /**
     * Lấy giá trị từ RoutineHealthCheck entity
     */
    private String getRoutineHealthCheckValue(String fieldName, RoutineHealthCheck routineHealthCheck) {
        if (routineHealthCheck == null || fieldName == null || fieldName.isEmpty()) {
            return "";
        }

        try {
            return getSimpleFieldValue(routineHealthCheck, fieldName);
        } catch (Exception e) {
            log.warn("Error getting routine health check field: {}", fieldName, e);
            return "";
        }
    }

    /**
     * Lấy giá trị user (placeholder)
     */
    private String getUserValue(String fieldName) {
        // TODO: Implement if needed
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
                return ((java.time.LocalDateTime) value).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
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
}
