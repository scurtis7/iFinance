package com.scurtis.finance.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InvestmentDto {

    private Long investmentId;
    private String ticker;
    private String category;
    private String color;
    private BigDecimal price;
    private Integer sequence;

}
