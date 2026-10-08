package com.scurtis.finance.converter;

import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.AccountPositionDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.InvestmentPositionDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.entity.Account;
import com.scurtis.finance.entity.AccountPosition;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.entity.Position;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class FinanceConverter {

    public AccountDto toDto(Account account) {
        return new AccountDto(account.getId(), account.getName(), account.getCash());
    }

    public InvestmentDto toDto(Investment investment) {
        return new InvestmentDto(investment.getId(), investment.getTicker(), investment.getCategory(), investment.getColor(), investment.getPrice(), investment.getSequence());
    }

    public PositionDto toDto(Position position) {
        return new PositionDto(position.getId(), position.getAccountId(), position.getInvestmentId(), position.getShares());
    }

    public List<AccountPositionDto> toDtos(List<AccountPosition> accountPositions) {
        Map<Long, AccountPositionDto> accounts = new LinkedHashMap<>();
        for (AccountPosition accountPosition : accountPositions) {
            AccountPositionDto account = accounts.computeIfAbsent(accountPosition.getAccountId(), id -> toAccountPositionDto(accountPosition));
            if (accountPosition.getPositionId() != null) {
                account.getPositions().add(toInvestmentPositionDto(accountPosition));
            }
        }
        return new ArrayList<>(accounts.values());
    }

    private AccountPositionDto toAccountPositionDto(AccountPosition accountPosition) {
        AccountPositionDto dto = new AccountPositionDto();
        dto.setAccountId(accountPosition.getAccountId());
        dto.setName(accountPosition.getName());
        dto.setCash(accountPosition.getCash());
        dto.setPositions(new ArrayList<>());
        return dto;
    }

    private InvestmentPositionDto toInvestmentPositionDto(AccountPosition accountPosition) {
        InvestmentPositionDto dto = new InvestmentPositionDto();
        dto.setInvestmentId(accountPosition.getInvestmentId());
        dto.setPositionId(accountPosition.getPositionId());
        dto.setTicker(accountPosition.getTicker());
        dto.setCategory(accountPosition.getCategory());
        dto.setColor(accountPosition.getColor());
        dto.setPrice(accountPosition.getPrice());
        dto.setShares(accountPosition.getShares());
        dto.setSequence(accountPosition.getSequence());
        return dto;
    }

}
