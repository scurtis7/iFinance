import { Routes } from '@angular/router';
import { AccountComponent } from "./components/account/account.component";
import { PortfolioComponent } from "./components/portfolio/portfolio.component";

export const routes: Routes = [
  { path: 'accounts', component: AccountComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: '**', redirectTo: 'accounts' }
];
