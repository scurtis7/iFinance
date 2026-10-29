package com.scurtis.finance.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import static org.springframework.util.Assert.hasText;

@Slf4j
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "scurtis")
public class AppConfig {

    private String appVersion;
    private Stock stock = new Stock();

    @PostConstruct
    public void init() {
        log.info("fin-server Version: {}", appVersion);
        hasText(stock.getProvider(), "The property scurtis.stock.provider must not be empty");
        hasText(stock.getFinnhubApiKey(), "The property scurtis.stock.finnhub-api-key must not be empty");
        hasText(stock.getAlphaVantageApiKey(), "The property scurtis.stock.alpha-vantage-api-key must not be empty");
    }

    @Getter
    @Setter
    public static class Stock {

        private String provider;
        private String finnhubApiKey;
        private String alphaVantageApiKey;

    }

}
