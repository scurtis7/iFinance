package com.scurtis.finance.controller;

import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.AccountPositionDto;
import com.scurtis.finance.dto.HsaDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.service.FinanceService;
import com.scurtis.finance.service.StockService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;
    private final StockService stockService;

    @GetMapping(value = "accounts")
    public Flux<AccountDto> getAllAccounts() {
        return financeService.getAllAccounts();
    }

    @GetMapping(value = "investments")
    public Flux<InvestmentDto> getAllInvestments() {
        return financeService.getAllInvestments();
    }

    @PostMapping(value = "investments/prices/refresh")
    public Flux<InvestmentDto> refreshInvestmentPrices() {
        return stockService.refreshPrices();
    }

    @GetMapping(value = "positions")
    public Flux<PositionDto> getAllPositions() {
        return financeService.getAllPositions();
    }

    @GetMapping(value = "account/positions")
    public Flux<AccountPositionDto> getAllAccountPositions() {
        return financeService.getAllAccountPositions();
    }

    @PatchMapping(value = "accounts/{accountId}")
    public Mono<AccountDto> updateAccount(@PathVariable Long accountId, @RequestBody AccountDto changes) {
        return financeService.updateAccount(accountId, changes);
    }

    @PutMapping(value = "accounts/order")
    public Flux<AccountDto> reorderAccounts(@RequestBody List<Long> accountIds) {
        return financeService.reorderAccounts(accountIds);
    }

    @PostMapping(value = "investments")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<InvestmentDto> createInvestment(@RequestBody InvestmentDto investment) {
        return financeService.createInvestment(investment);
    }

    @PatchMapping(value = "investments/{investmentId}")
    public Mono<InvestmentDto> updateInvestment(@PathVariable Long investmentId, @RequestBody InvestmentDto changes) {
        return financeService.updateInvestment(investmentId, changes);
    }

    @DeleteMapping(value = "investments/{investmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteInvestment(@PathVariable Long investmentId) {
        return financeService.deleteInvestment(investmentId);
    }

    @PutMapping(value = "investments/order")
    public Flux<InvestmentDto> reorderInvestments(@RequestBody List<Long> investmentIds) {
        return financeService.reorderInvestments(investmentIds);
    }

    @PutMapping(value = "positions")
    public Mono<PositionDto> savePosition(@RequestBody PositionDto position) {
        return financeService.savePosition(position);
    }

    @GetMapping(value = "hsa")
    public Mono<HsaDto> getHsa() {
        return financeService.getHsa();
    }

    @PutMapping(value = "hsa")
    public Mono<HsaDto> updateHsa(@RequestBody HsaDto hsa) {
        return financeService.updateHsa(hsa);
    }

}
