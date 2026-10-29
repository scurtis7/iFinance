package com.scurtis.finance.config;

import com.scurtis.finance.provider.AlphaVantagePriceProvider;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StockConfigTest {

    private final AppConfig appConfig = new AppConfig();
    private final StockConfig stockConfig = new StockConfig();

    @Test
    void stockPriceProviderCanBeAlphaVantage() {
        appConfig.getStock().setProvider("alpha-vantage");

        assertThat(stockConfig.stockPriceProvider(appConfig)).isInstanceOf(AlphaVantagePriceProvider.class);
    }

    @Test
    void stockPriceProviderRejectsUnknownProvider() {
        appConfig.getStock().setProvider("yahoo");

        assertThatThrownBy(() -> stockConfig.stockPriceProvider(appConfig))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Unknown scurtis.stock.provider: yahoo");
    }

}
