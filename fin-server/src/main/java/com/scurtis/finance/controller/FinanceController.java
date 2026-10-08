package com.scurtis.finance.controller;

import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.AccountPositionDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.service.FinanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@Slf4j
@RestController
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping(value = "accounts")
    public Flux<AccountDto> getAllAccounts() {
        return financeService.getAllAccounts();
    }

    @GetMapping(value = "investments")
    public Flux<InvestmentDto> getAllInvestments() {
        return financeService.getAllInvestments();
    }

    @GetMapping(value = "positions")
    public Flux<PositionDto> getAllPositions() {
        return financeService.getAllPositions();
    }

    @GetMapping(value = "account/positions")
    public Flux<AccountPositionDto> getAllAccountPositions() {
        return financeService.getAllAccountPositions();
    }


}
