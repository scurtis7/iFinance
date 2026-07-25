import { Routes } from '@angular/router';
import { BudgetComponent } from "./components/budget/budget.component";
import { PortfolioComponent } from "./components/portfolio/portfolio.component";

export const routes: Routes = [
  { path: 'budget', component: BudgetComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: '**', redirectTo: 'budget' }
];
