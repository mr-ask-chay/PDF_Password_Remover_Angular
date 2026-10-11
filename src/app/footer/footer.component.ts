import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
  imports: [RouterLink],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
