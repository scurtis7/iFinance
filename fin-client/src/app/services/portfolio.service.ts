import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, Observable, tap, throwError } from 'rxjs';
import { AccountDto, InvestmentChanges, InvestmentDto, PositionDto } from '../models/api.model';
import { Account, AccountId, AccountSummary, Investment } from '../models/portfolio.model';
import { FinanceApiService } from './finance-api.service';

/**
 * Default ticker colors, handed out in order to tickers that don't have one yet.
 * Hex values of variables.scss swatches: dark-teal-600, beige-500, air-force-blue-500, ink-black-400, ash-grey-600, beige-700.
 */
export const TICKER_COLORS = ['#2383a9', '#99c639', '#618e9e', '#39c3f9', '#57755a', '#5c7722'];

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private readonly api = inject(FinanceApiService);
  /** Each ticker's color from before its current preview, so a failed save can put it back. */
  private readonly colorsBeforePreview = new Map<string, string>();

  readonly accounts = signal<Account[]>([]);
  readonly investments = signal<Investment[]>([]);
  readonly hsa = signal(0);

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly saveError = signal('');
  readonly refreshingPrices = signal(false);
  readonly refreshError = signal('');

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

  /** Replaces accounts, investments and the HSA balance with the server's. */
  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    forkJoin([this.api.getAccounts(), this.api.getInvestments(), this.api.getPositions(), this.api.getHsa()])
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([accountDtos, investmentDtos, positionDtos, hsaDto]) => {
          const accounts = toAccounts(accountDtos);
          this.accounts.set(accounts);
          this.investments.set(toInvestments(investmentDtos, accounts, positionDtos));
          this.hsa.set(hsaDto.balance ?? 0);
        },
        error: () => this.loadError.set('Couldn\'t load the portfolio from the server.')
      });
  }

  /** Has the server fetch current quotes, then updates the price of each ticker it returns. */
  refreshPrices(): void {
    this.refreshingPrices.set(true);
    this.refreshError.set('');
    this.api.refreshPrices()
      .pipe(finalize(() => this.refreshingPrices.set(false)))
      .subscribe({
        next: dtos => {
          const prices = new Map(dtos.filter(dto => dto.price !== null).map(dto => [dto.ticker, dto.price as number]));
          this.investments.update(list => list.map(inv => {
            const price = prices.get(inv.ticker);
            return price === undefined ? inv : { ...inv, price };
          }));
        },
        error: () => this.refreshError.set('Couldn\'t refresh prices.')
      });
  }

  setCash(id: AccountId, cash: number): void {
    const account = this.accounts().find(a => a.id === id);
    if (!account || account.cash === cash) {
      return;
    }
    // Only changes the cash if it still holds `from`, so undoing a failed save never overwrites a newer edit.
    const change = (from: number, to: number) =>
      this.accounts.update(accounts => accounts.map(a => (a.id === id && a.cash === from ? { ...a, cash: to } : a)));
    change(account.cash, cash);
    this.save(this.api.updateAccount(id, { cash }), () => change(cash, account.cash), `Couldn't save the ${account.name} cash.`);
  }

  setPrice(ticker: string, price: number): void {
    this.saveInvestmentField(ticker, 'price', price);
  }

  setCategory(ticker: string, category: string): void {
    this.saveInvestmentField(ticker, 'category', category.trim());
  }

  /** Shows a color while it's being picked; saveColor() stores it. Ignores anything that isn't a six-digit hex color. */
  previewColor(ticker: string, color: string): void {
    const investment = this.findInvestment(ticker);
    if (!investment || !isHexColor(color)) {
      return;
    }
    if (!this.colorsBeforePreview.has(ticker)) {
      this.colorsBeforePreview.set(ticker, investment.color);
    }
    this.updateInvestment(ticker, inv => ({ ...inv, color: color.toLowerCase() }));
  }

  /** Saves the color previewed for a ticker, if it ended up different from where it started. */
  saveColor(ticker: string): void {
    const investment = this.findInvestment(ticker);
    const before = this.colorsBeforePreview.get(ticker);
    this.colorsBeforePreview.delete(ticker);
    if (investment && before !== undefined && before !== investment.color) {
      this.sendInvestmentField(investment, 'color', investment.color, before);
    }
  }

  setShares(ticker: string, id: AccountId, shares: number): void {
    const investment = this.findInvestment(ticker);
    const account = this.accounts().find(a => a.id === id);
    if (!investment || !account || investment.shares[id] === shares) {
      return;
    }
    const previous = investment.shares[id];
    const change = (from: number, to: number) =>
      this.updateInvestment(ticker, inv => (inv.shares[id] === from ? { ...inv, shares: { ...inv.shares, [id]: to } } : inv));
    change(previous, shares);
    this.save(
      this.api.savePosition({ accountId: id, investmentId: investment.id, shares }),
      () => change(shares, previous),
      `Couldn't save the ${ticker} shares in ${account.name}.`
    );
  }

  setHsa(balance: number): void {
    const previous = this.hsa();
    if (previous === balance) {
      return;
    }
    this.hsa.set(balance);
    this.save(this.api.updateHsa(balance), () => {
      if (this.hsa() === balance) {
        this.hsa.set(previous);
      }
    }, 'Couldn\'t save the HSA balance.');
  }

  /**
   * Adds the investment on the server, then to the end of the list. Fails with an error whose message can be shown
   * when the ticker is blank or taken, or the server can't add it.
   */
  addInvestment(ticker: string, category: string, price: number): Observable<void> {
    const symbol = ticker.trim().toUpperCase();
    if (!symbol) {
      return throwError(() => new Error('Enter a ticker.'));
    }
    if (this.findInvestment(symbol)) {
      return throwError(() => new Error(`${symbol} is already in the list.`));
    }
    const color = nextDefaultColor(this.investments());
    return this.api.createInvestment({ ticker: symbol, category: category.trim(), color, price }).pipe(
      tap(dto => this.investments.update(list => withDefaultColors([...list, toInvestment(dto, this.accounts(), [])]))),
      map(() => undefined),
      catchError((error: unknown) => throwError(() => new Error(error instanceof HttpErrorResponse && error.status === 409
        ? `${symbol} is already in the list.`
        : `Couldn't add ${symbol}.`)))
    );
  }

  removeInvestment(ticker: string): void {
    const index = this.investments().findIndex(inv => inv.ticker === ticker);
    if (index === -1) {
      return;
    }
    const removed = this.investments()[index];
    this.investments.update(list => list.filter(inv => inv.ticker !== ticker));
    this.save(this.api.deleteInvestment(removed.id), () => this.investments.update(list => {
      const restored = [...list];
      restored.splice(index, 0, removed);
      return restored;
    }), `Couldn't remove ${ticker}.`);
  }

  /** Moves the investment at one index to another and saves the new order. */
  moveInvestment(from: number, to: number): void {
    if (from === to) {
      return;
    }
    const previousOrder = this.investments().map(inv => inv.ticker);
    this.investments.update(list => {
      const reordered = [...list];
      reordered.splice(to, 0, ...reordered.splice(from, 1));
      return reordered;
    });
    this.save(
      this.api.reorderInvestments(this.investments().map(inv => inv.id)),
      () => this.investments.update(list => inTickerOrder(list, previousOrder)),
      'Couldn\'t save the new order.'
    );
  }

  private saveInvestmentField<K extends keyof InvestmentChanges>(ticker: string, field: K, value: Investment[K]): void {
    const investment = this.findInvestment(ticker);
    if (!investment || investment[field] === value) {
      return;
    }
    this.updateInvestment(ticker, inv => ({ ...inv, [field]: value }));
    this.sendInvestmentField(investment, field, value, investment[field]);
  }

  /** Saves a field already changed here, putting back `previous` if the save fails and nothing has changed it since. */
  private sendInvestmentField<K extends keyof InvestmentChanges>(investment: Investment, field: K, value: Investment[K], previous: Investment[K]): void {
    this.save(
      this.api.updateInvestment(investment.id, { [field]: value } as InvestmentChanges),
      () => this.updateInvestment(investment.ticker, inv => (inv[field] === value ? { ...inv, [field]: previous } : inv)),
      `Couldn't save the ${investment.ticker} ${field}.`
    );
  }

  /** Sends a change that's already shown here, undoing it and reporting the failure if the server doesn't accept it. */
  private save(request: Observable<unknown>, undo: () => void, failure: string): void {
    this.saveError.set('');
    request.subscribe({
      error: () => {
        undo();
        this.saveError.set(failure);
      }
    });
  }

  private findInvestment(ticker: string): Investment | undefined {
    return this.investments().find(inv => inv.ticker === ticker);
  }

  private updateInvestment(ticker: string, change: (inv: Investment) => Investment): void {
    this.investments.update(list => list.map(inv => (inv.ticker === ticker ? change(inv) : inv)));
  }
}

function toAccounts(dtos: AccountDto[]): Account[] {
  return [...dtos]
    .sort((a, b) => a.accountId - b.accountId)
    .map(dto => ({ id: dto.accountId, name: dto.name, cash: dto.cash ?? 0 }));
}

/** Orders investments by sequence (unsequenced last) and gives each its shares in every account. */
function toInvestments(dtos: InvestmentDto[], accounts: Account[], positions: PositionDto[]): Investment[] {
  const lastIfNull = (sequence: number | null) => sequence ?? Number.MAX_SAFE_INTEGER;
  return withDefaultColors([...dtos]
    .sort((a, b) => lastIfNull(a.sequence) - lastIfNull(b.sequence) || a.investmentId - b.investmentId)
    .map(dto => toInvestment(dto, accounts, positions)));
}

/** Leaves the color blank when the server's isn't valid; withDefaultColors() fills it in. */
function toInvestment(dto: InvestmentDto, accounts: Account[], positions: PositionDto[]): Investment {
  const shares = noShares(accounts);
  positions
    .filter(p => p.investmentId === dto.investmentId && p.accountId in shares)
    .forEach(p => (shares[p.accountId] += p.shares ?? 0));
  return {
    id: dto.investmentId,
    ticker: dto.ticker,
    category: dto.category ?? '',
    price: dto.price ?? 0,
    color: isHexColor(dto.color) ? dto.color.toLowerCase() : '',
    shares
  };
}

/** Fills in missing colors one at a time so each picks a default the others aren't using. */
function withDefaultColors(investments: Investment[]): Investment[] {
  investments.filter(inv => !inv.color).forEach(inv => (inv.color = nextDefaultColor(investments)));
  return investments;
}

function noShares(accounts: Account[]): Record<AccountId, number> {
  return Object.fromEntries(accounts.map(account => [account.id, 0]));
}

/** The first default color none of the investments use, or the next one in rotation once they're all taken. */
function nextDefaultColor(investments: Investment[]): string {
  const used = new Set(investments.map(inv => inv.color));
  return TICKER_COLORS.find(color => !used.has(color)) ?? TICKER_COLORS[investments.length % TICKER_COLORS.length];
}

/** Sorts investments into the given ticker order; tickers that aren't in it keep their order at the end. */
function inTickerOrder(investments: Investment[], order: string[]): Investment[] {
  const rank = (ticker: string) => {
    const index = order.indexOf(ticker);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...investments].sort((a, b) => rank(a.ticker) - rank(b.ticker));
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function percentOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}
