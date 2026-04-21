package com.ecotel.inventory_optimization_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportResultResponse {
    private int totalRows;       // tổng số dòng trong file
    private int successCount;    // số bản ghi lưu thành công
    private int skipCount;       // số bản ghi bị skip (trùng lặp)
    private int errorCount;      // số bản ghi lỗi validation
    private List<String> errors; // chi tiết lỗi (tối đa 20 dòng đầu)
    private String modelReadiness; // thông báo về mô hình dự báo
}
