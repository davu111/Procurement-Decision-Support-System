package com.ecotel.warehouse_service.dto.response;

import com.ecotel.warehouse_service.enums.AreaCode;
import com.ecotel.warehouse_service.enums.WarehouseStatus;
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
    AreaCode areaCode;
    String location;
    String siteId;
    WarehouseStatus status;
    BigDecimal totalInventory;
    BigDecimal items;
    List<InventoryResponse> inventories;
}
