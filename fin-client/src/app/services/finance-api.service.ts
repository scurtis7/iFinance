import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AccountChanges, AccountDto, HsaDto, InvestmentChanges, InvestmentDto, NewInvestment, PositionDto, PositionShares
} from '../models/api.model';

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

  /** The balance is zero until one has been saved. */
  getHsa(): Observable<HsaDto> {
    return this.http.get<HsaDto>(`${this.baseUrl}/hsa`);
  }

  updateHsa(balance: number): Observable<HsaDto> {
    return this.http.put<HsaDto>(`${this.baseUrl}/hsa`, { balance });
  }

  /** Has the server fetch a quote for every investment and save it, then returns all investments. */
  refreshPrices(): Observable<InvestmentDto[]> {
    return this.http.post<InvestmentDto[]>(`${this.baseUrl}/investments/prices/refresh`, null);
  }

  updateAccount(accountId: number, changes: AccountChanges): Observable<AccountDto> {
    return this.http.patch<AccountDto>(`${this.baseUrl}/accounts/${accountId}`, changes);
  }

  /** Numbers the accounts in the order of the given ids and returns them all in that order. */
  reorderAccounts(accountIds: number[]): Observable<AccountDto[]> {
    return this.http.put<AccountDto[]>(`${this.baseUrl}/accounts/order`, accountIds);
  }

  /** Adds an investment after the others. Fails with 409 when the ticker already exists. */
  createInvestment(investment: NewInvestment): Observable<InvestmentDto> {
    return this.http.post<InvestmentDto>(`${this.baseUrl}/investments`, investment);
  }

  updateInvestment(investmentId: number, changes: InvestmentChanges): Observable<InvestmentDto> {
    return this.http.patch<InvestmentDto>(`${this.baseUrl}/investments/${investmentId}`, changes);
  }

  /** Deletes an investment along with its positions in every account. */
  deleteInvestment(investmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/investments/${investmentId}`);
  }

  /** Numbers the investments in the order of the given ids and returns them all in that order. */
  reorderInvestments(investmentIds: number[]): Observable<InvestmentDto[]> {
    return this.http.put<InvestmentDto[]>(`${this.baseUrl}/investments/order`, investmentIds);
  }

  /** Sets the shares an account holds of an investment, adding the position if the account doesn't hold it yet. */
  savePosition(position: PositionShares): Observable<PositionDto> {
    return this.http.put<PositionDto>(`${this.baseUrl}/positions`, position);
  }
}
