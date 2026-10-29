/** The server's `accountId`. */
export type AccountId = number;

export interface Account {
  id: AccountId;
  name: string;
  cash: number;
}

export interface Investment {
  /** The server's `investmentId`. */
  id: number;
  ticker: string;
  category: string;
  price: number;
  /** Hex color, e.g. `#2383a9`, used for the ticker's allocation bar segment and dot. */
  color: string;
  shares: Record<AccountId, number>;
}

export interface Position {
  ticker: string;
  category: string;
  color: string;
  price: number;
  shares: number;
  value: number;
  percent: number;
}

export interface AccountSummary {
  account: Account;
  cashPercent: number;
  positions: Position[];
  total: number;
}
