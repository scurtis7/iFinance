import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountDto, InvestmentDto, PositionDto } from '../models/api.model';

/** Base URL of fin-server. The server allows CORS from any origin, so the dev server calls it directly. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:8080'
});

/** One method per fin-server endpoint, returning the server's JSON as is. */
@Injectable({
  providedIn: 'root'
})
export class FinanceApiService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_URL);

  getAccounts(): Observable<AccountDto[]> {
    return this.http.get<AccountDto[]>(`${this.baseUrl}/accounts`);
  }

  getInvestments(): Observable<InvestmentDto[]> {
    return this.http.get<InvestmentDto[]>(`${this.baseUrl}/investments`);
  }

  getPositions(): Observable<PositionDto[]> {
    return this.http.get<PositionDto[]>(`${this.baseUrl}/positions`);
  }

  /** Has the server fetch a quote for every investment and save it, then returns all investments. */
  refreshPrices(): Observable<InvestmentDto[]> {
    return this.http.post<InvestmentDto[]>(`${this.baseUrl}/investments/prices/refresh`, null);
  }
}
