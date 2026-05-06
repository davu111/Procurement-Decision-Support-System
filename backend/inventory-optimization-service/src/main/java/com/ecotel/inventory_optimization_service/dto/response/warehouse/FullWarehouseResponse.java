package com.ecotel.inventory_optimization_service.dto.response.warehouse;

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
    Long configId;
    List<InventoryResponse> inventories;
}
