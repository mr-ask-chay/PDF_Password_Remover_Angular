import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  /** Update when the terms text changes (not on every build). */
  readonly lastUpdated = '2026-10-11';
}
