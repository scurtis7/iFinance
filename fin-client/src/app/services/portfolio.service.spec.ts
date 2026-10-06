import { TestBed } from '@angular/core/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioService);
  });

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
});
