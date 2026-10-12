import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
})
export class PrivacyComponent {
  readonly year = new Date().getFullYear();
  /** Update when the policy text changes (not on every build). */
  readonly lastUpdated = '2026-10-11';
}
