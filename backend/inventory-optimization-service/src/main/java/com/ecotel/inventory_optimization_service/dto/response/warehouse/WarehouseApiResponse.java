package com.ecotel.inventory_optimization_service.dto.response.warehouse;

import lombok.Data;

@Data
public class WarehouseApiResponse<T> {
    private Integer code;
    private String message;
    private T data;
}
