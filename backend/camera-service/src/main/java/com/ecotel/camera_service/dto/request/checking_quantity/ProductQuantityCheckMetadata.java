package com.ecotel.camera_service.dto.request.checking_quantity;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.NumberDeserializers;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductQuantityCheckMetadata implements EventMetadata {
    private List<DetectedItem> detectedItems;

    @Data
    public static class DetectedItem {
        private String productId;
        private BigDecimal actualQuantity;
    }

}
