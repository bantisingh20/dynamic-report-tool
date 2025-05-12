import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MultiSelect, MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ButtonModule,MultiSelectModule,CommonModule,FormsModule,DropdownModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'client';
selectedCities: any;
cities: any[]|undefined;

toggleDarkMode() {
    const element = document.querySelector('html');
    element!.classList.toggle('my-app-dark');
}

 private themeLinkId = 'app-theme';


themes = [
  { name: 'Teal', value: 'lara-teal' },
  { name: 'Blue', value: 'lara-light-blue' },
  { name: 'Dark', value: 'lara-dark-purple' }
];

onThemeChange(theme: string) {
  this.switchTheme(theme);
}

switchTheme(themeName: string): void {
    const themeLink = document.getElementById('app-theme') as HTMLLinkElement;

    if (themeLink) {
      themeLink.href = `assets/themes/${themeName}/theme.css`;
    } else {
      const linkEl = document.createElement('link');
      linkEl.id = 'app-theme';
      linkEl.rel = 'stylesheet';
      linkEl.href = `assets/themes/${themeName}/theme.css`;
      document.head.appendChild(linkEl);
    }
  }

ngOnInit() {
        this.cities = [
            {name: 'New York', code: 'NY'},
            {name: 'Rome', code: 'RM'},
            {name: 'London', code: 'LDN'},
            {name: 'Istanbul', code: 'IST'},
            {name: 'Paris', code: 'PRS'}
        ];
    }

}
