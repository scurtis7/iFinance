import { TestBed } from '@angular/core/testing';
import { HOLDINGS_COLORS_KEY, HOLDINGS_ORDER_KEY, PortfolioService, TICKER_COLORS } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(() => {
    localStorage.removeItem(HOLDINGS_ORDER_KEY);
    localStorage.removeItem(HOLDINGS_COLORS_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioService);
  });

  afterEach(() => {
    localStorage.removeItem(HOLDINGS_ORDER_KEY);
    localStorage.removeItem(HOLDINGS_COLORS_KEY);
  });

  const colorOf = (svc: PortfolioService, ticker: string) => svc.investments().find(i => i.ticker === ticker)!.color;

  it('matches the spreadsheet totals for the seed data', () => {
    const totals = service.summaries().map(s => s.total);
    expect(totals[0]).toBeCloseTo(3819.69, 2);
    expect(totals[1]).toBeCloseTo(345812.20, 1);
    expect(totals[2]).toBeCloseTo(97048.45, 1);
    expect(service.grandTotal()).toBeCloseTo(446698.50, 0);
  });

  it('only lists positions with shares in the account', () => {
    const brokerage = service.summaries().find(s => s.account.id === 'brokerage')!;
    expect(brokerage.positions.length).toBe(0);
    expect(brokerage.cashPercent).toBe(1);
  });

  it('recalculates when price, shares or cash change', () => {
    service.setPrice('SCHD', 40);
    service.setShares('SCHD', 'brokerage', 10);
    service.setCash('brokerage', 600);
    const brokerage = service.summaries().find(s => s.account.id === 'brokerage')!;
    expect(brokerage.total).toBe(1000);
    expect(brokerage.positions[0].percent).toBeCloseTo(0.4);
  });

  it('adds new tickers in upper case and rejects duplicates', () => {
    expect(service.addInvestment(' vti ', 'Total Market', 300)).toBeTrue();
    expect(service.investments().some(i => i.ticker === 'VTI')).toBeTrue();
    expect(service.addInvestment('VTI', '', 1)).toBeFalse();
    expect(service.addInvestment('  ', '', 1)).toBeFalse();
  });

  it('removes an investment from every account', () => {
    service.removeInvestment('SPMO');
    expect(service.investments().map(i => i.ticker)).not.toContain('SPMO');
    service.summaries().forEach(s => expect(s.positions.map(p => p.ticker)).not.toContain('SPMO'));
  });

  it('moves an investment and saves the new order', () => {
    service.moveInvestment(2, 0);
    expect(service.investments().map(i => i.ticker)).toEqual(['SPMO', 'SPYM', 'SCHD']);
    expect(JSON.parse(localStorage.getItem(HOLDINGS_ORDER_KEY)!)).toEqual(['SPMO', 'SPYM', 'SCHD']);
  });

  it('restores the saved order, putting unknown tickers last', () => {
    localStorage.setItem(HOLDINGS_ORDER_KEY, JSON.stringify(['SCHD', 'GONE', 'SPYM']));
    const restored = TestBed.runInInjectionContext(() => new PortfolioService());
    expect(restored.investments().map(i => i.ticker)).toEqual(['SCHD', 'SPYM', 'SPMO']);
  });

  it('ignores a corrupt saved order', () => {
    localStorage.setItem(HOLDINGS_ORDER_KEY, '{not json');
    const restored = TestBed.runInInjectionContext(() => new PortfolioService());
    expect(restored.investments().map(i => i.ticker)).toEqual(['SPYM', 'SCHD', 'SPMO']);
  });

  it('saves the order when investments are added or removed', () => {
    service.addInvestment('VTI', '', 1);
    service.removeInvestment('SCHD');
    expect(JSON.parse(localStorage.getItem(HOLDINGS_ORDER_KEY)!)).toEqual(['SPYM', 'SPMO', 'VTI']);
  });

  it('gives new tickers the first unused default color, then rotates', () => {
    service.addInvestment('VTI', '', 1);
    expect(colorOf(service, 'VTI')).toBe(TICKER_COLORS[3]);
    ['A', 'B', 'C'].forEach(t => service.addInvestment(t, '', 1));
    expect(colorOf(service, 'C')).toBe(TICKER_COLORS[0]);
  });

  it('changes and saves a ticker color, ignoring invalid values', () => {
    service.setColor('SCHD', '#FF0000');
    service.setColor('SCHD', 'red');
    expect(colorOf(service, 'SCHD')).toBe('#ff0000');
    expect(JSON.parse(localStorage.getItem(HOLDINGS_COLORS_KEY)!).SCHD).toBe('#ff0000');
    expect(service.summaries()[1].positions.find(p => p.ticker === 'SCHD')!.color).toBe('#ff0000');
  });

  it('restores saved colors and skips invalid ones', () => {
    localStorage.setItem(HOLDINGS_COLORS_KEY, JSON.stringify({ SPYM: '#123abc', SCHD: 'not-a-color' }));
    const restored = TestBed.runInInjectionContext(() => new PortfolioService());
    expect(colorOf(restored, 'SPYM')).toBe('#123abc');
    expect(colorOf(restored, 'SCHD')).toBe(TICKER_COLORS[1]);
  });
});
