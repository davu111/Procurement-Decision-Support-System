package com.ecotel.warehouse_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    LICENSE_PLATE_NOT_FOUND(1001, "License plate not found", HttpStatus.NOT_FOUND),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1003, "Invalid key exception", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(401, "Unauthorized exception", HttpStatus.UNAUTHORIZED),

    WAREHOUSE_NOT_FOUND(1004, "Warehouse not found", HttpStatus.NOT_FOUND),
    PRODUCT_NOT_IN_WAREHOUSE(1005, "Product does not exist in this warehouse", HttpStatus.NOT_FOUND),
    INSUFFICIENT_INVENTORY(1006, "Insufficient inventory. Current: {current}, Requested: {requested}", HttpStatus.CONFLICT),
    INVALID_QUANTITY(1007, "Amount must be greater than 0", HttpStatus.BAD_REQUEST),
    PRODUCT_IN_ANOTHER_WAREHOUSE(1008, "Product already exists in another warehouse", HttpStatus.CONFLICT),
    WAREHOUSE_CAPACITY_EXCEEDED(1009, "Import quantity exceeds warehouse capacity", HttpStatus.CONFLICT);



    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
