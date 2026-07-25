import { Component } from '@angular/core';
import {Menubar} from "primeng/menubar";
import {ToggleButton} from "primeng/togglebutton";
import { Card } from "primeng/card";

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [
    Menubar,
    ToggleButton,
    Card
  ],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {

}
