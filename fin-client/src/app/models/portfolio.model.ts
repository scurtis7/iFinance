export type AccountId = 'brokerage' | 'traditional' | 'roth';

export interface Account {
  id: AccountId;
  name: string;
  cash: number;
}

export interface Investment {
  ticker: string;
  category: string;
  price: number;
  shares: Record<AccountId, number>;
}

export interface Position {
  ticker: string;
  category: string;
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
