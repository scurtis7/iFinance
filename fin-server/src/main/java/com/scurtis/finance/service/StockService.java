package com.scurtis.finance.service;

import com.scurtis.finance.converter.FinanceConverter;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.provider.StockPriceProvider;
import com.scurtis.finance.repository.InvestmentRepository;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private static final Duration PRICE_TIMEOUT = Duration.ofSeconds(10);

    private final InvestmentRepository investmentRepository;
    private final StockPriceProvider stockPriceProvider;
    private final FinanceConverter financeConverter;

    public Flux<InvestmentDto> refreshPrices() {
        // one ticker at a time to stay within the provider's rate limits
        return investmentRepository.findAll()
            .concatMap(this::refreshPrice)
            .map(financeConverter::toDto);
    }

    private Mono<Investment> refreshPrice(Investment investment) {
        return stockPriceProvider.getPrice(investment.getTicker())
            .timeout(PRICE_TIMEOUT)
            .onErrorResume(e -> {
                log.warn("Unable to refresh price for {}: {}", investment.getTicker(), e.getMessage());
                return Mono.empty();
            })
            .flatMap(price -> {
                investment.setPrice(price);
                return investmentRepository.save(investment);
            })
            .defaultIfEmpty(investment);
    }

}
