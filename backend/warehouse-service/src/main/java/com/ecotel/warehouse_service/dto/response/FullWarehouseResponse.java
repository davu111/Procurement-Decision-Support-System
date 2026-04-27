package com.ecotel.warehouse_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class FullWarehouseResponse {
    String id;
    String warehouseName;
    Boolean isActive;
    BigDecimal totalInventory;
    BigDecimal items;
    List<InventoryResponse> inventories;
}
