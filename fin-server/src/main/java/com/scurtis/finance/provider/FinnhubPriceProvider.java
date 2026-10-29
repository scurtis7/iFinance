package com.scurtis.finance.provider;

import java.math.BigDecimal;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

public class FinnhubPriceProvider implements StockPriceProvider {

    private static final String BASE_URL = "https://finnhub.io/api/v1";
    private static final String TOKEN_HEADER = "X-Finnhub-Token";

    private final WebClient webClient;

    public FinnhubPriceProvider(WebClient.Builder webClientBuilder, String apiKey) {
        this.webClient = webClientBuilder
            .baseUrl(BASE_URL)
            .defaultHeader(TOKEN_HEADER, apiKey)
            .build();
    }

    @Override
    public Mono<BigDecimal> getPrice(String ticker) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder.path("/quote").queryParam("symbol", ticker).build())
            .retrieve()
            .bodyToMono(FinnhubQuote.class)
            .mapNotNull(FinnhubQuote::getCurrentPrice)
            // unknown tickers come back as a quote of all zeros rather than an error
            .filter(price -> price.signum() > 0)
            .switchIfEmpty(Mono.error(() -> new IllegalStateException("Finnhub returned no price for " + ticker)));
    }

}
