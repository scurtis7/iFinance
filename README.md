# iFinance

iFinance is a budgeting and stock portfolio management application. It tracks the cash and holdings in each account along with an HSA balance, and gets stock quotes from Finnhub or Alpha Vantage.

## Stack

![Java](https://img.shields.io/badge/Java-ED8B00?style=plastic&logo=java&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?logo=springboot&logoColor=white&style=plastic)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=plastic)
![Apache Maven](https://img.shields.io/badge/Apache%20Maven-C71A36?logo=apachemaven&logoColor=white&style=plastic)
![Angular](https://img.shields.io/badge/Angular-0F0F11?logo=angular&logoColor=fff&style=plastic)

<!--
  https://badges.pages.dev
  https://github.com/alexandresanlim/Badges4-README.md-Profile#%E2%80%8D-static
-->

* Java 21
* [Maven](https://maven.apache.org), through the included wrapper (`./mvnw`)
* [Spring Boot](https://spring.io/projects/spring-boot) (4.0.0+)
* [PostgreSQL](https://www.postgresql.org)
* [Angular](https://v18.angular.dev/overview) (18+)
* [Node.js](https://nodejs.org) (18.19.1+, 20.11.1+ or 22+)

## Project layout

The server and client are separate projects that build independently.

| Path                               | Description                                              |
|:-----------------------------------|:---------------------------------------------------------|
| [fin-server](fin-server/README.md) | The backend, a REST API on port 8080                     |
| [fin-client](fin-client/README.md) | The web UI, with a dev server on port 4200               |
| database/FinanceDB.sql             | PostgreSQL scripts for the tables, which are run by hand |

## Getting started

1. Create a PostgreSQL database with a `finance` schema and its tables, using the scripts in `database/FinanceDB.sql`. The file ends in `ROLLBACK`, so running all of it changes nothing. Run the statements you need individually, and watch for the `DROP TABLE`s.
2. Set the environment variables listed in the [Finance Server README](fin-server/README.md#environment), then start the server from `fin-server`:

   `./mvnw spring-boot:run`

3. Start the client from `fin-client`, then navigate to `http://localhost:4200/`:

   `npm install`

   `npm start`
