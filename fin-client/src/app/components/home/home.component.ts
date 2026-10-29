import { afterRender, Component, ElementRef, inject, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PortfolioService } from '../../services/portfolio.service';
import { AccountCardComponent } from '../account-card/account-card.component';
import { HoldingsEditorComponent } from '../holdings-editor/holdings-editor.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CurrencyPipe, AccountCardComponent, HoldingsEditorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly portfolio = inject(PortfolioService);
  // Only rendered once the portfolio has loaded.
  private readonly accounts = viewChild<ElementRef<HTMLElement>>('accounts');
  private cardMinWidth = 0;

  constructor() {
    this.portfolio.load();
    afterRender(() => this.fitCardWidth());
  }

  /** Sizes the account columns to the widest card's natural width so every card fits its table and they all match. */
  private fitCardWidth(): void {
    const container = this.accounts()?.nativeElement;
    if (!container) {
      return;
    }
    // Measuring and restoring happen synchronously, so the browser never paints the measuring state.
    container.classList.add('measuring');
    const widest = Math.max(0, ...Array.from(container.children, card => Math.ceil(card.getBoundingClientRect().width)));
    container.classList.remove('measuring');
    if (widest !== this.cardMinWidth) {
      this.cardMinWidth = widest;
      container.style.setProperty('--card-min-width', `${widest}px`);
    }
  }
}
