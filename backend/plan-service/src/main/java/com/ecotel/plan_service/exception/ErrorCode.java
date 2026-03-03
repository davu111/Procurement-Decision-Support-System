package com.ecotel.plan_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    LICENSE_PLATE_NOT_FOUND(1001, "License plate not found", HttpStatus.NOT_FOUND),
    PLAN_NOT_FOUND(1002, "Plan not found", HttpStatus.NOT_FOUND),
    PLAN_DETAILS_NOT_FOUND(1003, "Plan details not found", HttpStatus.NOT_FOUND),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception", HttpStatus.INTERNAL_SERVER_ERROR);


    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
}
