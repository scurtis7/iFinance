package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Investment;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface InvestmentRepository extends ReactiveCrudRepository<Investment, Long> {

    Mono<Boolean> existsByTicker(String ticker);

}
