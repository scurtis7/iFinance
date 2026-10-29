// JSON returned by fin-server. Fields are nullable where the database column allows null.

export interface AccountDto {
  accountId: number;
  name: string;
  cash: number | null;
}

export interface InvestmentDto {
  investmentId: number;
  ticker: string;
  category: string | null;
  color: string | null;
  price: number | null;
  sequence: number | null;
}

export interface PositionDto {
  positionId: number;
  accountId: number;
  investmentId: number;
  shares: number | null;
}
