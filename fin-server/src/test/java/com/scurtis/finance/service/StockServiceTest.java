package com.scurtis.finance.service;

import com.scurtis.finance.converter.FinanceConverter;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.provider.StockPriceProvider;
import com.scurtis.finance.repository.InvestmentRepository;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock
    private InvestmentRepository investmentRepository;
    @Mock
    private StockPriceProvider stockPriceProvider;

    private StockService stockService;

    @BeforeEach
    void setUp() {
        stockService = new StockService(investmentRepository, stockPriceProvider, new FinanceConverter());
    }

    @Test
    void refreshPricesSavesNewPrices() {
        Investment schd = investment(1L, "SCHD", "32.72");
        Investment spmo = investment(2L, "SPMO", "153.23");
        when(investmentRepository.findAll()).thenReturn(Flux.just(schd, spmo));
        when(investmentRepository.save(any(Investment.class))).thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));
        when(stockPriceProvider.getPrice("SCHD")).thenReturn(Mono.just(new BigDecimal("33.10")));
        when(stockPriceProvider.getPrice("SPMO")).thenReturn(Mono.just(new BigDecimal("155.00")));

        List<InvestmentDto> investments = stockService.refreshPrices().collectList().block();

        assertThat(investments).extracting(InvestmentDto::getPrice)
            .containsExactly(new BigDecimal("33.10"), new BigDecimal("155.00"));
        verify(investmentRepository).save(schd);
        verify(investmentRepository).save(spmo);
    }

    @Test
    void refreshPricesKeepsOldPriceWhenProviderFails() {
        Investment schd = investment(1L, "SCHD", "32.72");
        when(investmentRepository.findAll()).thenReturn(Flux.just(schd));
        when(stockPriceProvider.getPrice("SCHD")).thenReturn(Mono.error(new IllegalStateException("rate limited")));

        List<InvestmentDto> investments = stockService.refreshPrices().collectList().block();

        assertThat(investments).extracting(InvestmentDto::getPrice).containsExactly(new BigDecimal("32.72"));
        verify(investmentRepository, never()).save(any(Investment.class));
    }

    private Investment investment(Long id, String ticker, String price) {
        Investment investment = new Investment();
        investment.setId(id);
        investment.setTicker(ticker);
        investment.setPrice(new BigDecimal(price));
        return investment;
    }

}
