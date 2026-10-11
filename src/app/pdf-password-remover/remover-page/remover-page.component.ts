import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RemovePasswordComponent } from '../remove-password/remove-password.component';

/** Dedicated, indexable page for the PDF Password Remover tool. */
@Component({
  selector: 'app-remover-page',
  standalone: true,
  imports: [RouterLink, RemovePasswordComponent],
  templateUrl: './remover-page.component.html',
})
export class RemoverPageComponent {}
