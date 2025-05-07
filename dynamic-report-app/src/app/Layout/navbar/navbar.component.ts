import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-layout-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() isOpen = true;
  @Input() parentFunction?: (data: any) => void;
 
  navbarmenuclick() {
    this.isOpen = !this.isOpen;
     
    if (this.parentFunction) {
      this.parentFunction(this.isOpen);  
    } else {
      console.warn('No parentFunction passed');
    }
  }
  
 
  logout(): void {
    localStorage.clear();
    console.log('User logged out');
  }
}
