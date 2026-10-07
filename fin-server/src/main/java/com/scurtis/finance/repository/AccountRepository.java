package com.scurtis.finance.repository;

import com.scurtis.finance.entity.Account;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AccountRepository extends ReactiveCrudRepository<Account, Long> {
}
