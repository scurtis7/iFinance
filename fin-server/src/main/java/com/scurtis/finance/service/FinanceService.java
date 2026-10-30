package com.scurtis.finance.service;

import com.scurtis.finance.converter.FinanceConverter;
import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.AccountPositionDto;
import com.scurtis.finance.dto.HsaDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.entity.Account;
import com.scurtis.finance.entity.Hsa;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.entity.Position;
import com.scurtis.finance.repository.AccountRepository;
import com.scurtis.finance.repository.HsaRepository;
import com.scurtis.finance.repository.InvestmentRepository;
import com.scurtis.finance.repository.PositionRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceService {

    private static final Pattern HEX_COLOR = Pattern.compile("#[0-9a-fA-F]{6}");

    private final AccountRepository accountRepository;
    private final InvestmentRepository investmentRepository;
    private final PositionRepository positionRepository;
    private final HsaRepository hsaRepository;
    private final FinanceConverter financeConverter;

    public Flux<AccountDto> getAllAccounts() {
        return accountRepository.findAll()
            .map(financeConverter::toDto);
    }

    public Flux<InvestmentDto> getAllInvestments() {
        return investmentRepository.findAll()
            .map(financeConverter::toDto);
    }

    public Flux<PositionDto> getAllPositions() {
        return positionRepository.findAll()
            .map(financeConverter::toDto);
    }

    public Flux<AccountPositionDto> getAllAccountPositions() {
        return accountRepository.getAllAccountPositions()
            .collectList()
            .flatMapIterable(financeConverter::toDtos);
    }

    /**
     * Sets the account's cash when the request includes it. Nothing else about an account can be changed.
     */
    public Mono<AccountDto> updateAccount(Long accountId, AccountDto changes) {
        return accountRepository.findById(accountId)
            .switchIfEmpty(Mono.error(() -> notFound("Account", accountId)))
            .flatMap(account -> {
                if (changes.getCash() != null) {
                    account.setCash(requireNonNegative(changes.getCash(), "cash"));
                }
                return accountRepository.save(account);
            })
            .map(financeConverter::toDto);
    }

    /**
     * Numbers the accounts 1, 2, 3... in the order of the given ids. Accounts that are left out follow in their
     * current order, and unknown ids are ignored. Returns every account in the new order.
     */
    @Transactional
    public Flux<AccountDto> reorderAccounts(List<Long> accountIds) {
        Comparator<Account> requestedOrder = Comparator.comparingInt(account -> {
            int index = accountIds.indexOf(account.getId());
            return index == -1 ? Integer.MAX_VALUE : index;
        });
        return accountRepository.findAll()
            .sort(requestedOrder
                .thenComparing(Account::getSequence, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Account::getId))
            .index()
            .concatMap(numbered -> resequence(numbered.getT2(), numbered.getT1().intValue() + 1))
            .map(financeConverter::toDto);
    }

    /**
     * Adds an investment after all the others. The ticker is trimmed and upper-cased and must not already exist.
     */
    public Mono<InvestmentDto> createInvestment(InvestmentDto request) {
        return Mono.fromCallable(() -> newInvestment(request))
            .flatMap(investment -> investmentRepository.existsByTicker(investment.getTicker())
                .filter(exists -> !exists)
                .switchIfEmpty(Mono.error(() -> new ResponseStatusException(HttpStatus.CONFLICT, investment.getTicker() + " already exists")))
                .then(nextSequence())
                .flatMap(sequence -> {
                    investment.setSequence(sequence);
                    return investmentRepository.save(investment);
                }))
            .map(financeConverter::toDto);
    }

    /**
     * Sets whichever of category, color and price the request includes. The ticker and sequence don't change.
     */
    public Mono<InvestmentDto> updateInvestment(Long investmentId, InvestmentDto changes) {
        return investmentRepository.findById(investmentId)
            .switchIfEmpty(Mono.error(() -> notFound("Investment", investmentId)))
            .flatMap(investment -> {
                applyChanges(investment, changes);
                return investmentRepository.save(investment);
            })
            .map(financeConverter::toDto);
    }

    /**
     * Deletes an investment along with its positions in every account.
     */
    @Transactional
    public Mono<Void> deleteInvestment(Long investmentId) {
        return investmentRepository.findById(investmentId)
            .switchIfEmpty(Mono.error(() -> notFound("Investment", investmentId)))
            .flatMap(investment -> positionRepository.deleteByInvestmentId(investmentId)
                .then(investmentRepository.delete(investment)));
    }

    /**
     * Numbers the investments 1, 2, 3... in the order of the given ids. Investments that are left out follow in their
     * current order, and unknown ids are ignored. Returns every investment in the new order.
     */
    @Transactional
    public Flux<InvestmentDto> reorderInvestments(List<Long> investmentIds) {
        Comparator<Investment> requestedOrder = Comparator.comparingInt(investment -> {
            int index = investmentIds.indexOf(investment.getId());
            return index == -1 ? Integer.MAX_VALUE : index;
        });
        return investmentRepository.findAll()
            .sort(requestedOrder
                .thenComparing(Investment::getSequence, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Investment::getId))
            .index()
            .concatMap(numbered -> resequence(numbered.getT2(), numbered.getT1().intValue() + 1))
            .map(financeConverter::toDto);
    }

    /**
     * Sets the shares an account holds of an investment, adding the position if the account doesn't hold it yet.
     */
    public Mono<PositionDto> savePosition(PositionDto request) {
        Long accountId = request.getAccountId();
        Long investmentId = request.getInvestmentId();
        if (accountId == null || investmentId == null) {
            return Mono.error(badRequest("accountId and investmentId are required"));
        }
        if (request.getShares() == null || request.getShares().signum() < 0) {
            return Mono.error(badRequest("shares must be zero or more"));
        }
        return accountRepository.existsById(accountId)
            .filter(Boolean::booleanValue)
            .switchIfEmpty(Mono.error(() -> notFound("Account", accountId)))
            .then(investmentRepository.existsById(investmentId))
            .filter(Boolean::booleanValue)
            .switchIfEmpty(Mono.error(() -> notFound("Investment", investmentId)))
            .thenMany(positionRepository.findByAccountIdAndInvestmentId(accountId, investmentId))
            .next()
            .defaultIfEmpty(newPosition(accountId, investmentId))
            .flatMap(position -> {
                position.setShares(request.getShares());
                return positionRepository.save(position);
            })
            .map(financeConverter::toDto);
    }

    /**
     * Returns the HSA balance, which is zero until one has been saved.
     */
    public Mono<HsaDto> getHsa() {
        return hsaRepository.findFirstByOrderByIdAsc()
            .map(financeConverter::toDto)
            .defaultIfEmpty(new HsaDto(BigDecimal.ZERO));
    }

    /**
     * Sets the HSA balance, adding the row that holds it if there isn't one yet.
     */
    public Mono<HsaDto> updateHsa(HsaDto request) {
        if (request.getBalance() == null || request.getBalance().signum() < 0) {
            return Mono.error(badRequest("balance must be zero or more"));
        }
        return hsaRepository.findFirstByOrderByIdAsc()
            .defaultIfEmpty(new Hsa())
            .flatMap(hsa -> {
                hsa.setBalance(request.getBalance());
                return hsaRepository.save(hsa);
            })
            .map(financeConverter::toDto);
    }

    private Investment newInvestment(InvestmentDto request) {
        String ticker = StringUtils.upperCase(StringUtils.trimToNull(request.getTicker()));
        if (ticker == null) {
            throw badRequest("ticker is required");
        }
        Investment investment = new Investment();
        investment.setTicker(ticker);
        applyChanges(investment, request);
        return investment;
    }

    private void applyChanges(Investment investment, InvestmentDto changes) {
        if (changes.getCategory() != null) {
            investment.setCategory(changes.getCategory().trim());
        }
        if (changes.getColor() != null) {
            if (!HEX_COLOR.matcher(changes.getColor()).matches()) {
                throw badRequest("color must be a hex color such as #2383a9");
            }
            investment.setColor(changes.getColor().toLowerCase());
        }
        if (changes.getPrice() != null) {
            investment.setPrice(requireNonNegative(changes.getPrice(), "price"));
        }
    }

    private Mono<Integer> nextSequence() {
        return investmentRepository.findAll()
            .mapNotNull(Investment::getSequence)
            .reduce(0, Math::max)
            .map(highest -> highest + 1);
    }

    private Mono<Account> resequence(Account account, int sequence) {
        if (Objects.equals(account.getSequence(), sequence)) {
            return Mono.just(account);
        }
        account.setSequence(sequence);
        return accountRepository.save(account);
    }

    private Mono<Investment> resequence(Investment investment, int sequence) {
        if (Objects.equals(investment.getSequence(), sequence)) {
            return Mono.just(investment);
        }
        investment.setSequence(sequence);
        return investmentRepository.save(investment);
    }

    private static Position newPosition(Long accountId, Long investmentId) {
        Position position = new Position();
        position.setAccountId(accountId);
        position.setInvestmentId(investmentId);
        return position;
    }

    private static BigDecimal requireNonNegative(BigDecimal value, String field) {
        if (value.signum() < 0) {
            throw badRequest(field + " must not be negative");
        }
        return value;
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private static ResponseStatusException notFound(String type, Long id) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, type + " " + id + " not found");
    }

}
