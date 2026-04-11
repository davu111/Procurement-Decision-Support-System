package com.ecotel.inventory_optimization_service.mapper;

import com.ecotel.inventory_optimization_service.dto.response.InventoryCalculationResult;
import com.ecotel.inventory_optimization_service.model.InventoryResult;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface InventoryResultMapper {
    @Mapping(target = "InventoryParameterId", source = "inventoryResult.inventoryParameter.id")
    @Mapping(target = "demandQ", source = "inventoryResult.inventoryParameter.demandQ")
    @Mapping(target = "supplyRateK", source = "inventoryResult.inventoryParameter.snapshotSupplyRateK")
    @Mapping(target = "fixedOrderCostA", source = "inventoryResult.inventoryParameter.snapshotFixedOrderCostA")
    @Mapping(target = "unitPriceC", source = "inventoryResult.inventoryParameter.snapshotUnitPriceC")
    @Mapping(target = "storageCoefficientI", source = "inventoryResult.inventoryParameter.storageCostCoefficientI")
    @Mapping(target = "leadTimeL", source = "inventoryResult.inventoryParameter.snapshotLeadTimeL")
    @Mapping(target = "kMinusQFactor", expression = "java(BigDecimal.ONE.subtract(\n" +
            "    inventoryResult.getInventoryParameter()\n" +
            "        .getDemandQ()\n" +
            "        .divide(\n" +
            "            inventoryResult.getInventoryParameter().getSnapshotSupplyRateK(),\n" +
            "            4,\n" +
            "            java.math.RoundingMode.HALF_UP\n" +
            "        )\n" +
            "))")
    InventoryCalculationResult toInventoryCalculationResult(InventoryResult inventoryResult);
}
