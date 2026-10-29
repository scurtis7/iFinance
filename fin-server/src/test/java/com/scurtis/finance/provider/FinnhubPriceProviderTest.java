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

class FinnhubPriceProviderTest {

    private final AtomicReference<ClientRequest> request = new AtomicReference<>();

    @Test
    void getPriceReturnsCurrentPrice() {
        String json = """
            {"c": 32.85, "d": 0.13, "dp": 0.3973, "h": 32.9, "l": 32.6, "o": 32.7, "pc": 32.72, "t": 1761768000}
            """;
        FinnhubPriceProvider provider = new FinnhubPriceProvider(respondWith(HttpStatus.OK, json), "test-key");

        BigDecimal price = provider.getPrice("SCHD").block();

        assertThat(price).isEqualByComparingTo("32.85");
        assertThat(request.get().url()).hasToString("https://finnhub.io/api/v1/quote?symbol=SCHD");
        assertThat(request.get().headers().getFirst("X-Finnhub-Token")).isEqualTo("test-key");
    }

    @Test
    void getPriceErrorsWhenTickerIsUnknown() {
        String json = """
            {"c": 0, "d": null, "dp": null, "h": 0, "l": 0, "o": 0, "pc": 0, "t": 0}
            """;
        FinnhubPriceProvider provider = new FinnhubPriceProvider(respondWith(HttpStatus.OK, json), "test-key");

        assertThatThrownBy(() -> provider.getPrice("NOPE").block())
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("Finnhub returned no price for NOPE");
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
