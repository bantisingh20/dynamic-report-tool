import { Component, OnInit } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { RouterOutlet } from '@angular/router';

import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Dropdown, DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { DialogModule } from 'primeng/dialog';

//import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,DialogModule, CommonModule, FormsModule, ButtonModule,TableModule, MenuModule, SelectModule, Menubar, DropdownModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  items: MenuItem[] | undefined;

  title = 'report-tool';
  darkMode: boolean = false;
showFilters = false;

// Toggle Filter Section
toggleFilterSettings() {
  this.showFilters = !this.showFilters;
}


  countries: any[] | undefined;

  selectedCountry: string | undefined = "";
  tableOptions = [
    { label: 'Users Table', value: 'users' },
    { label: 'Orders Table', value: 'orders' },
    { label: 'Products Table', value: 'products' },
    { label: 'Analytics View', value: 'analytics' },
  ];

  constructor(private primeng: PrimeNG, private config: PrimeNG) { }

  availableColumns = ['ID', 'Name', 'Email', 'Phone', 'Status'];
  selectedColumns: string[] = [];

  showFilterDialog: boolean = false;

sortByColumn: string | undefined;
sortOrder: string | undefined;

filters: any[] = [
  { column: '', operator: '=', value: '' }
];

addFilter() {
  this.filters.push({ column: '', operator: '=', value: '' });
}

removeFilter(index: number) {
  this.filters.splice(index, 1);
}

applyFilters() {
  // Implement logic for applying sort and filter
  console.log('Sorting:', this.sortByColumn, this.sortOrder);
  console.log('Filters:', this.filters);
  this.showFilterDialog = false;
}


  moveToSelected(column: string) {
    this.selectedColumns.push(column);
    this.availableColumns = this.availableColumns.filter(col => col !== column);
  }

  moveToAvailable(column: string) {
    this.availableColumns.push(column);
    this.selectedColumns = this.selectedColumns.filter(col => col !== column);
  }

  moveAllToSelected() {
    this.selectedColumns = [...this.selectedColumns, ...this.availableColumns];
    this.availableColumns = [];
  }

  moveAllToAvailable() {
    this.availableColumns = [...this.availableColumns, ...this.selectedColumns];
    this.selectedColumns = [];
  }

 
previewData:any[] = [];
//dfilters = {};
sortBy = '';
groupBy = '';

  applyFilter(event: any, column: string) {
    // const filterValue = event.target.value.toLowerCase();
    // this.filteredData = this.originalData.filter(row => row[column]);
  }

onTableSelect(event: any) {
  const selectedTable = event.value;
  this.availableColumns = this.getTableColumns(selectedTable);
}



// Column Selection Logic
addColumn(column: string) {
  this.selectedColumns.push(column);
  this.availableColumns = this.availableColumns.filter(col => col !== column);
}

removeColumn(column: string) {
  this.availableColumns.push(column);
  this.selectedColumns = this.selectedColumns.filter(col => col !== column);
}

// Apply Filter, Sort, and Group By
setFilter(event: any) {
 // this.filters[event.value] = true;
}

setSortBy(event: any) {
  this.sortBy = event.value;
}

setGroupBy(event: any) {
  this.groupBy = event.value;
}

// Save Filter Settings in Local Storage
saveFilterSettings() {
  const filterData = { filters: this.filters, sortBy: this.sortBy, groupBy: this.groupBy };
  localStorage.setItem('filterSettings', JSON.stringify(filterData));
}

// Load Data with Filters from Local Storage
loadData() {
  const storedSettings = JSON.parse(localStorage.getItem('filterSettings') || '{}');
  this.filters = storedSettings.filters || {};
  this.sortBy = storedSettings.sortBy || '';
  this.groupBy = storedSettings.groupBy || '';
  this.previewData = this.fetchData(this.selectedColumns, this.filters, this.sortBy, this.groupBy);
}


// Dummy function to get table columns
getTableColumns(tableName: string): string[] {
  const tableColumns: Record<string, string[]> = {
  users: ['ID', 'Name', 'Email', 'Phone', 'Status'],
  orders: ['OrderID', 'Customer', 'Amount', 'Date', 'Status'],
  products: ['ProductID', 'Name', 'Category', 'Price', 'Stock']
};


  return tableColumns[tableName] || [];
}

// Dummy function to fetch data based on selected columns, filters, sort, and group
fetchData(selectedColumns: string[], filters: any, sortBy: string, groupBy: string): any[] {
  // Sample data sets
  const allData:any = {
    users: [
      { ID: 1, Name: 'Alice', Email: 'alice@example.com', Phone: '1234567890', Status: 'Active' },
      { ID: 2, Name: 'Bob', Email: 'bob@example.com', Phone: '9876543210', Status: 'Inactive' }
    ],
    orders: [
      { OrderID: 101, Customer: 'Alice', Amount: 250, Date: '2025-05-01', Status: 'Completed' },
      { OrderID: 102, Customer: 'Bob', Amount: 120, Date: '2025-05-02', Status: 'Pending' }
    ],
    products: [
      { ProductID: 201, Name: 'Laptop', Category: 'Electronics', Price: 1200, Stock: 10 },
      { ProductID: 202, Name: 'Phone', Category: 'Electronics', Price: 800, Stock: 5 }
    ]
  };



  // Mock filtering, sorting, and grouping
  let data = allData[Object.keys(allData)[0]] || [];

  // Apply column selection
  data = data.map((row:any) => {
    const filteredRow: any = {};
    selectedColumns.forEach(col => {
      filteredRow[col] = row[col];
    });
    return filteredRow;
  });

  // Apply sorting (basic mock)
  if (sortBy) {
    data.sort((a:any, b:any) => a[sortBy] > b[sortBy] ? 1 : -1);
  }

  // Apply grouping (mock)
  if (groupBy) {
    data = data.reduce((acc:any, item:any) => {
      const groupKey = item[groupBy];
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {});
  }

  return data;
}


  ngOnInit() {
    this.primeng.ripple.set(true);
    this.countries = [
      { name: 'Australia', code: 'AU' },
      { name: 'Brazil', code: 'BR' },
      { name: 'China', code: 'CN' },
      { name: 'Egypt', code: 'EG' },
      { name: 'France', code: 'FR' },
      { name: 'Germany', code: 'DE' },
      { name: 'India', code: 'IN' },
      { name: 'Japan', code: 'JP' },
      { name: 'Spain', code: 'ES' },
      { name: 'United States', code: 'US' }
    ];


    this.items = [
      {
        label: 'Home',
        icon: 'pi pi-home'
      },
      {
        label: 'Features',
        icon: 'pi pi-star'
      },
      {
        label: 'Projects',
        icon: 'pi pi-search',
        items: [
          {
            label: 'Components',
            icon: 'pi pi-bolt'
          },
          {
            label: 'Blocks',
            icon: 'pi pi-server'
          },
          {
            label: 'UI Kit',
            icon: 'pi pi-pencil'
          },
          {
            label: 'Templates',
            icon: 'pi pi-palette',
            items: [
              {
                label: 'Apollo',
                icon: 'pi pi-palette'
              },
              {
                label: 'Ultima',
                icon: 'pi pi-palette'
              }
            ]
          }
        ]
      },
      {
        label: 'Contact',
        icon: 'pi pi-envelope'
      }
    ]

    //this.translateService.setDefaultLang('en');
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    const element = document.querySelector('html');
    element!.classList.toggle('my-app-dark');
  }
}

