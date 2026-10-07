package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Position;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PositionRepository extends ReactiveCrudRepository<Position, Long> {
}
