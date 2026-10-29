package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Hsa;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface HsaRepository extends ReactiveCrudRepository<Hsa, Long> {

    /**
     * The table holds a single row; taking the lowest id keeps the choice stable if another is ever added.
     */
    Mono<Hsa> findFirstByOrderByIdAsc();

}
