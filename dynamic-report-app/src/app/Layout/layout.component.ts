import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  isSidebarOpen = false;
  menuItems = [
    { label: 'Configure Report', link: '/configure-report', icon: 'dashboard' },
    { label: 'View Report', link: '/view-Report', icon: 'dashboard' },
    // {
    //   label: 'Master',
    //   link: '',
    //   icon: 'home',
    //   children: [
    //     { label: 'Donation Type', link: '/master/donation-type', icon: 'gift' },
    //     { label: 'User Role', link: '/master/user-role', icon: 'key' },
    //     { label: 'Donation Category', link: '/master/donation-category', icon: 'key' }
    //   ]
    // },
    
 
  ];
  

  handleSidebarOpenClose = (data?: boolean): void => {
    if (typeof data === 'boolean') {
      this.isSidebarOpen = data;
    } else {
      this.isSidebarOpen = !this.isSidebarOpen;
    }
  
   // console.log('Sidebar state is now:', this.isSidebarOpen);
  };
}
