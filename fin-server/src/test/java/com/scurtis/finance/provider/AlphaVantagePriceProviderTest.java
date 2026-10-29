package com.scurtis.finance.provider;

import java.math.BigDecimal;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AlphaVantagePriceProviderTest {

    private final AtomicReference<ClientRequest> request = new AtomicReference<>();

    @Test
    void getPriceReturnsPrice() {
        String json = """
            {
                "Global Quote": {
                    "01. symbol": "SCHD",
                    "02. open": "32.7000",
                    "03. high": "32.9000",
                    "04. low": "32.6000",
                    "05. price": "32.8500",
                    "06. volume": "11523456",
                    "07. latest trading day": "2026-10-28",
                    "08. previous close": "32.7200",
                    "09. change": "0.1300",
                    "10. change percent": "0.3973%"
                }
            }
            """;
        AlphaVantagePriceProvider provider = new AlphaVantagePriceProvider(respondWith(HttpStatus.OK, json), "test-key");

        BigDecimal price = provider.getPrice("SCHD").block();

        assertThat(price).isEqualByComparingTo("32.85");
        assertThat(request.get().url()).hasToString("https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SCHD&apikey=test-key");
    }

    @Test
    void getPriceErrorsWithReasonWhenRateLimited() {
        String json = """
            {"Information": "Our standard API rate limit is 25 requests per day."}
            """;
        AlphaVantagePriceProvider provider = new AlphaVantagePriceProvider(respondWith(HttpStatus.OK, json), "test-key");

        assertThatThrownBy(() -> provider.getPrice("SCHD").block())
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Alpha Vantage returned no price for SCHD: Our standard API rate limit is 25 requests per day.");
    }

    @Test
    void getPriceErrorsWhenTickerIsUnknown() {
        String json = """
            {"Global Quote": {}}
            """;
        AlphaVantagePriceProvider provider = new AlphaVantagePriceProvider(respondWith(HttpStatus.OK, json), "test-key");

        assertThatThrownBy(() -> provider.getPrice("NOPE").block())
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Alpha Vantage returned no price for NOPE: unknown ticker");
    }

    @Test
    void getPriceErrorDoesNotExposeApiKey() {
        AlphaVantagePriceProvider provider = new AlphaVantagePriceProvider(respondWith(HttpStatus.INTERNAL_SERVER_ERROR, "{}"), "test-key");

        assertThatThrownBy(() -> provider.getPrice("SCHD").block())
            .isInstanceOf(IllegalStateException.class)
            .hasMessageStartingWith("Alpha Vantage returned 500")
            .hasMessageNotContaining("test-key");
    }

    private WebClient.Builder respondWith(HttpStatus status, String body) {
        return WebClient.builder().exchangeFunction(clientRequest -> {
            request.set(clientRequest);
            return Mono.just(ClientResponse.create(status)
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(body)
                .build());
        });
    }

}
