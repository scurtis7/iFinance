import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { SideMenuComponent } from "./components/side-menu/side-menu.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SideMenuComponent, RouterOutlet, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'fin-client';
}
