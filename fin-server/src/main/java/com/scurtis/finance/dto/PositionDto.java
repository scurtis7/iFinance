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
public class PositionDto {

    private Long positionId;
    private Long accountId;
    private Long investmentId;
    private BigDecimal shares;

}
