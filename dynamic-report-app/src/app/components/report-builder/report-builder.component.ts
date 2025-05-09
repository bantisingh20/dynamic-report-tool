import { Component } from '@angular/core';

@Component({
  selector: 'app-report-builder',
  standalone: false,
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.css'
})
export class ReportBuilderComponent {

  isOpen :boolean =false;
  islEFTOpen :boolean =false;
  openRightModal() {
    this.isOpen = true;
  }

  openLeftModal(){
  this.islEFTOpen = true;
  }
  closeModal() {
    this.isOpen = false;    this.islEFTOpen = false;
  }
}
