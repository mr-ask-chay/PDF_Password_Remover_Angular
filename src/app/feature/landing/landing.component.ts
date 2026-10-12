import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RemovePasswordComponent } from '../../pdf-password-remover/remove-password/remove-password.component';

type ToolGroup = {
  title: string;
  tools: string[];
};

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, RemovePasswordComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  readonly toolGroups: ToolGroup[] = [
    {
      title: 'Organize and edit pages',
      tools: ['Merge PDF', 'Split PDF', 'Extract pages', 'Remove pages', 'Reorder pages', 'Rotate pages', 'Crop pages', 'Add page numbers'],
    },
    {
      title: 'Convert and extract',
      tools: ['JPG / PNG to PDF', 'PDF to JPG', 'PDF to Markdown', 'Compare PDF text', 'PDF forms'],
    },
    {
      title: 'Secure and optimize',
      tools: ['PDF Password Remover', 'Protect PDF', 'Compress PDF'],
    },
    {
      title: 'Annotation and metadata',
      tools: ['Watermark PDF', 'Text overlay', 'Edit metadata', 'Fill form fields'],
    },
  ];
}
