# Finance Server

Finance Server will handle backend business logic for iFinance.

## Stack

The Finance Server is built on top of a few core technologies:

* Java 21
* [Spring Boot](https://spring.io/projects/spring-boot) (4.0.0+)
* [PostgreSQL](https://www.postgresql.org) (42.7.11+)
* [Maven](https://maven.apache.org) (3.0.0+)

# Technologies

![Java](https://img.shields.io/badge/Java-ED8B00?style=plastic&logo=java&logoColor=white)
![Spring Boot Badge](https://img.shields.io/badge/Spring%20Boot-6DB33F?logo=springboot&logoColor=white&style=plastic)
![PostgreSQL Badge](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white&style=plastic)
![Apache Maven Badge](https://img.shields.io/badge/Apache%20Maven-C71A36?logo=apachemaven&logoColor=white&style=plastic)

## Build

To build the Finance Server without running tests:

`mvn clean compile`

To build the Finance Server and run tests:

`mvn clean test`

To build the Finance Server and generate code coverage:

`mvn clean verify`

## Environment

In order to run the Finance Server the following environment variables must be set:

| VARIABLE              | Description                          |
|:----------------------|:-------------------------------------|
| SPRING_R2DBC_URL      | The URL to the Postgresql database   |
| SPRING_R2DBC_USERNAME | Username for the Postgresql database |
| SPRING_R2DBC_PASSWORD | Password for the Postgresql database |

## Endpoints

A brief description of the endpoints can be found in this section.

### REST Endpoint

This endpoint will be called to...

| Method | Url           | Description |
|:-------|:--------------|:------------|
| GET    | .../endpoint/ | Returns ... |

### Health Check Endpoint

To verify the app is up and running you can call the health endpoint below

| Method | Url                  | Description                                      |
|:-------|:---------------------|:-------------------------------------------------|
| GET    | .../actuator/health/ | Returns `up` or `down` status of the application |
