import { Component, inject } from '@angular/core';
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
}
