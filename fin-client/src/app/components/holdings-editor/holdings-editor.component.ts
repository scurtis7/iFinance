import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AccountId } from '../../models/portfolio.model';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-holdings-editor',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './holdings-editor.component.html',
  styleUrl: './holdings-editor.component.scss'
})
export class HoldingsEditorComponent {
  readonly portfolio = inject(PortfolioService);
  addError = '';

  setCash(id: AccountId, input: HTMLInputElement): void {
    this.commit(input, value => this.portfolio.setCash(id, value));
  }

  setPrice(ticker: string, input: HTMLInputElement): void {
    this.commit(input, value => this.portfolio.setPrice(ticker, value));
  }

  setShares(ticker: string, id: AccountId, input: HTMLInputElement): void {
    this.commit(input, value => this.portfolio.setShares(ticker, id, value));
  }

  setHsa(input: HTMLInputElement): void {
    this.commit(input, value => this.portfolio.setHsa(value));
  }

  add(ticker: HTMLInputElement, category: HTMLInputElement, price: HTMLInputElement): void {
    const value = Number(price.value || 0);
    if (!ticker.value.trim() || Number.isNaN(value) || value < 0) {
      this.addError = 'Enter a ticker and a valid price.';
      return;
    }
    if (!this.portfolio.addInvestment(ticker.value, category.value, value)) {
      this.addError = `${ticker.value.trim().toUpperCase()} is already in the list.`;
      return;
    }
    this.addError = '';
    ticker.value = '';
    category.value = '';
    price.value = '';
    ticker.focus();
  }

  remove(ticker: string): void {
    if (confirm(`Remove ${ticker} from all accounts?`)) {
      this.portfolio.removeInvestment(ticker);
    }
  }

  private commit(input: HTMLInputElement, apply: (value: number) => void): void {
    const value = Number(input.value || 0);
    if (Number.isNaN(value) || value < 0) {
      input.classList.add('invalid');
      return;
    }
    input.classList.remove('invalid');
    apply(value);
  }
}
