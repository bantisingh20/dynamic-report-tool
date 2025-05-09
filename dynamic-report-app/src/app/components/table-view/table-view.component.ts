import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-table-view',
  standalone: false,
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.css'
})
export class TableViewComponent  implements OnInit {

  headers: string[] = ['Category', 'Date', 'Value'];

  // Dynamic rows for the table
  rows: any[] = [
    { category: 'A', date: '2024-01-11', value: 1100 },
    { category: 'A', date: '2025-01-03', value: 1350 },
    { category: 'A', date: '2023-01-21', value: 1600 },
    { category: 'A', date: '2026-01-03', value: 1550 },
    { category: 'A', date: '2022-01-01', value: 1010 },
    { category: 'A', date: '2023-01-13', value: 1520 },
    { category: 'A', date: '2021-01-21', value: 100 },
    { category: 'A', date: '2023-01-13', value: 1570 },
    { category: 'A', date: '2023-01-29', value: 900 },
    { category: 'A', date: '2023-01-03', value: 1550 },

    { category: 'B', date: '2023-01-02', value: 2300 },
    { category: 'B', date: '2023-01-02', value: 2020 },
    { category: 'B', date: '2023-01-02', value: 2010 },
    { category: 'B', date: '2023-01-02', value: 2200 },
    { category: 'B', date: '2023-01-02', value: 2050 },

    { category: 'C', date: '2023-02-04', value: 50 },
    { category: 'C', date: '2023-04-14', value: 150 },
    { category: 'C', date: '2023-05-24', value: 530 },
    { category: 'C', date: '2023-09-04', value: 501 },  
    { category: 'C', date: '2023-01-04', value: 450 },
    // Add more rows as needed...
  ];

   // Pagination state
   currentPage: number = 1;
   itemsPerPage: number = 5; // Default items per page
   totalPages: number = 0;

  // Columns and filters
  columns = ['category', 'date', 'value'];
  filters = {
    category: '',  // Example of a default filter
  };
  selectedColumn: string = 'Category'; 
  
  selectedGroup: string | null = null; // Track which group is currently expanded
  orderedHeaders: string[] = this.headers;
  groupedRows: any[] = []; // Grouped rows based on selected column
  // For Sorting
  currentSortColumn: string | null = null;
  currentSortAsc: boolean = true;

  ngOnInit(): void {
    this.totalPages = Math.ceil(this.rows.length / this.itemsPerPage); // Calculate total pages
    this.groupByColumn('');
  }

// Helper Method to Group Rows
// Group by selected column and adjust column order
groupByColumn(column: string) {
  // Reorder headers: move selected column to the front
  this.headers = [column, ...this.columns.filter(col => col !== column)];

  const grouped = this.rows.reduce((acc, row) => {
    const groupKey = row[column.toLowerCase()]; // Convert to lowercase to match the object keys
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(row);
    return acc;
  }, {});

  this.groupedRows = Object.keys(grouped).map((key) => ({
    group: key,
    rows: grouped[key],
    expanded: false,  // Initially collapse all groups
  }));
}

 // Toggle Expansion of Group
 toggleGroup(group: string) {
  const groupIndex = this.groupedRows.findIndex((g) => g.group === group);
  if (groupIndex !== -1) {
    this.groupedRows[groupIndex].expanded = !this.groupedRows[groupIndex].expanded;
  }
}


  // Helper Methods
  // Handle sorting on column click
  sortData(column: string) {
    if (this.currentSortColumn === column) {
      this.currentSortAsc = !this.currentSortAsc;  // Toggle sort direction
    } else {
      this.currentSortColumn = column;
      this.currentSortAsc = true;  // Set to ascending when a new column is selected
    }

    // Sort the rows based on the currentSortColumn and direction
    this.rows.sort((a, b) => {
      const key = column.toLowerCase(); // Get the column in lowercase to match object keys
      if (a[key] > b[key]) return this.currentSortAsc ? 1 : -1;
      if (a[key] < b[key]) return this.currentSortAsc ? -1 : 1;
      return 0;
    });
  }
  // Apply Filters
  applyFilters() {
    
  }

  onCategoryFilterChange(category: string) {
    this.filters.category = category;
    // Optionally, trigger filtering here if you want instant update
  }


   // Get Paginated Rows
   getPaginatedRows() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.rows.slice(startIndex, endIndex);
  }

  // Change Items per Page
  onItemsPerPageChange(value: number) {
    this.itemsPerPage = value;
    this.currentPage = 1; // Reset to first page
    this.totalPages = Math.ceil(this.rows.length / this.itemsPerPage); // Recalculate total pages
  }

  // Navigate to Next Page
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // Navigate to Previous Page
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Navigate to a Specific Page
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
   
}
