import { Injectable } from '@angular/core';

export interface ReportConfig {
  filters: ReportFilter [];//{ column: string; operator: string; value: string }[];
  groupBy: string;
  sortBy: { column: string; direction: string };
  xAxis: string;
  yAxis: string;
}

interface ReportFilter {
   column: string;
    operator: string;
    value?: string;         // for normal operators
    valueStart?: string;    // for BETWEEN
    valueEnd?: string;  
}


@Injectable({
  providedIn: 'root'
})
export class ReportConfigService {
  private config: ReportConfig = {
    filters: [],
    groupBy: '',
    sortBy: { column: '', direction: 'asc' },
    xAxis: '',
    yAxis: ''
  };

  getConfig(): ReportConfig {
    return this.config;
  }

  updateConfig(newConfig: ReportConfig): void {
    this.config = { ...newConfig };
  }

  resetConfig(): void {
    this.config = {
      filters: [],
      groupBy: '',
      sortBy: { column: '', direction: 'asc' },
      xAxis: '',
      yAxis: ''
    };
  }
}
