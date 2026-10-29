import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountDto, InvestmentDto, PositionDto } from '../models/api.model';
import { API_URL } from './finance-api.service';
import { HOLDINGS_COLORS_KEY, HOLDINGS_ORDER_KEY, PortfolioService, TICKER_COLORS } from './portfolio.service';

const API = 'http://api.test';

// The rows from database/FinanceDB.sql, with the spreadsheet's prices.
const ACCOUNTS: AccountDto[] = [
  { accountId: 1, name: 'Brokerage', cash: 3819.69 },
  { accountId: 2, name: 'Traditional', cash: 166872.61 },
  { accountId: 3, name: 'Roth', cash: 51989.58 }
];
const INVESTMENTS: InvestmentDto[] = [
  { investmentId: 1, ticker: 'SCHD', category: 'Dividend', color: '#2383a9', price: 32.72, sequence: 1 },
  { investmentId: 2, ticker: 'SPMO', category: 'Growth', color: '#99c639', price: 153.23, sequence: 2 },
  { investmentId: 3, ticker: 'SPYM', category: 'Foundation', color: '#39c3f9', price: 90.60, sequence: 3 }
];
const POSITIONS: PositionDto[] = [
  { positionId: 1, accountId: 2, investmentId: 1, shares: 3016.075 },
  { positionId: 2, accountId: 2, investmentId: 2, shares: 227.321 },
  { positionId: 3, accountId: 2, investmentId: 3, shares: 501.338 },
  { positionId: 4, accountId: 3, investmentId: 1, shares: 503.215 },
  { positionId: 5, accountId: 3, investmentId: 2, shares: 127.321 },
  { positionId: 6, accountId: 3, investmentId: 3, shares: 100.268 }
];

describe('PortfolioService', () => {
  let service: PortfolioService;
  let http: HttpTestingController;

  /** Calls load() and answers its three requests. */
  const load = (svc: PortfolioService, accounts = ACCOUNTS, investments = INVESTMENTS, positions = POSITIONS) => {
    svc.load();
    http.expectOne(`${API}/accounts`).flush(accounts);
    http.expectOne(`${API}/investments`).flush(investments);
    http.expectOne(`${API}/positions`).flush(positions);
  };
  const create = () => TestBed.runInInjectionContext(() => new PortfolioService());
  const tickers = (svc: PortfolioService) => svc.investments().map(i => i.ticker);
  const investment = (svc: PortfolioService, ticker: string) => svc.investments().find(i => i.ticker === ticker)!;

  beforeEach(() => {
    localStorage.removeItem(HOLDINGS_ORDER_KEY);
    localStorage.removeItem(HOLDINGS_COLORS_KEY);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: API }]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PortfolioService);
    load(service);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(HOLDINGS_ORDER_KEY);
    localStorage.removeItem(HOLDINGS_COLORS_KEY);
  });

  it('loads accounts and gives every investment its shares in each account', () => {
    expect(service.loading()).toBeFalse();
    expect(service.accounts().map(a => a.name)).toEqual(['Brokerage', 'Traditional', 'Roth']);
    expect(investment(service, 'SCHD')).toEqual({
      ticker: 'SCHD', category: 'Dividend', price: 32.72, color: '#2383a9', shares: { 1: 0, 2: 3016.075, 3: 503.215 }
    });
  });

  it('matches the spreadsheet totals for the database rows', () => {
    const totals = service.summaries().map(s => s.total);
    expect(totals[0]).toBeCloseTo(3819.69, 2);
    expect(totals[1]).toBeCloseTo(345812.20, 1);
    expect(totals[2]).toBeCloseTo(97048.45, 1);
    expect(service.grandTotal()).toBeCloseTo(446698.50, 0);
  });

  it('sorts accounts by id and investments by sequence, unsequenced last', () => {
    const svc = create();
    load(svc, [...ACCOUNTS].reverse(), [{ ...INVESTMENTS[0], sequence: null }, INVESTMENTS[2], INVESTMENTS[1]]);
    expect(svc.accounts().map(a => a.id)).toEqual([1, 2, 3]);
    expect(tickers(svc)).toEqual(['SPMO', 'SPYM', 'SCHD']);
  });

  it('fills in missing values and sums duplicate positions', () => {
    const svc = create();
    load(svc, ACCOUNTS, [...INVESTMENTS, { investmentId: 4, ticker: 'VTI', category: null, color: null, price: null, sequence: null }], [
      ...POSITIONS,
      { positionId: 7, accountId: 1, investmentId: 4, shares: 2 },
      { positionId: 8, accountId: 1, investmentId: 4, shares: 3 },
      { positionId: 9, accountId: 2, investmentId: 4, shares: null },
      { positionId: 10, accountId: 99, investmentId: 4, shares: 7 }
    ]);
    expect(investment(svc, 'VTI')).toEqual({ ticker: 'VTI', category: '', price: 0, color: TICKER_COLORS[2], shares: { 1: 5, 2: 0, 3: 0 } });
  });

  it('reports a failed load and clears the error when a retry succeeds', () => {
    const svc = create();
    svc.load();
    expect(svc.loading()).toBeTrue();
    http.expectOne(`${API}/accounts`).flush(ACCOUNTS);
    http.expectOne(`${API}/investments`).flush(INVESTMENTS);
    http.expectOne(`${API}/positions`).flush('down', { status: 503, statusText: 'Service Unavailable' });
    expect(svc.loading()).toBeFalse();
    expect(svc.loadError()).not.toBe('');
    expect(svc.investments()).toEqual([]);

    load(svc);
    expect(svc.loadError()).toBe('');
    expect(tickers(svc)).toEqual(['SCHD', 'SPMO', 'SPYM']);
  });

  it('refreshes prices from the server, keeping local edits to other fields', () => {
    service.setColor('SCHD', '#ff0000');
    service.removeInvestment('SPYM');
    service.refreshPrices();
    expect(service.refreshingPrices()).toBeTrue();
    const request = http.expectOne(`${API}/investments/prices/refresh`);
    expect(request.request.method).toBe('POST');
    request.flush([
      { ...INVESTMENTS[0], price: 35.42 },
      { ...INVESTMENTS[1], price: null },
      { ...INVESTMENTS[2], price: 90.47 }
    ]);
    expect(service.refreshingPrices()).toBeFalse();
    expect(investment(service, 'SCHD')).toEqual(jasmine.objectContaining({ price: 35.42, color: '#ff0000' }));
    expect(investment(service, 'SPMO').price).toBe(153.23);
    expect(tickers(service)).toEqual(['SCHD', 'SPMO']);
  });

  it('reports a failed price refresh without changing prices', () => {
    service.refreshPrices();
    http.expectOne(`${API}/investments/prices/refresh`).flush('down', { status: 500, statusText: 'Server Error' });
    expect(service.refreshingPrices()).toBeFalse();
    expect(service.refreshError()).not.toBe('');
    expect(investment(service, 'SCHD').price).toBe(32.72);
  });

  it('only lists positions with shares in the account', () => {
    const brokerage = service.summaries().find(s => s.account.id === 1)!;
    expect(brokerage.positions.length).toBe(0);
    expect(brokerage.cashPercent).toBe(1);
  });

  it('recalculates when price, shares or cash change', () => {
    service.setPrice('SCHD', 40);
    service.setShares('SCHD', 1, 10);
    service.setCash(1, 600);
    const brokerage = service.summaries().find(s => s.account.id === 1)!;
    expect(brokerage.total).toBe(1000);
    expect(brokerage.positions[0].percent).toBeCloseTo(0.4);
  });

  it('adds new tickers in upper case with no shares, and rejects duplicates', () => {
    expect(service.addInvestment(' vti ', 'Total Market', 300)).toBeTrue();
    expect(investment(service, 'VTI').shares).toEqual({ 1: 0, 2: 0, 3: 0 });
    expect(service.addInvestment('VTI', '', 1)).toBeFalse();
    expect(service.addInvestment('  ', '', 1)).toBeFalse();
  });

  it('removes an investment from every account', () => {
    service.removeInvestment('SPMO');
    expect(tickers(service)).not.toContain('SPMO');
    service.summaries().forEach(s => expect(s.positions.map(p => p.ticker)).not.toContain('SPMO'));
  });

  it('moves an investment and saves the new order', () => {
    service.moveInvestment(2, 0);
    expect(tickers(service)).toEqual(['SPYM', 'SCHD', 'SPMO']);
    expect(JSON.parse(localStorage.getItem(HOLDINGS_ORDER_KEY)!)).toEqual(['SPYM', 'SCHD', 'SPMO']);
  });

  it('restores the saved order over the server order, putting unknown tickers last', () => {
    localStorage.setItem(HOLDINGS_ORDER_KEY, JSON.stringify(['SPYM', 'GONE', 'SCHD']));
    const restored = create();
    load(restored);
    expect(tickers(restored)).toEqual(['SPYM', 'SCHD', 'SPMO']);
  });

  it('ignores a corrupt saved order', () => {
    localStorage.setItem(HOLDINGS_ORDER_KEY, '{not json');
    const restored = create();
    load(restored);
    expect(tickers(restored)).toEqual(['SCHD', 'SPMO', 'SPYM']);
  });

  it('saves the order when investments are added or removed', () => {
    service.addInvestment('VTI', '', 1);
    service.removeInvestment('SCHD');
    expect(JSON.parse(localStorage.getItem(HOLDINGS_ORDER_KEY)!)).toEqual(['SPMO', 'SPYM', 'VTI']);
  });

  it('gives new tickers the first unused default color, then rotates', () => {
    service.addInvestment('VTI', '', 1);
    expect(investment(service, 'VTI').color).toBe(TICKER_COLORS[2]);
    ['A', 'B', 'C'].forEach(t => service.addInvestment(t, '', 1));
    expect(investment(service, 'C').color).toBe(TICKER_COLORS[0]);
  });

  it('changes and saves a ticker color, ignoring invalid values', () => {
    service.setColor('SCHD', '#FF0000');
    service.setColor('SCHD', 'red');
    expect(investment(service, 'SCHD').color).toBe('#ff0000');
    expect(JSON.parse(localStorage.getItem(HOLDINGS_COLORS_KEY)!).SCHD).toBe('#ff0000');
    expect(service.summaries()[1].positions.find(p => p.ticker === 'SCHD')!.color).toBe('#ff0000');
  });

  it('restores saved colors over the server colors and skips invalid ones', () => {
    localStorage.setItem(HOLDINGS_COLORS_KEY, JSON.stringify({ SPYM: '#123abc', SCHD: 'not-a-color' }));
    const restored = create();
    load(restored);
    expect(investment(restored, 'SPYM').color).toBe('#123abc');
    expect(investment(restored, 'SCHD').color).toBe('#2383a9');
  });
});
