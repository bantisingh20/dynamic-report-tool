import { Component } from '@angular/core';

@Component({
  selector: 'app-report-builder',
  standalone: false,
  templateUrl: './report-builder.component.html',
  styleUrl: './report-builder.component.css'
})
export class ReportBuilderComponent {
  availableColumns = [
    { name: 'id', type: 'number' },
    { name: 'created_at', type: 'date' },
    { name: 'amount', type: 'number' },
    { name: 'status', type: 'string' }
  ];

  filters = [{ column: '', operator: '=', value: '' }];
  groupBy = '';
  sortBy = { column: '', direction: 'asc' };
  xAxis = '';
  yAxis = '';

  addFilter() {
    this.filters.push({ column: '', operator: '=', value: '' });
  }

  removeFilter(index: number) {
    this.filters.splice(index, 1);
  }

  saveConfig() {
    const config = {
      filters: this.filters,
      groupBy: this.groupBy,
      sortBy: this.sortBy,
      xAxis: this.xAxis,
      yAxis: this.yAxis
    };
    console.log('Saved Config:', config);
    // Optionally store in service or local storage
  }
}
