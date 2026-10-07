package com.scurtis.finance.converter;

import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.entity.Account;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.entity.Position;
import org.springframework.stereotype.Component;

@Component
public class FinanceConverter {

    public AccountDto toDto(Account account) {
        return new AccountDto(account.getId(), account.getName(), account.getCash());
    }

    public InvestmentDto toDto(Investment investment) {
        return new InvestmentDto(investment.getId(), investment.getTicker(), investment.getCategory(), investment.getColor(), investment.getPrice());
    }

    public PositionDto toDto(Position position) {
        return new PositionDto(position.getId(), position.getAccountId(), position.getInvestmentId(), position.getShares());
    }

}
