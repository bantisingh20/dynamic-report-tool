import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dynamic-report-app';
 constructor(private router: Router, private location: Location) {}
   goHome(): void {
    this.router.navigate(['/List-Report']);
  }

  goBack(): void {
    this.location.back();
  }

}
