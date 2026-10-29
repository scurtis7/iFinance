package com.scurtis.finance.provider;

import java.math.BigDecimal;
import reactor.core.publisher.Mono;

public interface StockPriceProvider {

    Mono<BigDecimal> getPrice(String ticker);

}
