package com.scurtis.finance.service;

import com.scurtis.finance.converter.FinanceConverter;
import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.repository.AccountRepository;
import com.scurtis.finance.repository.InvestmentRepository;
import com.scurtis.finance.repository.PositionRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Slf4j
@Service
@AllArgsConstructor
public class FinanceService {

    private final AccountRepository accountRepository;
    private final InvestmentRepository investmentRepository;
    private final PositionRepository positionRepository;
    private final FinanceConverter financeConverter;

    public Flux<AccountDto> getAllAccounts() {
        return accountRepository.findAll()
            .map(financeConverter::toDto);
    }

    public Flux<InvestmentDto> getAllInvestments() {
        return investmentRepository.findAll()
            .map(financeConverter::toDto);
    }

    public Flux<PositionDto> getAllPositions() {
        return positionRepository.findAll()
            .map(financeConverter::toDto);
    }

}
