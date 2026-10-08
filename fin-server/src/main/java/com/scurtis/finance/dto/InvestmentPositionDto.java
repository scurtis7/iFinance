package com.scurtis.finance.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonPropertyOrder({"investmentId", "positionId", "ticker", "category", "color", "price", "shares", "sequence"})
public class InvestmentPositionDto {

    private Long investmentId;
    private Long positionId;
    private String ticker;
    private String category;
    private String color;
    private BigDecimal price;
    private BigDecimal shares;
    private Integer sequence;

}
