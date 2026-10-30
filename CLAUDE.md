# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

iFinance is a budgeting and stock portfolio management app, split into two independent projects with no shared build:

- `fin-server/` — Java 21, Spring Boot 4 (Maven, `com.scurtis.finance`)
- `fin-client/` — Angular 18 SPA (npm)
- `database/FinanceDB.sql` — hand-run PostgreSQL scratch script, not part of either build

Run commands from inside the relevant subdirectory.

## fin-server

### Commands

```bash
./mvnw clean compile                 # build without tests
./mvnw clean test                    # build + tests
./mvnw clean verify                  # tests + JaCoCo coverage check + Checkstyle
./mvnw test -Dtest=ApplicationTests  # single test class (append #method for one method)
./mvnw checkstyle:check              # lint only
./mvnw spring-boot:run               # run (needs DB env vars below)
```

`verify` fails if any class (other than `Application`) has under 80% line coverage, so new classes need tests.

### Runtime config

To start, the server requires the values below, none of which have defaults. A missing one fails startup.

- `SPRING_R2DBC_URL`, `SPRING_R2DBC_USERNAME` and `SPRING_R2DBC_PASSWORD` (PostgreSQL), asserted by `config/PostgresR2dbc`.
- `SCURTIS_STOCK_PROVIDER` (`finnhub` or `alpha-vantage`), `SCURTIS_STOCK_FINNHUBAPIKEY` and `SCURTIS_STOCK_ALPHAVANTAGEAPIKEY`, asserted by `config/AppConfig`. Both API keys are required whichever provider is selected.

Health check: `GET /actuator/health`.

Custom app properties use the `scurtis.*` prefix, bound by `config/AppConfig` (for example `scurtis.app-version`).

### Architecture notes

- **Fully reactive stack**: WebFlux plus Spring Data **R2DBC**, not Spring MVC or JPA. Controllers and repositories should return `Mono`/`Flux`, and blocking JDBC calls must not be used.
- Requests flow from `controller/FinanceController` (every endpoint, at the root path with no `/api` prefix) to `service/FinanceService` or `service/StockService`, then to `repository/*`. `converter/FinanceConverter` maps entities to `dto/*`, and errors are raised as `ResponseStatusException`.
- Entities use `@Table(schema = "finance", ...)` and implement `Persistable<Long>`.
- **There is no migration tool.** A schema change has to be made in both `database/FinanceDB.sql` (applied to Postgres by hand) and `src/test/resources/schema.sql` (its H2-syntax copy, which the tests create their tables from).
- `database/FinanceDB.sql` contains `DROP TABLE`s and seed data, and is wrapped in `BEGIN`/`ROLLBACK` so that running the whole file changes nothing. Don't run pieces of it against a real database unless asked.
- Stock quotes come from `provider/StockPriceProvider`, with Finnhub and Alpha Vantage implementations chosen at startup by `config/StockConfig`. A new provider needs a case there and its API key in `AppConfig.Stock`.
- Tests run with `@ActiveProfiles("test")`, which loads `src/test/resources/application-test.yml` and points R2DBC at an in-memory H2 database (`r2dbc:h2:mem`). No Postgres is needed for tests.
- `FinanceControllerTest` calls the endpoints through WebFlux and R2DBC against H2 rather than mocking them. Provider tests stub HTTP with `WebClient.builder().exchangeFunction(...)`.
- CORS is open globally (`config/CorsGlobalConfig`) so the Angular dev server can call the API.
- Lombok is used (`@Getter`, `@Setter`, `@Slf4j`, etc.).

### Style (Checkstyle: `config/checkstyle/checkstyle.xml`, applies to test sources too)

- 4-space indentation, 200-character line limit, no tabs, no star imports.
- Import order: third-party imports first, then a blank line, then static imports, each group sorted alphabetically.
- Braces are required on all blocks, and `switch` statements need a `default`.
- Wrapped lines break before `.` and binary operators, and overloaded methods must be next to each other.

## fin-client

### Commands

```bash
npm start                                            # ng serve at http://localhost:4200
npm run build                                        # production build to dist/
npm test                                             # Karma + Jasmine, keeps watching until stopped
npx ng test --watch=false --browsers=ChromeHeadless  # run all specs once and exit
npx ng test --include='**/foo.spec.ts'               # single spec file
npx ng generate component components/<name> --skip-tests
```

### Architecture notes

- Standalone components only (no NgModules). App bootstrap is in `app.config.ts`, and routes are in `app.routes.ts`, where unknown paths redirect to `home`, currently the only route.
- Components live in `src/app/components/<name>/` and use the `app-` selector prefix, with separate `.html`/`.scss`/`.ts` files. They use `inject()`, signal `input()`s and `@if`/`@for` control flow.
- `services/portfolio.service.ts` holds the app state as signals, and components work through it. Only it calls `services/finance-api.service.ts`, which has one method per server endpoint.
- `models/api.model.ts` is the server's JSON and `models/portfolio.model.ts` is the shape the UI uses. `PortfolioService` converts between them.
- Edits are optimistic: `PortfolioService` updates the signal first, then `save()` sends the request and, if it fails, undoes the change and sets an error signal. New edits should do the same.
- The server URL is the `API_URL` injection token in `finance-api.service.ts`, which defaults to `http://localhost:8080`. Specs override it.
- Drag-to-reorder uses `@angular/cdk/drag-drop`.
- `services/portfolio.service.spec.ts` is the only spec, using `HttpTestingController`. Components have no specs, hence `--skip-tests` above.
- SCSS: the global color palette (`$ink-black-*`, `$dark-teal-*`, `$air-force-blue-*`, `$ash-grey-*`, `$beige-*`, shades 50–950) is in `src/assets/styles/variables.scss`, which component stylesheets pull in with `@import "../../../assets/styles/variables";`. Use these variables instead of hard-coded colors.
- 2-space indentation and a 200-character line limit (`.editorconfig`).
