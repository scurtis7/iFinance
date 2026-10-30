# Finance Server

Finance Server handles the backend business logic for iFinance.

## Stack

The Finance Server is built on top of a few core technologies:

* Java 21
* [Spring Boot](https://spring.io/projects/spring-boot) (4.0.0+), using WebFlux and R2DBC
* [PostgreSQL](https://www.postgresql.org) (42.7.11+)
* [Maven](https://maven.apache.org) (3.0.0+)

# Technologies

![Java](https://img.shields.io/badge/Java-ED8B00?style=plastic&logo=java&logoColor=white)
![Spring Boot Badge](https://img.shields.io/badge/Spring%20Boot-6DB33F?logo=springboot&logoColor=white&style=plastic)
![PostgreSQL Badge](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=plastic)
![Apache Maven Badge](https://img.shields.io/badge/Apache%20Maven-C71A36?logo=apachemaven&logoColor=white&style=plastic)

## Build

To build the Finance Server without running tests:

`./mvnw clean compile`

To build the Finance Server and run tests:

`./mvnw clean test`

To build the Finance Server, run tests, and check code coverage and Checkstyle:

`./mvnw clean verify`

The `verify` build fails if any class other than `Application` has under 80% line coverage.

The tests use an in-memory H2 database, so they don't need PostgreSQL or any of the environment variables below.

## Run

To run the Finance Server, which listens on port 8080 by default:

`./mvnw spring-boot:run`

## Environment

In order to run the Finance Server the following environment variables must be set. The server won't start if any of them is missing.

| VARIABLE                         | Description                                               |
|:---------------------------------|:----------------------------------------------------------|
| SPRING_R2DBC_URL                 | The URL to the Postgresql database                        |
| SPRING_R2DBC_USERNAME            | Username for the Postgresql database                      |
| SPRING_R2DBC_PASSWORD            | Password for the Postgresql database                      |
| SCURTIS_STOCK_PROVIDER           | The stock price provider: `finnhub` or `alpha-vantage`    |
| SCURTIS_STOCK_FINNHUBAPIKEY      | API key for Finnhub                                       |
| SCURTIS_STOCK_ALPHAVANTAGEAPIKEY | API key for Alpha Vantage                                 |

Both API keys must be set whichever provider is selected.

## Database

The tables are in the `finance` schema, and there is no migration tool. `database/FinanceDB.sql` at the root of the repository has the scripts for the tables and is run by hand. The tests create their tables from `src/test/resources/schema.sql`, so a schema change has to be made in both files.

## Endpoints

A brief description of the endpoints can be found in this section.

A request with an invalid value returns `400`, and one naming an unknown account or investment returns `404`. The order endpoints are the exception, as they ignore unknown ids.

### Account Endpoints

| Method | Url                   | Description                                                                                        |
|:-------|:----------------------|:---------------------------------------------------------------------------------------------------|
| GET    | /accounts             | Returns all accounts                                                                               |
| PATCH  | /accounts/{accountId} | Sets the account's `cash`, which is the only thing about an account that can be changed            |
| PUT    | /accounts/order       | Numbers the accounts in the order of the ids in the request body and returns them all in that order |
| GET    | /account/positions    | Returns each account with its positions, including the details of each investment                  |

### Investment Endpoints

| Method | Url                         | Description                                                                                                                 |
|:-------|:----------------------------|:----------------------------------------------------------------------------------------------------------------------------|
| GET    | /investments                | Returns all investments                                                                                                     |
| POST   | /investments                | Adds an investment after the others and returns `201`, or `409` if the `ticker` already exists                              |
| PATCH  | /investments/{investmentId} | Sets whichever of `category`, `color` and `price` the request includes                                                      |
| DELETE | /investments/{investmentId} | Deletes the investment along with its positions in every account and returns `204`                                          |
| PUT    | /investments/order          | Numbers the investments in the order of the ids in the request body and returns them all in that order                      |
| POST   | /investments/prices/refresh | Fetches a quote for each investment, saves it and returns all investments. An investment whose quote fails keeps its price |

### Position Endpoints

| Method | Url        | Description                                                                                                       |
|:-------|:-----------|:------------------------------------------------------------------------------------------------------------------|
| GET    | /positions | Returns all positions                                                                                             |
| PUT    | /positions | Sets the `shares` that `accountId` holds of `investmentId`, adding the position if the account doesn't hold it yet |

### HSA Endpoints

| Method | Url  | Description                                         |
|:-------|:-----|:----------------------------------------------------|
| GET    | /hsa | Returns the HSA `balance`, which is zero until saved |
| PUT    | /hsa | Sets the HSA `balance`                              |

### Health Check Endpoint

To verify the app is up and running you can call the health endpoint below

| Method | Url              | Description                                                    |
|:-------|:-----------------|:---------------------------------------------------------------|
| GET    | /actuator/health | Returns `UP` or `DOWN` status of the application, with details |
