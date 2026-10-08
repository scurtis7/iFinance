package com.scurtis.finance.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonPropertyOrder({"accountId", "investmentId", "positionId", "name", "cash", "ticker", "category", "color", "price", "shares"})
public class AccountPosition {

    private Long accountId;
    private Long investmentId;
    private Long positionId;
    private String name;
    private BigDecimal cash;
    private String ticker;
    private String category;
    private String color;
    private BigDecimal price;
    private BigDecimal shares;

}
