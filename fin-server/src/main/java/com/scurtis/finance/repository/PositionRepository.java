package com.scurtis.finance.repository;

import com.scurtis.finance.entity.AccountPosition;
import com.scurtis.finance.entity.Position;
import java.util.List;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface PositionRepository extends ReactiveCrudRepository<Position, Long> {

    @Query(value =
    "select a.account_id, i.investment_id, p.position_id, a.name, a.cash, i.ticker, i.category, i.color, i.price, p.shares"
        + "    from financedb.finance.position p"
        + "    join finance.account a on a.account_id = p.account_id"
        + "    join finance.investment i on i.investment_id = p.investment_id"
        + "    order by a.account_id, i.investment_id")
    Flux<AccountPosition> getAllAccountPositions();

}
