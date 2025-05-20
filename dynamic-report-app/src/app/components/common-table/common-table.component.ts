import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-common-table',
  standalone: false,
  templateUrl: './common-table.component.html',
  styleUrl: './common-table.component.css'
})
export class CommonTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];  // Input data passed by the user
   @Input() datas: any;
  @Input() groupByFields: string[] = [];  // Fields to group by
  @Input() isGrouped: boolean = false;  // Whether data is grouped or not
  @Input() itemsPerPage: number = 5;  // Default items per page

  flatDataSource = new MatTableDataSource<any>();
  groupedData: any[] = [];
  pagedFlatRows: any[] = [];
  flatCurrentPage: number = 1;

  // Dynamically generate columns based on the data
  displayedColumns: string[] = [];

  constructor() {}

  ngOnInit(): void {
   console.log('Received Data:');
    // if (this.data && this.data.length) {
     
    //   this.displayedColumns = Object.keys(this.data[0]);
    // }
  //  this.updatePagedFlatRows();
  }

  // Update flat rows based on pagination
  updatePagedFlatRows(): void {
    const start = (this.flatCurrentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.pagedFlatRows = this.data.slice(start, end);
    this.flatDataSource.data = this.pagedFlatRows;
  }

  // Handle flat table pagination
  changeFlatPage(event: PageEvent): void {
    this.flatCurrentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.updatePagedFlatRows();
  }

  // Handle grouped data pagination
  changeGroupPage(groupKey: string, event: PageEvent): void {
    const group = this.groupedData.find(g => g.key === groupKey);
    if (group) {
      group.currentPage = event.pageIndex + 1;
      group.itemsPerPage = event.pageSize;
      this.updatePagedGroupedRecords(groupKey);
    }
  }

  // Update the paged records for grouped data
  updatePagedGroupedRecords(groupKey: string): void {
    const group = this.groupedData.find(g => g.key === groupKey);
    if (group) {
      const start = (group.currentPage - 1) * group.itemsPerPage;
      const end = start + group.itemsPerPage;
      group.pagedRecords = group.records.slice(start, end);
    }
  }

  // Group data based on the groupByFields
  groupData(): void {
    const groupedData = this.data.reduce((acc, row) => {
      const groupKey = this.groupByFields.map(field => row[field]).join('-');
      if (!acc[groupKey]) {
        acc[groupKey] = { key: groupKey, records: [], currentPage: 1, itemsPerPage: this.itemsPerPage, pagedRecords: [] };
      }
      acc[groupKey].records.push(row);
      return acc;
    }, {});

    this.groupedData = Object.values(groupedData);
    this.groupedData.forEach(group => {
      group.pagedRecords = group.records.slice(0, this.itemsPerPage);
    });
  }

  ngOnChanges(): void {
    // if (this.isGrouped) {
    //   this.groupData();
    // } else {
    //   this.updatePagedFlatRows();
    // }
  }
}