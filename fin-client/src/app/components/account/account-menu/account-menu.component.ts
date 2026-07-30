import { Component, OnInit } from '@angular/core';
import {Menu} from "primeng/menu";
import {ToggleButton} from "primeng/togglebutton";
import { Card } from "primeng/card";
import { Button } from "primeng/button";
import { MenuItem } from "primeng/api";

@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [
    Menu,
    Card,
    Button
  ],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss'
})
export class AccountMenuComponent implements OnInit {
  items: MenuItem[] | undefined;

  ngOnInit(): void {
    this.items = [
      {
        label: 'Checking',
      },
      {
        label: 'Savings',
      },
      {
        label: 'Auto Loan',
      },
      {
        label: 'Checking Account abcdef',
      },
      {
        label: 'Savings',
      },
      {
        label: 'Auto Loan',
      },
      {
        label: 'Checking',
      },
      {
        label: 'Savings',
      },
      {
        label: 'Auto Loan',
      },
    ]
  }

  newAccount() {
    alert("Whoo Hoo!")
  }
}
