import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-custom-table',
  standalone: false,
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.css']
})
export class CustomTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() groupBy: string[] = [];
  @Input() columns: string[] = [];

  groupedData: { [key: string]: any[] } = {};
  groupKeys: string[] = [];

  // Pagination properties
  pageSizes = [5, 10, 15, 20]; // Array of available page sizes
  pageSize = 5; // Default page size
  currentPage = 1; // Current page
  totalPages = 1; // Total number of pages
  paginatedData: { [key: string]: any[] } = {}; // Paginated data for each group

  constructor() {}

  ngOnInit(): void {
    this.processGrouping();
    this.updatePagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['groupBy']) {
      this.processGrouping();
      this.updatePagination();
    }
  }

  private processGrouping(): void {
    // Handle case where no grouping is specified
    if (!this.groupBy || this.groupBy.length === 0) {
      this.groupedData = { 'All Data': this.data };
      this.groupKeys = ['All Data'];
      return;
    }

    const grouped: { [key: string]: any[] } = {};

    // Group the data dynamically based on the groupBy input
    for (const row of this.data) {
      const groupKey = this.groupBy.map(field => row[field]).join(' | ');
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(row);
    }

    this.groupedData = grouped;
    this.groupKeys = Object.keys(grouped);
  }

  updatePagination() {
    // Dynamically calculate total pages for each group based on the page size
    this.totalPages = Math.ceil(this.data.length / this.pageSize);
    this.paginateData();
  }

  paginateData() {
    // Create paginated data dynamically for each group
    this.paginatedData = {};
    for (const groupKey of this.groupKeys) {
      const groupData = this.groupedData[groupKey];
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.paginatedData[groupKey] = groupData.slice(startIndex, endIndex);
    }
  }

  changePage(direction: string) {
    // Change page number based on navigation direction
    if (direction === 'previous' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    }
    this.paginateData();
  }

  onPageSizeChange() {
    // Reset to first page when page size changes
    this.currentPage = 1;
    this.updatePagination();
  }
}
