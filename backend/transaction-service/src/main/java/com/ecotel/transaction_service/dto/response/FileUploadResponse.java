package com.ecotel.transaction_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private String fileName;
    private String objectName;
    private String viewUrl;      // URL để XEM
    private String downloadUrl;  // URL để DOWNLOAD
    private Long expiryTime;     // Timestamp khi URL hết hạn
}
