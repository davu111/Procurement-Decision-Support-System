package com.ecotel.warehouse_service.exception;

import java.util.Map;

public class AppException extends RuntimeException {
    private ErrorCode errorCode;
    private String dynamicMessage; // Chứa message có giá trị thực thay thế vào

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    // Constructor mới: nhận thêm các giá trị để thay vào message template
    public AppException(ErrorCode errorCode, Map<String, String> params) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        // VD: "Current: {current}, Requested: {requested}" → "Current: 10, Requested: 50"
        String msg = errorCode.getMessage();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            msg = msg.replace("{" + entry.getKey() + "}", entry.getValue());
        }
        this.dynamicMessage = msg;
    }

    public String getResolvedMessage() {
        return dynamicMessage != null ? dynamicMessage : errorCode.getMessage();
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(ErrorCode errorCode){
        this.errorCode = errorCode;
    }
}
