import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MetadataService } from '../../service/metadata.service';

@Component({
  selector: 'app-custom-table',
  standalone: false,
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.css']
})

export class CustomTableComponent implements OnChanges {
  @Input() data: any;
  isGrouped = false;
  itemsPerPage = 10;
  
  // Non-grouped table state
  flatRows: any[] = [];
  pagedFlatRows: any[] = [];
  flatCurrentPage = 1;
  flatColumns: string[] = [];

  // Grouped table state
  groupedPages: { [key: string]: { currentPage: number; pagedRecords: any[] } } = {};
  groupByFields: string[] = [];
  groupColumns: string[] = [];
  Math: any;
  previewData: any;

  constructor(private metadataService : MetadataService){}
  ngOnChanges(changes: SimpleChanges): void {

   // console.log(`coomon report page : ${this.data.tableName}`)
    if (changes['data'] && this.data) {
      this.initTable();
    }
  }

  initTable() {
    // this.isGrouped = Array.isArray(this.data?.groupBy) && this.data.groupBy.length > 0;

    // if (this.isGrouped) {
    //   this.setupGrouped();
    // } else {
    //   this.setupFlat();
    // }

    this.isGrouped = this.data?.groupBy === true; // groupBy is explicitly true

    if (this.isGrouped) {
      this.setupGrouped();  // Proceed with grouped data handling
    } else {
      this.setupFlat();     // Proceed with flat data handling
    }
  }

  setupFlat() {
    this.flatRows = this.data?.data || [];
    this.flatColumns = this.flatRows.length > 0 ? Object.keys(this.flatRows[0]) : [];
    this.flatCurrentPage = 1;
    this.updateFlatPage();
  }

  updateFlatPage() {
    const start = (this.flatCurrentPage - 1) * this.itemsPerPage;
    this.pagedFlatRows = this.flatRows.slice(start, start + this.itemsPerPage);
  }

  changeFlatPage(direction: 'prev' | 'next') {
    const totalPages = Math.ceil(this.flatRows.length / this.itemsPerPage);
    if (direction === 'prev' && this.flatCurrentPage > 1) {
      this.flatCurrentPage--;
    } else if (direction === 'next' && this.flatCurrentPage < totalPages) {
      this.flatCurrentPage++;
    }
    this.updateFlatPage();
  }

  // setupGrouped() {
  //   const groups = this.data.data || [];
  //   this.groupByFields = this.data.groupBy.map((g: any) => g.field);
  //   this.groupedPages = {};

  //   groups.forEach((group: any) => {
  //     const groupKey = this.getGroupKey(group);
  //     const records = group.records || [];

  //     this.groupColumns = records.length > 0 ? Object.keys(records[0]) : this.groupColumns;

  //     this.groupedPages[groupKey] = {
  //       currentPage: 1,
  //       pagedRecords: records.slice(0, this.itemsPerPage)
  //     };
  //   });
  // }

//   setupGrouped() {
//   const groups = this.data.data || [];
//   const groupByKeys = this.data.groupBy || []; // ['orders - status']
//   this.groupByFields = groupByKeys;
//   this.groupedPages = {};

//   groups.forEach((group: any) => {
//     // Dynamically get the value of the group key (e.g., 'shipped')
//     const groupKey = groupByKeys.map((key: string | number) => group[key]).join(' | '); // useful if multiple groupBy fields

//     const records = group.records || [];

//     // Set the column headers from the first record (if available)
//     if (records.length > 0 && (!this.groupColumns || this.groupColumns.length === 0)) {
//       this.groupColumns = Object.keys(records[0]);
//     }

//     // Store paginated group records
//     this.groupedPages[groupKey] = {
//       currentPage: 1,
//       pagedRecords: records.slice(0, this.itemsPerPage),
//     };
//   });
// }

setupGrouped() {
  const groups = this.data?.data || []; // Safely access 'data' if it exists
  const groupByKeys = this.data?.groupBy || []; // If groupBy is not set, default to empty array
  this.groupByFields = groupByKeys; // Save the groupBy keys (fields to group by)
  this.groupedPages = {}; // Initialize the grouped pages

  // Loop through the groups to process each one
  groups.forEach((group: any) => {
    // Dynamically get the value of the group key (handles multiple groupBy fields)
    const groupKey = groupByKeys.map((key: string | number) => {
      return group[key] !== undefined ? group[key] : ''; // If key is undefined, return empty string
    }).join(' | '); // Concatenate multiple keys if there are multiple fields in groupBy

    const records = group?.records || []; // Safely get records, default to an empty array if not available

    // Set the column headers from the first record (if available)
    if (records.length > 0 && (!this.groupColumns || this.groupColumns.length === 0)) {
      this.groupColumns = Object.keys(records[0]); // Use the first record to determine column names
    }

    // Store paginated group records
    // For pagination, we slice based on current page (start from page 1)
    this.groupedPages[groupKey] = {
      currentPage: 1,
      pagedRecords: records.slice(0, this.itemsPerPage), // Adjust slicing for pagination
    };
  });
}



  changeGroupPage(groupKey: string, direction: 'prev' | 'next') {
    const group = this.data.data.find((g: any) => this.getGroupKey(g) === groupKey);
    const allRecords = group.records || [];
    const totalPages = Math.ceil(allRecords.length / this.itemsPerPage);

    const pageData = this.groupedPages[groupKey];
    if (!pageData) return;

    if (direction === 'prev' && pageData.currentPage > 1) {
      pageData.currentPage--;
    } else if (direction === 'next' && pageData.currentPage < totalPages) {
      pageData.currentPage++;
    }

    const start = (pageData.currentPage - 1) * this.itemsPerPage;
    pageData.pagedRecords = allRecords.slice(start, start + this.itemsPerPage);
  }

  getGroupKey(group: any): string {
    return this.groupByFields.map(field => group[field]).join('-');
  }

 
}