package com.scurtis.finance.config;

import com.scurtis.finance.provider.AlphaVantagePriceProvider;
import com.scurtis.finance.provider.FinnhubPriceProvider;
import com.scurtis.finance.provider.StockPriceProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Configuration
public class StockConfig {

    @Bean
    public StockPriceProvider stockPriceProvider(AppConfig appConfig) {
        AppConfig.Stock stock = appConfig.getStock();
        log.info("Stock price provider: {}", stock.getProvider());
        return switch (stock.getProvider()) {
            case "finnhub" -> new FinnhubPriceProvider(WebClient.builder(), stock.getFinnhubApiKey());
            case "alpha-vantage" -> new AlphaVantagePriceProvider(WebClient.builder(), stock.getAlphaVantageApiKey());
            default -> throw new IllegalStateException("Unknown scurtis.stock.provider: " + stock.getProvider());
        };
    }

}
