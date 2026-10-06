import { Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { AccountSummary } from '../../models/portfolio.model';

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss'
})
export class AccountCardComponent {
  readonly summary = input.required<AccountSummary>();

  readonly segments = computed(() => {
    const s = this.summary();
    return [
      { label: 'Cash', percent: s.cashPercent, color: null },
      ...s.positions.map(p => ({ label: p.ticker, percent: p.percent, color: p.color }))
    ];
  });
}
