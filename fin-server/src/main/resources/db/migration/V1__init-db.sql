CREATE SCHEMA IF NOT EXISTS ifinance;

CREATE TABLE IF NOT EXISTS ifinance.category (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(64) UNIQUE NOT NULL,
    created_date DATE DEFAULT CURRENT_DATE
);
