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
  @Input() showFilter: boolean = false;

  groupedData: { [key: string]: any[] } = {};
  groupKeys: string[] = [];

  pageSizes = [5, 10, 15, 20]; // Array of available page sizes
  pageSize = 10; // Default page size
  paginatedData: { [key: string]: any[] } = {}; // Paginated data for each group
  groupPageSizes: { [groupKey: string]: number } = {};

  currentPages: { [key: string]: number } = {};
  totalPages: { [key: string]: number } = {};
  shouldUpdatePreview: boolean = false;
  constructor() { }

  ngOnInit(): void {
    this.processGrouping();
    this.updatePagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['groupBy']) {
      this.processGrouping();
      this.updatePagination();
      this.shouldUpdatePreview = false;
    }
  }

  private processGrouping(): void {

    if (!this.groupBy || this.groupBy.length === 0) {
      this.groupedData = { 'All Data': this.data };
      this.groupKeys = ['All Data'];
      return;
    }

    const grouped: { [key: string]: any[] } = {};

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
    this.paginatedData = {};

    for (const groupKey of this.groupKeys) {
      const groupData = this.groupedData[groupKey];
      const total = Math.ceil(groupData.length / this.pageSize);
      this.totalPages[groupKey] = total;

      if (!this.currentPages[groupKey] || this.currentPages[groupKey] > total) {
        this.currentPages[groupKey] = 1;
      }

      const startIndex = (this.currentPages[groupKey] - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.paginatedData[groupKey] = groupData.slice(startIndex, endIndex);
    }
  }

  paginateData() {
    for (const groupKey of this.groupKeys) {
      const groupData = this.groupedData[groupKey];
      const pageSize = this.groupPageSizes[groupKey] || this.pageSize;
      const currentPage = this.currentPages[groupKey] || 1;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      this.paginatedData[groupKey] = groupData.slice(startIndex, endIndex);
    }
  }


  changePage(groupKey: string, direction: string) {
    const current = this.currentPages[groupKey] || 1;
    const total = this.totalPages[groupKey] || 1;
    console.log(`Before change - Group: ${groupKey}, Current Page: ${current}, Total: ${total}`);

    if (direction === 'previous' && current > 1) {
      this.currentPages[groupKey] = current - 1;
    } else if (direction === 'next' && current < total) {
      this.currentPages[groupKey] = current + 1;
    }

    console.log(`After change - Group: ${groupKey}, New Current Page: ${this.currentPages[groupKey]}`);
    this.paginateData();
  }


  onGroupPageSizeChange(groupKey: string) {
    this.currentPages[groupKey] = 1;
    const pageSize = this.groupPageSizes[groupKey];
    const groupData = this.groupedData[groupKey];
    this.totalPages[groupKey] = Math.ceil(groupData.length / pageSize);
    this.paginatedData[groupKey] = groupData.slice(0, pageSize);
  }

  onPageSizeChange() {
    for (const groupKey of this.groupKeys) {
      this.currentPages[groupKey] = 1;
    }
    this.updatePagination();
  }

}
