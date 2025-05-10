import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component,OnInit  } from '@angular/core';

interface SortBy {
  column: string;
  order: 'ASC' | 'DESC';
}

interface Filter {
  column: string;
  operator: string;
  value: string;
}

interface ReportConfig {
  table: string;
  selection?: string[];
  filters?: Filter[];
  groupBy?: string[];
  sortBy?: SortBy[];
  groupByString?: string; // temporary holder for group by input
}

@Component({
  selector: 'app-report-creator',
  standalone: false, 
  templateUrl: './report-creator.component.html',
  styleUrl: './report-creator.component.css'
})


export class ReportCreatorComponent implements OnInit {
  tables: any[] = [];
  columns: any[] = [];
  savedReports: any[] = [];
  error: string = '';

  // Report configuration object to be built dynamically.
  reportConfig: ReportConfig = {
    table: '',
    selection: [],
    filters: [],
    groupBy: [],
    sortBy: []
  };

  queryResult: any[] = [];

  // Temporary holders for new filter and sort inputs.
  newFilter: Filter = { column: '', operator: '=', value: '' };
  newSort: SortBy = { column: '', order: 'ASC' };
  reportName: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchTables();
    this.fetchSavedReports();
  }

  // Fetch available tables from the backend.
  fetchTables(): void {
    this.http.get<any>('http://localhost:3000/metadata/tables')
      .subscribe({
        next: data => this.tables = data.tables,
        error: err => this.error = err.error ? err.error.error : 'Error fetching tables'
      });
  }

  // When a table is selected, update config and fetch its columns.
  onTableSelect(event: Event): void {
    const tableName = (event.target as HTMLSelectElement).value;
    this.reportConfig.table = tableName;
    this.http.get<any>(`http://localhost:3000/metadata/columns?table=${tableName}`)
      .subscribe({
        next: data => {
          this.columns = data.columns;
          // Automatically set selection to include all columns.
          this.reportConfig.selection = this.columns.map(col => col.column_name);
        },
        error: err => this.error = err.error ? err.error.error : 'Error fetching columns'
      });
  }

  // Add a new filter to the configuration.
  addFilter(): void {
    if (this.newFilter.column && this.newFilter.operator && this.newFilter.value) {
      this.reportConfig.filters = this.reportConfig.filters || [];
      // Add a copy of newFilter; then reset for the next filter.
      this.reportConfig.filters.push({ ...this.newFilter });
      this.newFilter = { column: '', operator: '=', value: '' };
    }
  }

  // Remove a filter at a specified index.
  removeFilter(index: number): void {
    if (this.reportConfig.filters) {
      this.reportConfig.filters.splice(index, 1);
    }
  }

  // Add a new sort option.
  addSort(): void {
    if (this.newSort.column && this.newSort.order) {
      this.reportConfig.sortBy = this.reportConfig.sortBy || [];
      this.reportConfig.sortBy.push({ ...this.newSort });
      this.newSort = { column: '', order: 'ASC' };
    }
  }

  // Remove a sort option.
  removeSort(index: number): void {
    if (this.reportConfig.sortBy) {
      this.reportConfig.sortBy.splice(index, 1);
    }
  }

  // Execute the report by sending the current configuration to the backend.
  executeReport(): void {
    this.http.post<any>('http://localhost:3000/report/execute', { config: this.reportConfig })
      .subscribe({
        next: data => {
          this.queryResult = data.rows;
          this.error = '';
        },
        error: err => this.error = err.error ? err.error.error : 'Error executing report'
      });
  }

  // Save the current report configuration along with a report name.
  saveReport(): void {
    if (!this.reportName) {
      this.error = 'Please provide a report name';
      return;
    }
    this.http.post<any>('http://localhost:3000/report/save', { reportName: this.reportName, config: this.reportConfig })
      .subscribe({
        next: data => {
          console.log('Report saved with ID:', data.id);
          this.fetchSavedReports();
          this.error = '';
        },
        error: err => this.error = err.error ? err.error.error : 'Error saving report'
      });
  }

  // Fetch all saved reports from the backend.
  fetchSavedReports(): void {
    this.http.get<any>('http://localhost:3000/reports')
      .subscribe({
        next: data => this.savedReports = data.reports,
        error: err => this.error = err.error ? err.error.error : 'Error fetching saved reports'
      });
  }

  // Load a saved report configuration by report ID.
  loadReport(reportId: number): void {
    this.http.get<any>(`http://localhost:3000/report/load/${reportId}`)
      .subscribe({
        next: data => {
          // Expecting config to be stored as JSON. Parse it back into our reportConfig.
          this.reportConfig = JSON.parse(data.report.config);
          this.error = '';
          if (this.reportConfig.table) {
            //this.onTableSelect(this.reportConfig.table);
          }
        },
        error: err => this.error = err.error ? err.error.error : 'Error loading report'
      });
  }
}