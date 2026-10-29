package com.scurtis.finance.provider;

import java.math.BigDecimal;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

public class AlphaVantagePriceProvider implements StockPriceProvider {

    private static final String BASE_URL = "https://www.alphavantage.co";

    private final WebClient webClient;
    private final String apiKey;

    public AlphaVantagePriceProvider(WebClient.Builder webClientBuilder, String apiKey) {
        this.webClient = webClientBuilder
            .baseUrl(BASE_URL)
            .build();
        this.apiKey = apiKey;
    }

    @Override
    public Mono<BigDecimal> getPrice(String ticker) {
        return webClient.get()
            .uri(uriBuilder -> uriBuilder.path("/query")
                .queryParam("function", "GLOBAL_QUOTE")
                .queryParam("symbol", ticker)
                .queryParam("apikey", apiKey)
                .build())
            .retrieve()
            .bodyToMono(AlphaVantageQuote.class)
            // the default message includes the request URL, which contains the API key
            .onErrorMap(WebClientResponseException.class, e -> new IllegalStateException("Alpha Vantage returned " + e.getStatusCode()))
            .flatMap(quote -> toPrice(quote, ticker));
    }

    private Mono<BigDecimal> toPrice(AlphaVantageQuote quote, String ticker) {
        AlphaVantageQuote.GlobalQuote globalQuote = quote.getGlobalQuote();
        if (globalQuote != null && globalQuote.getPrice() != null) {
            return Mono.just(globalQuote.getPrice());
        }
        // rate limit and API key problems come back as HTTP 200 with a message instead of a quote
        String reason = StringUtils.firstNonBlank(quote.getInformation(), quote.getNote(), quote.getErrorMessage(), "unknown ticker");
        return Mono.error(new IllegalStateException("Alpha Vantage returned no price for " + ticker + ": " + reason));
    }

}
