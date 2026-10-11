import { Component } from '@angular/core';
import { CommonModule} from '@angular/common';
import { RouterLink } from '@angular/router';
import { RevealOnScrollDirective } from '../../shared/reveal-on-scroll.directive';
import { RemovePasswordComponent } from "src/app/pdf-password-remover/remove-password/remove-password.component";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RevealOnScrollDirective, RemovePasswordComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {}
