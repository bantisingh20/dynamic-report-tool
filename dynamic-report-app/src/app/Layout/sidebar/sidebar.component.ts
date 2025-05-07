import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
  label: string;
  link: string;
  icon: string;
  children?: MenuItem[]; // Optional nested items
  expanded?: boolean;    // Controls submenu visibility
}

@Component({
  selector: 'app-layout-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() parentFunction?: (data: boolean) => void;

  @Input() menuItems: MenuItem[] = [];

  navbarmenuclick(): void {
    if (this.parentFunction) {
      this.parentFunction(false);
    } else {
      console.warn('parentFunction is not defined');
    }
  }

  toggleExpand(item: MenuItem): void {
    item.expanded = !item.expanded;
  }
}
