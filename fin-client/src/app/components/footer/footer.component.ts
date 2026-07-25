import { Component } from '@angular/core';
import {Menubar} from "primeng/menubar";
import {ToggleButton} from "primeng/togglebutton";
import { Card } from "primeng/card";

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    Menubar,
    ToggleButton,
    Card
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
