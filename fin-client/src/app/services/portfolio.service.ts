import { computed, Injectable, signal } from '@angular/core';
import { Account, AccountId, AccountSummary, Investment } from '../models/portfolio.model';

export const ACCOUNT_IDS: AccountId[] = ['brokerage', 'traditional', 'roth'];

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  // Seed data mirrors the current spreadsheet until the server API exists.
  readonly accounts = signal<Account[]>([
    { id: 'brokerage', name: 'Brokerage', cash: 3819.69 },
    { id: 'traditional', name: 'Traditional', cash: 166872.61 },
    { id: 'roth', name: 'Roth', cash: 51989.58 }
  ]);

  readonly investments = signal<Investment[]>([
    { ticker: 'SPYM', category: 'Foundation', price: 90.60, shares: { brokerage: 0, traditional: 501.338, roth: 100.268 } },
    { ticker: 'SCHD', category: 'Dividend', price: 32.72, shares: { brokerage: 0, traditional: 3016.075, roth: 503.215 } },
    { ticker: 'SPMO', category: 'Growth', price: 153.23, shares: { brokerage: 0, traditional: 227.321, roth: 127.321 } }
  ]);

  readonly hsa = signal(18.15);

  readonly summaries = computed<AccountSummary[]>(() =>
    this.accounts().map(account => {
      const holdings = this.investments()
        .filter(inv => inv.shares[account.id] > 0)
        .map(inv => ({
          ticker: inv.ticker,
          category: inv.category,
          price: inv.price,
          shares: inv.shares[account.id],
          value: inv.price * inv.shares[account.id]
        }));
      const total = account.cash + holdings.reduce((sum, h) => sum + h.value, 0);
      return {
        account,
        cashPercent: percentOf(account.cash, total),
        positions: holdings.map(h => ({ ...h, percent: percentOf(h.value, total) })),
        total
      };
    })
  );

  readonly grandTotal = computed(() =>
    this.summaries().reduce((sum, s) => sum + s.total, 0) + this.hsa()
  );

  setCash(id: AccountId, cash: number): void {
    this.accounts.update(accounts => accounts.map(a => (a.id === id ? { ...a, cash } : a)));
  }

  setPrice(ticker: string, price: number): void {
    this.updateInvestment(ticker, inv => ({ ...inv, price }));
  }

  setCategory(ticker: string, category: string): void {
    this.updateInvestment(ticker, inv => ({ ...inv, category }));
  }

  setShares(ticker: string, id: AccountId, shares: number): void {
    this.updateInvestment(ticker, inv => ({ ...inv, shares: { ...inv.shares, [id]: shares } }));
  }

  setHsa(value: number): void {
    this.hsa.set(value);
  }

  /** Returns false when the ticker is blank or already present. */
  addInvestment(ticker: string, category: string, price: number): boolean {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol || this.investments().some(inv => inv.ticker === symbol)) {
      return false;
    }
    this.investments.update(list => [
      ...list,
      { ticker: symbol, category: category.trim(), price, shares: { brokerage: 0, traditional: 0, roth: 0 } }
    ]);
    return true;
  }

  removeInvestment(ticker: string): void {
    this.investments.update(list => list.filter(inv => inv.ticker !== ticker));
  }

  private updateInvestment(ticker: string, change: (inv: Investment) => Investment): void {
    this.investments.update(list => list.map(inv => (inv.ticker === ticker ? change(inv) : inv)));
  }
}

function percentOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}
