import { Component } from '@angular/core';
import { PdfToolsComponent } from './pdf-tools.component';

@Component({
  selector: 'app-pdf-tools-page',
  standalone: true,
  imports: [PdfToolsComponent],
  templateUrl: './pdf-tools-page.component.html',
})
export class PdfToolsPageComponent {}
