package com.ecotel.transaction_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InOutDetailResponse {
    String id;
    String productId;
    BigDecimal quantity;
}
