import { computed, Injectable, signal } from '@angular/core';
import { Account, AccountId, AccountSummary, Investment } from '../models/portfolio.model';

export const ACCOUNT_IDS: AccountId[] = ['brokerage', 'traditional', 'roth'];
export const HOLDINGS_ORDER_KEY = 'ifinance.holdingsOrder';
export const HOLDINGS_COLORS_KEY = 'ifinance.holdingsColors';

/**
 * Default ticker colors, handed out in order to tickers that don't have one yet.
 * Hex values of variables.scss swatches: dark-teal-600, beige-500, air-force-blue-500, ink-black-400, ash-grey-600, beige-700.
 */
export const TICKER_COLORS = ['#2383a9', '#99c639', '#618e9e', '#39c3f9', '#57755a', '#5c7722'];

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

  readonly investments = signal<Investment[]>(applySavedColors(applySavedOrder([
    { ticker: 'SPYM', category: 'Foundation', price: 90.60, color: TICKER_COLORS[0], shares: { brokerage: 0, traditional: 501.338, roth: 100.268 } },
    { ticker: 'SCHD', category: 'Dividend', price: 32.72, color: TICKER_COLORS[1], shares: { brokerage: 0, traditional: 3016.075, roth: 503.215 } },
    { ticker: 'SPMO', category: 'Growth', price: 153.23, color: TICKER_COLORS[2], shares: { brokerage: 0, traditional: 227.321, roth: 127.321 } }
  ])));

  readonly hsa = signal(18.15);

  readonly summaries = computed<AccountSummary[]>(() =>
    this.accounts().map(account => {
      const holdings = this.investments()
        .filter(inv => inv.shares[account.id] > 0)
        .map(inv => ({
          ticker: inv.ticker,
          category: inv.category,
          price: inv.price,
          color: inv.color,
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

  /** Ignores anything that isn't a six-digit hex color such as `#2383a9`. */
  setColor(ticker: string, color: string): void {
    if (!isHexColor(color)) {
      return;
    }
    this.updateInvestment(ticker, inv => ({ ...inv, color: color.toLowerCase() }));
    this.saveColors();
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
      { ticker: symbol, category: category.trim(), price, color: this.nextDefaultColor(), shares: { brokerage: 0, traditional: 0, roth: 0 } }
    ]);
    this.saveOrder();
    this.saveColors();
    return true;
  }

  removeInvestment(ticker: string): void {
    this.investments.update(list => list.filter(inv => inv.ticker !== ticker));
    this.saveOrder();
    this.saveColors();
  }

  /** Moves the investment at one index to another and remembers the new order. */
  moveInvestment(from: number, to: number): void {
    if (from === to) {
      return;
    }
    this.investments.update(list => {
      const reordered = [...list];
      reordered.splice(to, 0, ...reordered.splice(from, 1));
      return reordered;
    });
    this.saveOrder();
  }

  /** The first default color no ticker is using, or the next one in rotation once they're all taken. */
  private nextDefaultColor(): string {
    const used = new Set(this.investments().map(inv => inv.color));
    return TICKER_COLORS.find(color => !used.has(color)) ?? TICKER_COLORS[this.investments().length % TICKER_COLORS.length];
  }

  private saveOrder(): void {
    writeStored(HOLDINGS_ORDER_KEY, this.investments().map(inv => inv.ticker));
  }

  private saveColors(): void {
    writeStored(HOLDINGS_COLORS_KEY, Object.fromEntries(this.investments().map(inv => [inv.ticker, inv.color])));
  }

  private updateInvestment(ticker: string, change: (inv: Investment) => Investment): void {
    this.investments.update(list => list.map(inv => (inv.ticker === ticker ? change(inv) : inv)));
  }
}

/** Sorts investments by the saved ticker order; tickers without a saved position keep their order at the end. */
function applySavedOrder(investments: Investment[]): Investment[] {
  const order = readStored(HOLDINGS_ORDER_KEY);
  if (!Array.isArray(order)) {
    return investments;
  }
  const rank = (ticker: string) => {
    const index = order.indexOf(ticker);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...investments].sort((a, b) => rank(a.ticker) - rank(b.ticker));
}

/** Replaces default colors with any valid saved ones. */
function applySavedColors(investments: Investment[]): Investment[] {
  const colors = readStored(HOLDINGS_COLORS_KEY);
  if (!colors || typeof colors !== 'object' || Array.isArray(colors)) {
    return investments;
  }
  return investments.map(inv => {
    const saved = (colors as Record<string, unknown>)[inv.ticker];
    return isHexColor(saved) ? { ...inv, color: saved.toLowerCase() } : inv;
  });
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

/** Storage can be unavailable (private mode, blocked site data) or hold bad JSON; either way, act as if nothing is saved. */
function readStored(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing to do; the preference just won't persist.
  }
}

function percentOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}
