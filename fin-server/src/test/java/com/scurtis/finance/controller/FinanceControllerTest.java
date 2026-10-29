package com.scurtis.finance.controller;

import com.scurtis.finance.dto.AccountDto;
import com.scurtis.finance.dto.AccountPositionDto;
import com.scurtis.finance.dto.InvestmentDto;
import com.scurtis.finance.dto.PositionDto;
import com.scurtis.finance.entity.Account;
import com.scurtis.finance.entity.Investment;
import com.scurtis.finance.entity.Position;
import com.scurtis.finance.repository.AccountRepository;
import com.scurtis.finance.repository.InvestmentRepository;
import com.scurtis.finance.repository.PositionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.HttpMethod;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Calls the endpoints through WebFlux and R2DBC against the in-memory H2 database.
 */
@SpringBootTest
@ActiveProfiles(value = "test")
class FinanceControllerTest {

    private static final long UNKNOWN_ID = 999_999L;

    @Autowired
    private ApplicationContext context;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private InvestmentRepository investmentRepository;
    @Autowired
    private PositionRepository positionRepository;

    private WebTestClient client;
    private Account brokerage;
    private Account roth;
    private Investment schd;
    private Investment spmo;
    private Position rothSchd;

    @BeforeEach
    void setUp() {
        client = WebTestClient.bindToApplicationContext(context).build();
        positionRepository.deleteAll()
            .then(investmentRepository.deleteAll())
            .then(accountRepository.deleteAll())
            .block();
        brokerage = accountRepository.save(account("Brokerage", "3819.69")).block();
        roth = accountRepository.save(account("Roth", "51989.58")).block();
        schd = investmentRepository.save(investment("SCHD", 1)).block();
        spmo = investmentRepository.save(investment("SPMO", 2)).block();
        rothSchd = positionRepository.save(position(roth, schd, "503.215")).block();
    }

    @Test
    void getEndpointsReturnTheSavedRows() {
        assertThat(getList("/accounts", AccountDto.class)).extracting(AccountDto::getName).containsExactlyInAnyOrder("Brokerage", "Roth");
        assertThat(getList("/investments", InvestmentDto.class)).extracting(InvestmentDto::getTicker).containsExactlyInAnyOrder("SCHD", "SPMO");
        assertThat(getList("/positions", PositionDto.class)).singleElement().satisfies(position -> {
            assertThat(position.getAccountId()).isEqualTo(roth.getId());
            assertThat(position.getInvestmentId()).isEqualTo(schd.getId());
            assertThat(position.getShares()).isEqualByComparingTo("503.215");
        });
    }

    @Test
    void accountPositionsListEveryAccountWithTheInvestmentsItHolds() {
        List<AccountPositionDto> accounts = getList("/account/positions", AccountPositionDto.class);

        assertThat(accounts).extracting(AccountPositionDto::getName).containsExactly("Brokerage", "Roth");
        assertThat(accounts.get(0).getPositions()).isEmpty();
        assertThat(accounts.get(1).getPositions()).singleElement().satisfies(position -> {
            assertThat(position.getTicker()).isEqualTo("SCHD");
            assertThat(position.getShares()).isEqualByComparingTo("503.215");
        });
    }

    @Test
    void patchAccountSetsOnlyTheCash() {
        AccountDto account = send(HttpMethod.PATCH, "/accounts/{id}", Map.of("cash", 600, "name", "Renamed"), brokerage.getId())
            .expectStatus().isOk()
            .expectBody(AccountDto.class).returnResult().getResponseBody();

        assertThat(account.getCash()).isEqualByComparingTo("600");
        assertThat(account.getName()).isEqualTo("Brokerage");
        assertThat(accountRepository.findById(brokerage.getId()).block().getCash()).isEqualByComparingTo("600");
    }

    @Test
    void patchAccountRejectsNegativeCashAndUnknownAccounts() {
        send(HttpMethod.PATCH, "/accounts/{id}", Map.of("cash", -1), brokerage.getId()).expectStatus().isBadRequest();
        send(HttpMethod.PATCH, "/accounts/{id}", Map.of("cash", 1), UNKNOWN_ID).expectStatus().isNotFound();

        assertThat(accountRepository.findById(brokerage.getId()).block().getCash()).isEqualByComparingTo("3819.69");
    }

    @Test
    void postInvestmentAddsItAfterTheOthers() {
        InvestmentDto created = send(HttpMethod.POST, "/investments",
            Map.of("ticker", " vti ", "category", " Total Market ", "color", "#ABCDEF", "price", 300.5))
            .expectStatus().isCreated()
            .expectBody(InvestmentDto.class).returnResult().getResponseBody();

        assertThat(created.getInvestmentId()).isNotNull();
        assertThat(created.getTicker()).isEqualTo("VTI");
        assertThat(created.getCategory()).isEqualTo("Total Market");
        assertThat(created.getColor()).isEqualTo("#abcdef");
        assertThat(created.getPrice()).isEqualByComparingTo("300.5");
        assertThat(created.getSequence()).isEqualTo(3);
        assertThat(investmentRepository.existsByTicker("VTI").block()).isTrue();
    }

    @Test
    void postInvestmentRejectsDuplicateTickersAndInvalidValues() {
        send(HttpMethod.POST, "/investments", Map.of("ticker", "schd")).expectStatus().isEqualTo(409);
        send(HttpMethod.POST, "/investments", Map.of("ticker", " ")).expectStatus().isBadRequest();
        send(HttpMethod.POST, "/investments", Map.of("ticker", "VTI", "color", "red")).expectStatus().isBadRequest();
        send(HttpMethod.POST, "/investments", Map.of("ticker", "VTI", "price", -1)).expectStatus().isBadRequest();

        assertThat(investmentRepository.count().block()).isEqualTo(2);
    }

    @Test
    void patchInvestmentChangesOnlyCategoryColorAndPrice() {
        InvestmentDto updated = send(HttpMethod.PATCH, "/investments/{id}",
            Map.of("color", "#FF0000", "price", 35.42, "ticker", "XYZ", "sequence", 9), schd.getId())
            .expectStatus().isOk()
            .expectBody(InvestmentDto.class).returnResult().getResponseBody();

        assertThat(updated.getColor()).isEqualTo("#ff0000");
        assertThat(updated.getPrice()).isEqualByComparingTo("35.42");
        assertThat(updated.getCategory()).isEqualTo("Dividend");
        assertThat(updated.getTicker()).isEqualTo("SCHD");
        assertThat(updated.getSequence()).isEqualTo(1);
        assertThat(investmentRepository.findById(schd.getId()).block().getColor()).isEqualTo("#ff0000");
    }

    @Test
    void patchInvestmentRejectsInvalidValuesAndUnknownInvestments() {
        send(HttpMethod.PATCH, "/investments/{id}", Map.of("color", "red"), schd.getId()).expectStatus().isBadRequest();
        send(HttpMethod.PATCH, "/investments/{id}", Map.of("price", -1), schd.getId()).expectStatus().isBadRequest();
        send(HttpMethod.PATCH, "/investments/{id}", Map.of("category", "Growth"), UNKNOWN_ID).expectStatus().isNotFound();
    }

    @Test
    void deleteInvestmentRemovesItAndItsPositions() {
        client.delete().uri("/investments/{id}", schd.getId()).exchange().expectStatus().isNoContent();

        assertThat(investmentRepository.existsById(schd.getId()).block()).isFalse();
        assertThat(positionRepository.count().block()).isZero();
        client.delete().uri("/investments/{id}", schd.getId()).exchange().expectStatus().isNotFound();
    }

    @Test
    void putOrderRenumbersInvestmentsPuttingTheOnesLeftOutLast() {
        Investment vti = investmentRepository.save(investment("VTI", null)).block();

        List<InvestmentDto> ordered = send(HttpMethod.PUT, "/investments/order", List.of(spmo.getId(), UNKNOWN_ID))
            .expectStatus().isOk()
            .expectBodyList(InvestmentDto.class).returnResult().getResponseBody();

        assertThat(ordered).extracting(InvestmentDto::getTicker).containsExactly("SPMO", "SCHD", "VTI");
        assertThat(ordered).extracting(InvestmentDto::getSequence).containsExactly(1, 2, 3);
        assertThat(investmentRepository.findById(vti.getId()).block().getSequence()).isEqualTo(3);
    }

    @Test
    void putPositionUpdatesTheSharesOfAnExistingPosition() {
        PositionDto saved = send(HttpMethod.PUT, "/positions", Map.of("accountId", roth.getId(), "investmentId", schd.getId(), "shares", 600))
            .expectStatus().isOk()
            .expectBody(PositionDto.class).returnResult().getResponseBody();

        assertThat(saved.getPositionId()).isEqualTo(rothSchd.getId());
        assertThat(saved.getShares()).isEqualByComparingTo("600");
        assertThat(positionRepository.count().block()).isEqualTo(1);
    }

    @Test
    void putPositionAddsAPositionTheAccountDoesNotHoldYet() {
        PositionDto saved = send(HttpMethod.PUT, "/positions", Map.of("accountId", brokerage.getId(), "investmentId", spmo.getId(), "shares", 10))
            .expectStatus().isOk()
            .expectBody(PositionDto.class).returnResult().getResponseBody();

        assertThat(saved.getPositionId()).isNotNull().isNotEqualTo(rothSchd.getId());
        assertThat(saved.getAccountId()).isEqualTo(brokerage.getId());
        assertThat(saved.getShares()).isEqualByComparingTo("10");
        assertThat(positionRepository.count().block()).isEqualTo(2);
    }

    @Test
    void putPositionRejectsMissingOrNegativeValuesAndUnknownIds() {
        send(HttpMethod.PUT, "/positions", Map.of("accountId", roth.getId(), "shares", 1)).expectStatus().isBadRequest();
        send(HttpMethod.PUT, "/positions", Map.of("accountId", roth.getId(), "investmentId", schd.getId())).expectStatus().isBadRequest();
        send(HttpMethod.PUT, "/positions", Map.of("accountId", roth.getId(), "investmentId", schd.getId(), "shares", -1)).expectStatus().isBadRequest();
        send(HttpMethod.PUT, "/positions", Map.of("accountId", UNKNOWN_ID, "investmentId", schd.getId(), "shares", 1)).expectStatus().isNotFound();
        send(HttpMethod.PUT, "/positions", Map.of("accountId", roth.getId(), "investmentId", UNKNOWN_ID, "shares", 1)).expectStatus().isNotFound();

        assertThat(positionRepository.findById(rothSchd.getId()).block().getShares()).isEqualByComparingTo("503.215");
    }

    private <T> List<T> getList(String uri, Class<T> type) {
        return client.get().uri(uri).exchange()
            .expectStatus().isOk()
            .expectBodyList(type).returnResult().getResponseBody();
    }

    private WebTestClient.ResponseSpec send(HttpMethod method, String uri, Object body, Object... uriVariables) {
        return client.method(method).uri(uri, uriVariables).bodyValue(body).exchange();
    }

    private static Account account(String name, String cash) {
        Account account = new Account();
        account.setName(name);
        account.setCash(new BigDecimal(cash));
        return account;
    }

    private static Investment investment(String ticker, Integer sequence) {
        Investment investment = new Investment();
        investment.setTicker(ticker);
        investment.setCategory("Dividend");
        investment.setColor("#2383a9");
        investment.setPrice(new BigDecimal("32.72"));
        investment.setSequence(sequence);
        return investment;
    }

    private static Position position(Account account, Investment investment, String shares) {
        Position position = new Position();
        position.setAccountId(account.getId());
        position.setInvestmentId(investment.getId());
        position.setShares(new BigDecimal(shares));
        return position;
    }

}
