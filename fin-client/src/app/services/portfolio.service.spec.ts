import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountDto, InvestmentDto, NewInvestment, PositionDto } from '../models/api.model';
import { API_URL } from './finance-api.service';
import { PortfolioService, TICKER_COLORS } from './portfolio.service';

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
  const expectRequest = (method: string, path: string): TestRequest => http.expectOne({ method, url: `${API}${path}` });
  const fail = (request: TestRequest) => request.flush('rejected', { status: 500, statusText: 'Server Error' });
  /** Adds a ticker and answers the POST the way the server does, echoing the request with a new id. */
  const add = (ticker: string, investmentId: number) => {
    service.addInvestment(ticker, '', 1).subscribe();
    const request = expectRequest('POST', '/investments');
    request.flush({ ...(request.request.body as NewInvestment), investmentId, sequence: investmentId });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_URL, useValue: API }]
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PortfolioService);
    load(service);
  });

  afterEach(() => http.verify());

  describe('loading', () => {
    it('loads accounts and gives every investment its id and shares in each account', () => {
      expect(service.loading()).toBeFalse();
      expect(service.accounts().map(a => a.name)).toEqual(['Brokerage', 'Traditional', 'Roth']);
      expect(investment(service, 'SCHD')).toEqual({
        id: 1, ticker: 'SCHD', category: 'Dividend', price: 32.72, color: '#2383a9', shares: { 1: 0, 2: 3016.075, 3: 503.215 }
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
      expect(investment(svc, 'VTI')).toEqual({ id: 4, ticker: 'VTI', category: '', price: 0, color: TICKER_COLORS[2], shares: { 1: 5, 2: 0, 3: 0 } });
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

    it('only lists positions with shares in the account', () => {
      const brokerage = service.summaries().find(s => s.account.id === 1)!;
      expect(brokerage.positions.length).toBe(0);
      expect(brokerage.cashPercent).toBe(1);
    });
  });

  describe('refreshing prices', () => {
    it('updates the price of each ticker the server returns', () => {
      service.removeInvestment('SPYM');
      expectRequest('DELETE', '/investments/3').flush(null);
      service.refreshPrices();
      expect(service.refreshingPrices()).toBeTrue();
      expectRequest('POST', '/investments/prices/refresh').flush([
        { ...INVESTMENTS[0], price: 35.42 },
        { ...INVESTMENTS[1], price: null },
        { ...INVESTMENTS[2], price: 90.47 }
      ]);
      expect(service.refreshingPrices()).toBeFalse();
      expect(investment(service, 'SCHD').price).toBe(35.42);
      expect(investment(service, 'SPMO').price).toBe(153.23);
      expect(tickers(service)).toEqual(['SCHD', 'SPMO']);
    });

    it('reports a failed refresh without changing prices', () => {
      service.refreshPrices();
      fail(expectRequest('POST', '/investments/prices/refresh'));
      expect(service.refreshingPrices()).toBeFalse();
      expect(service.refreshError()).not.toBe('');
      expect(investment(service, 'SCHD').price).toBe(32.72);
    });
  });

  describe('saving edits', () => {
    it('shows cash, price and shares changes right away and saves each one', () => {
      service.setCash(1, 600);
      service.setPrice('SCHD', 40);
      service.setShares('SCHD', 1, 10);
      const brokerage = service.summaries().find(s => s.account.id === 1)!;
      expect(brokerage.total).toBe(1000);
      expect(brokerage.positions[0].percent).toBeCloseTo(0.4);

      expect(expectRequest('PATCH', '/accounts/1').request.body).toEqual({ cash: 600 });
      expect(expectRequest('PATCH', '/investments/1').request.body).toEqual({ price: 40 });
      expect(expectRequest('PUT', '/positions').request.body).toEqual({ accountId: 1, investmentId: 1, shares: 10 });
    });

    it('saves a trimmed category', () => {
      service.setCategory('SPMO', ' Momentum ');
      expect(investment(service, 'SPMO').category).toBe('Momentum');
      expect(expectRequest('PATCH', '/investments/2').request.body).toEqual({ category: 'Momentum' });
    });

    it('doesn\'t save values that didn\'t change', () => {
      service.setCash(1, 3819.69);
      service.setPrice('SCHD', 32.72);
      service.setCategory('SCHD', ' Dividend ');
      service.setShares('SCHD', 2, 3016.075);
      service.removeInvestment('GONE');
      service.moveInvestment(1, 1);
      expect(investment(service, 'SCHD').category).toBe('Dividend');
      expect(tickers(service)).toEqual(['SCHD', 'SPMO', 'SPYM']);
    });

    it('puts a value back and reports the failure when the server rejects it', () => {
      service.setCash(3, 100);
      fail(expectRequest('PATCH', '/accounts/3'));
      expect(service.accounts()[2].cash).toBe(51989.58);
      expect(service.saveError()).toBe('Couldn\'t save the Roth cash.');

      service.setShares('SPMO', 2, 1);
      expect(service.saveError()).toBe('');
      fail(expectRequest('PUT', '/positions'));
      expect(investment(service, 'SPMO').shares[2]).toBe(227.321);
      expect(service.saveError()).toBe('Couldn\'t save the SPMO shares in Traditional.');

      service.setCategory('SPMO', 'Momentum');
      fail(expectRequest('PATCH', '/investments/2'));
      expect(investment(service, 'SPMO').category).toBe('Growth');
      expect(service.saveError()).toBe('Couldn\'t save the SPMO category.');
    });

    it('keeps a newer edit when an older save fails', () => {
      service.setPrice('SCHD', 40);
      service.setPrice('SCHD', 41);
      const [first, second] = http.match({ method: 'PATCH', url: `${API}/investments/1` });
      second.flush({});
      fail(first);
      expect(investment(service, 'SCHD').price).toBe(41);
    });
  });

  describe('colors', () => {
    it('previews valid colors while picking and saves the final one', () => {
      service.previewColor('SCHD', '#FF0000');
      service.previewColor('SCHD', 'red');
      service.previewColor('SCHD', '#00ff00');
      expect(investment(service, 'SCHD').color).toBe('#00ff00');
      expect(service.summaries()[1].positions.find(p => p.ticker === 'SCHD')!.color).toBe('#00ff00');

      service.saveColor('SCHD');
      expect(expectRequest('PATCH', '/investments/1').request.body).toEqual({ color: '#00ff00' });
    });

    it('doesn\'t save a color that ends where it started', () => {
      service.previewColor('SCHD', '#ff0000');
      service.previewColor('SCHD', '#2383A9');
      service.saveColor('SCHD');
      service.saveColor('SPMO');
      expect(investment(service, 'SCHD').color).toBe('#2383a9');
    });

    it('restores the color from before the preview when saving fails', () => {
      service.previewColor('SCHD', '#ff0000');
      service.previewColor('SCHD', '#00ff00');
      service.saveColor('SCHD');
      fail(expectRequest('PATCH', '/investments/1'));
      expect(investment(service, 'SCHD').color).toBe('#2383a9');
    });
  });

  describe('adding', () => {
    it('adds an investment on the server, then to the end of the list with no shares', () => {
      let done = false;
      service.addInvestment(' vti ', ' Total Market ', 300).subscribe({ complete: () => (done = true) });
      const request = expectRequest('POST', '/investments');
      expect(request.request.body).toEqual({ ticker: 'VTI', category: 'Total Market', color: TICKER_COLORS[2], price: 300 });
      expect(tickers(service)).not.toContain('VTI');

      request.flush({ investmentId: 4, ticker: 'VTI', category: 'Total Market', color: TICKER_COLORS[2], price: 300, sequence: 4 });
      expect(done).toBeTrue();
      expect(investment(service, 'VTI')).toEqual({
        id: 4, ticker: 'VTI', category: 'Total Market', price: 300, color: TICKER_COLORS[2], shares: { 1: 0, 2: 0, 3: 0 }
      });
      expect(tickers(service)).toEqual(['SCHD', 'SPMO', 'SPYM', 'VTI']);
    });

    it('rejects blank and listed tickers without calling the server', () => {
      const errors: string[] = [];
      service.addInvestment('  ', '', 1).subscribe({ error: (e: Error) => errors.push(e.message) });
      service.addInvestment('schd', '', 1).subscribe({ error: (e: Error) => errors.push(e.message) });
      expect(errors).toEqual(['Enter a ticker.', 'SCHD is already in the list.']);
    });

    it('explains a ticker the server already has, or any other failure', () => {
      const errors: string[] = [];
      service.addInvestment('VTI', '', 1).subscribe({ error: (e: Error) => errors.push(e.message) });
      expectRequest('POST', '/investments').flush('exists', { status: 409, statusText: 'Conflict' });
      service.addInvestment('VTI', '', 1).subscribe({ error: (e: Error) => errors.push(e.message) });
      fail(expectRequest('POST', '/investments'));
      expect(errors).toEqual(['VTI is already in the list.', 'Couldn\'t add VTI.']);
      expect(tickers(service)).not.toContain('VTI');
    });

    it('gives new tickers the first unused default color, then rotates', () => {
      add('VTI', 4);
      expect(investment(service, 'VTI').color).toBe(TICKER_COLORS[2]);
      add('A', 5);
      add('B', 6);
      add('C', 7);
      expect(investment(service, 'C').color).toBe(TICKER_COLORS[0]);
    });
  });

  describe('removing and reordering', () => {
    it('removes an investment from every account and deletes it on the server', () => {
      service.removeInvestment('SPMO');
      expect(tickers(service)).toEqual(['SCHD', 'SPYM']);
      service.summaries().forEach(s => expect(s.positions.map(p => p.ticker)).not.toContain('SPMO'));
      expectRequest('DELETE', '/investments/2').flush(null);
    });

    it('puts a removed investment back where it was when the delete fails', () => {
      service.removeInvestment('SPMO');
      fail(expectRequest('DELETE', '/investments/2'));
      expect(tickers(service)).toEqual(['SCHD', 'SPMO', 'SPYM']);
      expect(service.saveError()).toBe('Couldn\'t remove SPMO.');
    });

    it('moves an investment and saves the new order of ids', () => {
      service.moveInvestment(2, 0);
      expect(tickers(service)).toEqual(['SPYM', 'SCHD', 'SPMO']);
      expect(expectRequest('PUT', '/investments/order').request.body).toEqual([3, 1, 2]);
    });

    it('restores the previous order when saving it fails', () => {
      service.moveInvestment(2, 0);
      fail(expectRequest('PUT', '/investments/order'));
      expect(tickers(service)).toEqual(['SCHD', 'SPMO', 'SPYM']);
      expect(service.saveError()).toBe('Couldn\'t save the new order.');
    });
  });
});
