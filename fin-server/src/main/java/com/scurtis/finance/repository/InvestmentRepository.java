package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Investment;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface InvestmentRepository extends ReactiveCrudRepository<Investment, Long> {
}
