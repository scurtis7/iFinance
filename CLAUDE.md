# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

iFinance is a budgeting and stock portfolio management app, split into two independent projects with no shared build:

- `fin-server/` — Java 21, Spring Boot 4 (Maven, `com.scurtis.finance`)
- `fin-client/` — Angular 18 SPA (npm)

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

To start, the server requires `SPRING_R2DBC_URL`, `SPRING_R2DBC_USERNAME` and `SPRING_R2DBC_PASSWORD` (PostgreSQL). `config/PostgresR2dbc` asserts all three at startup, so a missing value fails fast. Health check: `GET /actuator/health`.

Custom app properties use the `scurtis.*` prefix, bound by `config/AppConfig` (for example `scurtis.app-version`).

### Architecture notes

- **Fully reactive stack**: WebFlux plus Spring Data **R2DBC**, not Spring MVC or JPA. Controllers and repositories should return `Mono`/`Flux`, and blocking JDBC calls must not be used.
- Tests run with `@ActiveProfiles("test")`, which loads `src/test/resources/application-test.yml` and points R2DBC at an in-memory H2 database (`r2dbc:h2:mem`). No Postgres is needed for tests.
- CORS is open globally (`config/CorsGlobalConfig`) so the Angular dev server can call the API.
- Lombok is used (`@Getter`, `@Setter`, `@Slf4j`, etc.).

### Style (Checkstyle: `config/checkstyle/checkstyle.xml`, applies to test sources too)

- 4-space indentation, 200-character line limit, no tabs, no star imports.
- Import order: third-party imports first, then a blank line, then static imports, each group sorted alphabetically.
- Braces are required on all blocks, and `switch` statements need a `default`.

## fin-client

### Commands

```bash
npm start                               # ng serve at http://localhost:4200
npm run build                           # production build to dist/
npm test                                # Karma + Jasmine
npx ng test --include='**/foo.spec.ts'  # single spec file
npx ng generate component components/<name>
```

### Architecture notes

- Standalone components only (no NgModules). App bootstrap is in `app.config.ts`, and routes are in `app.routes.ts`, where unknown paths redirect to `home`.
- Components live in `src/app/components/<name>/` and use the `app-` selector prefix, with separate `.html`/`.scss`/`.ts` files.
- SCSS: the global color palette (`$ink-black-*`, `$dark-teal-*`, `$air-force-blue-*`, `$ash-grey-*`, `$beige-*`, shades 50–950) is in `src/assets/styles/variables.scss`. Use these variables instead of hard-coded colors.
- 2-space indentation (`.editorconfig`).
