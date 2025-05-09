import { Component } from '@angular/core';

@Component({
  selector: 'app-report-builder',
  standalone: false,
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.css'
})
export class ReportBuilderComponent {

  isOpen :boolean =false;
  openRightModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
  }
}
