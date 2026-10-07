/***********************************************************************
    Finance Database SQL Scripts
************************************************************************/
select * from financedb.finance.account;
select * from financedb.finance.investment;
select * from financedb.finance.position;

select a.name, a.cash, i.ticker, i.category, i.color, i.price, p.shares
    from financedb.finance.position p
    join finance.account a on a.account_id = p.account_id
    join finance.investment i on i.investment_id = p.investment_id;

select a.name, a.cash, i.ticker, i.category, i.color, i.price, p.shares
    from financedb.finance.account a
    join finance.position p on a.account_id = p.account_id
    join finance.investment i on i.investment_id = p.investment_id;

/***********************************************************************
    Update scripts
************************************************************************/
BEGIN;  -- Begin a transaction in case the entire script gets executed

--     drop database financedb;
--     create database financedb;
--     CREATE SCHEMA IF NOT EXISTS "finance";

--     DROP TABLE IF EXISTS finance.position;
--     DROP TABLE IF EXISTS finance.investment;
--     DROP TABLE IF EXISTS finance.account;

--     CREATE TABLE finance.account (
--         account_id   SERIAL PRIMARY KEY,
--         name         VARCHAR(32) UNIQUE NOT NULL,
--         cash         NUMERIC(12, 4),
--         created_date DATE DEFAULT CURRENT_DATE
--     );
--     INSERT INTO finance.account (name, cash)
--     VALUES ('Brokerage', 3819.69),
--            ('Traditional', 166872.61),
--            ('Roth', 51989.58);

    CREATE TABLE finance.investment (
        investment_id   SERIAL PRIMARY KEY,
        ticker          VARCHAR(32) UNIQUE NOT NULL,
        category        VARCHAR(64),
        color           VARCHAR(16),
        price           NUMERIC(7, 4),
        created_date    DATE DEFAULT CURRENT_DATE
    );
    INSERT INTO finance.investment (ticker, category, color, price)
    VALUES ('SCHD', 'Dividend', '#2383a9', 32.72),
           ('SPMO', 'Growth', '#99c639', 153.23),
           ('SPYM', 'Foundation', '#39c3f9', 90.60);

    CREATE TABLE finance.position (
        position_id     SERIAL PRIMARY KEY,
        account_id      INT,
        investment_id   INT,
        shares          NUMERIC(12, 4),
        created_date    DATE DEFAULT CURRENT_DATE,
        CONSTRAINT fk_position_account
            FOREIGN KEY (account_id)
            REFERENCES finance.account (account_id),
        CONSTRAINT fk_position_investment
            FOREIGN KEY (investment_id)
            REFERENCES finance.investment (investment_id)
    );

    INSERT INTO finance.position (account_id, investment_id, shares)
    VALUES (2, 1, 3016.075),
           (2, 2, 227.321),
           (2, 3, 501.338),
           (3, 1, 503.215),
           (3, 2, 127.321),
           (3, 3, 100.268);


ROLLBACK;   -- Rollback the transaction in case the entire script gets executed
