import { Component } from '@angular/core';
import { AccountMenuComponent } from "./account-menu/account-menu.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [AccountMenuComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent {

}
