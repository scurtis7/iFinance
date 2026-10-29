package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Position;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface PositionRepository extends ReactiveCrudRepository<Position, Long> {

    Flux<Position> findByAccountIdAndInvestmentId(Long accountId, Long investmentId);

    Mono<Integer> deleteByInvestmentId(Long investmentId);

}
