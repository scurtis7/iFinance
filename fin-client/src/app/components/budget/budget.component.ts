import { Component } from '@angular/core';
import { SideMenuComponent } from "../side-menu/side-menu.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SideMenuComponent],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss'
})
export class BudgetComponent {

}
