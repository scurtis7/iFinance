package com.scurtis.finance.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonPropertyOrder({"accountId", "name", "cash", "positions"})
public class AccountPositionDto {

    private Long accountId;
    private String name;
    private BigDecimal cash;
    private List<InvestmentPositionDto> positions;

}
