import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-common-table',
  standalone:false,
  
  templateUrl: './common-table.component.html',
  styleUrls: ['./common-table.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class CommonTableComponent implements OnChanges, AfterViewInit {
  @Input() tabledata: any;

  isGrouped = false;
  groupByKey: string = '';
  displayedColumns: string[] = [];

  // For grouped tables
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
   currentPageIndex: number = 0;
  currentPageSize: number = 5;

  @ViewChildren(MatSort) sorts!: QueryList<MatSort>;

  // For flat table
  flatDataSource = new MatTableDataSource<any>();
  @ViewChild('flatPaginator') flatPaginator!: MatPaginator;
  @ViewChild('flatSort') flatSort!: MatSort;

  get displayedColumnsWithSrno() {
    //'srno',
    return [ ...this.displayedColumns];
  }

  onPageChange(event: any) {
    this.currentPageIndex = event.pageIndex;
    this.currentPageSize = event.pageSize;
  }

  // Method to calculate the global serial number
  calculateGlobalSerialNumber(groupIndex: number, rowIndex: number): number {
    // Global serial number calculation
    let globalIndex = 0;
    for (let i = 0; i < groupIndex; i++) {
      globalIndex += this.tabledata.data[i].dataSource.length;
    }
    return globalIndex + rowIndex + 1;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tabledata'] && this.tabledata) {
      this.isGrouped = Array.isArray(this.tabledata.groupBy) && this.tabledata.groupBy.length > 0;

      if (this.isGrouped) {
        this.groupByKey = this.tabledata.groupBy[0];
        this.displayedColumns = [];

        this.tabledata.data.forEach((group: any) => {
          group.dataSource = new MatTableDataSource(group.records);

          // Detect columns only once from first group's records
          if (!this.displayedColumns.length && group.records?.length) {
            this.displayedColumns = Object.keys(group.records[0]);
          }
        });
      } else {
        // Flat data case
        this.flatDataSource = new MatTableDataSource(this.tabledata.data || []);
        this.displayedColumns = [];

        if (this.flatDataSource.data.length > 0) {
          this.displayedColumns = Object.keys(this.flatDataSource.data[0]);
        }
      }
    }
  }

  ngAfterViewInit() {
    // Assign paginator and sort for grouped tables
    if (this.isGrouped && this.tabledata?.data?.length) {
      this.tabledata.data.forEach((group: any, index: number) => {
        group.dataSource.paginator = this.paginators.toArray()[index];
        group.dataSource.sort = this.sorts.toArray()[index];
      });
    }

    // Assign paginator and sort for flat table
    if (!this.isGrouped) {
      this.flatDataSource.paginator = this.flatPaginator;
      this.flatDataSource.sort = this.flatSort;
    }
  }

  hasData(): boolean {
    if (!this.tabledata) return false;

    if (this.isGrouped) {
      return Array.isArray(this.tabledata.data) &&
        this.tabledata.data.some(
          (group: any) => Array.isArray(group.records) && group.records.length > 0
        );
    } else {
      return Array.isArray(this.tabledata.data) && this.tabledata.data.length > 0;
    }
  }
}