import { Component, inject, LOCALE_ID } from '@angular/core';
import { CurrencyPipe, formatCurrency } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { AccountId } from '../../models/portfolio.model';
import { PortfolioService } from '../../services/portfolio.service';

@Component({
  selector: 'app-holdings-editor',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, CdkDropList, CurrencyPipe],
  templateUrl: './holdings-editor.component.html',
  styleUrl: './holdings-editor.component.scss'
})
export class HoldingsEditorComponent {
  readonly portfolio = inject(PortfolioService);
  private readonly locale = inject(LOCALE_ID);
  addError = '';

  /** Shows the raw number while a currency field is being edited. */
  unformatMoney(input: HTMLInputElement): void {
    const value = this.parse(input.value);
    if (!Number.isNaN(value)) {
      input.value = String(value);
    }
  }

  /** Restores the currency format when a currency field loses focus. */
  formatMoney(input: HTMLInputElement): void {
    const value = this.parse(input.value);
    if (!Number.isNaN(value) && value >= 0) {
      input.value = formatCurrency(value, this.locale, '$', 'USD');
    }
  }

  /** Strips everything but digits and a single decimal point, covering typing, pasting and drag-and-drop. */
  allowDecimalOnly(input: HTMLInputElement): void {
    const original = input.value;
    const [whole, ...fraction] = original.replace(/[^\d.]/g, '').split('.');
    const cleaned = fraction.length ? `${whole}.${fraction.join('')}` : whole;
    if (cleaned !== original) {
      const caret = (input.selectionStart ?? original.length) - (original.length - cleaned.length);
      input.value = cleaned;
      input.setSelectionRange(Math.max(caret, 0), Math.max(caret, 0));
    }
  }

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

  reorder(event: CdkDragDrop<unknown>): void {
    this.portfolio.moveInvestment(event.previousIndex, event.currentIndex);
  }

  remove(ticker: string): void {
    if (confirm(`Remove ${ticker} from all accounts?`)) {
      this.portfolio.removeInvestment(ticker);
    }
  }

  private commit(input: HTMLInputElement, apply: (value: number) => void): void {
    const value = this.parse(input.value);
    if (Number.isNaN(value) || value < 0) {
      input.classList.add('invalid');
      return;
    }
    input.classList.remove('invalid');
    apply(value);
  }

  /** Parses a number, ignoring any `$` signs, thousands separators and whitespace. */
  private parse(text: string): number {
    return Number(text.replace(/[$,\s]/g, '') || 0);
  }
}
