package com.ecotel.product_service.exception;

import com.ecotel.shared_library.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final String MIN_ATTRIBUTE = "min";

//        @ExceptionHandler(value = Exception.class)
//        ResponseEntity<ApiResponse> handlingRuntimeException (Exception exception){
//            ApiResponse apiResponse  = new ApiResponse();
//            apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
//            apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
//            return ResponseEntity.badRequest().body(apiResponse);
//        }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ApiResponse apiResponse = new ApiResponse();
        ErrorCode errorCode = exception.getErrorCode();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

//    @ExceptionHandler(value = MethodArgumentNotValidException.class)
//    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception) {
//        ApiResponse apiResponse = new ApiResponse();
//        String enumKey = exception.getFieldError().getDefaultMessage();
//        ErrorCode errorCode = ErrorCode.INVALID_KEY;
//        Map<String, Object> attributes = null;
//
//        try {
//            errorCode = ErrorCode.valueOf(enumKey);
//
//            var constraintViolation = exception
//                    .getBindingResult()
//                    .getAllErrors()
//                    .getFirst()
//                    .unwrap(ConstraintViolation.class); // Lay ra loi dau tien
//
//            attributes = constraintViolation
//                    .getConstraintDescriptor()
//                    .getAttributes(); // Lay ra cac bien cua loi: groups, payload, min, message
//
//        } catch (IllegalArgumentException e) {
//        }
//
//        apiResponse.setCode(errorCode.getCode());
//        apiResponse.setMessage(
//                Objects.nonNull(attributes)
//                        ? mapAttribute(errorCode.getMessage(), attributes)
//                        : errorCode.getMessage());
//
//        return ResponseEntity.badRequest().body(apiResponse);
//    }
//
//    @ExceptionHandler(value = AccessDeniedException.class)
//    ResponseEntity<ApiResponse> handlingAccessDenied(AccessDeniedException exception) {
//        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
//
//        return ResponseEntity.status(errorCode.getStatusCode())
//                .body(ApiResponse.builder()
//                        .code(errorCode.getCode())
//                        .message(errorCode.getMessage())
//                        .build());
//    }

    private String mapAttribute(String message, Map<String, Object> attributes) {
        String minValue = String.valueOf(attributes.get(MIN_ATTRIBUTE));

        return message.replace("{" + MIN_ATTRIBUTE + "}", minValue);
    }
}
