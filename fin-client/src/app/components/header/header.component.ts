import { Component, OnInit } from '@angular/core';
import { MenuItem } from "primeng/api";
import { ToggleButton } from "primeng/togglebutton";
import { FormsModule } from "@angular/forms";
import { Menubar } from "primeng/menubar";
import { Router } from "@angular/router";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    Menubar,
    FormsModule,
    ToggleButton,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  items: MenuItem[] | undefined;
  checked: boolean = true;

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    this.toggleDarkMode();
    this.items = [
      {
        label: 'iFinance',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['/accounts']);
        }
      },
      {
        label: 'Features',
        icon: 'pi pi-star',
        items: [
          {
            label: 'Accounts',
            icon: 'pi pi-calculator',
            command: () => {
              this.router.navigate(['/accounts']);
            }
          },
          {
            label: 'Portfolio',
            icon: 'pi pi-chart-line',
            command: () => {
              this.router.navigate(['/portfolio']);
            }
          }
        ]
      }
    ]
  }

  toggleDarkMode() {
    const element = document.querySelector('html');
    element.classList.toggle('my-app-dark');
  }

}
