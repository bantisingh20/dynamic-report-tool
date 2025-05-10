import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ReportConfig {
  filters: ReportFilter [];//{ column: string; operator: string; value: string }[];
  groupBy: string;
  sortBy: { column: string; direction: string };
  xAxis: string;
  yAxis: string;
}

export interface ReportConfiguration {
  filters: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  groupBy: Array<{
    field: string;
  }>;
  sortBy: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  xAxis: string;
  yAxis: string;
}

export interface ReportDataItem {
  id: number;
  date: string;
  name: string;
  region: string;
  product: string;
  revenue: number;
  quantity: number;
  customer: string;
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

  private configSubject = new BehaviorSubject<ReportConfiguration | null>(null);

  private dummyData: ReportDataItem[] = [
    { id: 1, date: '2025-01-15', name: 'Electronics', region: 'North', product: 'Laptop', revenue: 1200, quantity: 2, customer: 'TechCorp' },
    { id: 2, date: '2025-01-20', name: 'Electronics', region: 'South', product: 'Smartphone', revenue: 800, quantity: 4, customer: 'MobileTech' },
    { id: 3, date: '2025-01-25', name: 'Furniture', region: 'East', product: 'Desk', revenue: 350, quantity: 1, customer: 'HomeOffice' },
    { id: 4, date: '2025-02-01', name: 'Electronics', region: 'West', product: 'Tablet', revenue: 600, quantity: 3, customer: 'TechCorp' },
    { id: 5, date: '2025-02-05', name: 'Furniture', region: 'North', product: 'Chair', revenue: 250, quantity: 2, customer: 'HomeOffice' },
    { id: 6, date: '2025-02-10', name: 'Office', region: 'South', product: 'Stationery', revenue: 150, quantity: 10, customer: 'PaperWorks' },
    { id: 7, date: '2025-02-15', name: 'Electronics', region: 'East', product: 'Laptop', revenue: 1200, quantity: 2, customer: 'MobileTech' },
    { id: 8, date: '2025-02-20', name: 'Office', region: 'West', product: 'Printer', revenue: 400, quantity: 1, customer: 'PaperWorks' },
    { id: 9, date: '2025-03-01', name: 'Furniture', region: 'North', product: 'Bookshelf', revenue: 300, quantity: 1, customer: 'HomeOffice' },
    { id: 10, date: '2025-03-05', name: 'Electronics', region: 'South', product: 'Smartphone', revenue: 900, quantity: 3, customer: 'TechCorp' },
    { id: 11, date: '2025-03-10', name: 'Office', region: 'East', product: 'Stationery', revenue: 200, quantity: 15, customer: 'PaperWorks' },
    { id: 12, date: '2025-03-15', name: 'Furniture', region: 'West', product: 'Desk', revenue: 400, quantity: 1, customer: 'HomeOffice' }
  ];

   getConfiguration(): Observable<ReportConfiguration | null> {
    return this.configSubject.asObservable();
  }
  
  saveConfiguration(config:any): void {
    this.configSubject.next(config);
    localStorage.setItem('reportConfig', JSON.stringify(config));
  }

  loadStoredConfiguration(): void {
    const storedConfig = localStorage.getItem('reportConfig');
    if (storedConfig) {
      this.configSubject.next(JSON.parse(storedConfig));
    }
  }
  
  clearConfiguration(): void {
    this.configSubject.next(null);
    localStorage.removeItem('reportConfig');
  }
  
  // Method to get dummy data
  getDummyData(): ReportDataItem[] {
    return this.dummyData;
  }
  
  // Method to apply filters
  applyFilters(data: ReportDataItem[], filters: Array<{field: string; operator: string; value: string}>): ReportDataItem[] {
    if (!filters || filters.length === 0) {
      return data;
    }
    
    return data.filter(item => {
      return filters.every(filter => {
        if (!filter.field || !filter.operator || filter.value === undefined || filter.value === '') {
          return true; // Skip incomplete filters
        }
        
        const itemValue = item[filter.field as keyof ReportDataItem];
        const filterValue = filter.value;
        
        switch(filter.operator) {
          case 'equals':
            return String(itemValue) === filterValue;
          case 'not equals':
            return String(itemValue) !== filterValue;
          case 'greater than':
            return Number(itemValue) > Number(filterValue);
          case 'less than':
            return Number(itemValue) < Number(filterValue);
          case 'contains':
            return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
          case 'starts with':
            return String(itemValue).toLowerCase().startsWith(filterValue.toLowerCase());
          case 'ends with':
            return String(itemValue).toLowerCase().endsWith(filterValue.toLowerCase());
          default:
            return true;
        }
      });
    });
  }
  
  // Method to sort data
  applySorting(data: ReportDataItem[], sortBy: Array<{field: string; direction: 'asc' | 'desc'}>): ReportDataItem[] {
    if (!sortBy || sortBy.length === 0) {
      return data;
    }
    
    return [...data].sort((a, b) => {
      for (const sort of sortBy) {
        if (!sort.field) continue;
        
        const fieldA = a[sort.field as keyof ReportDataItem];
        const fieldB = b[sort.field as keyof ReportDataItem];
        
        if (fieldA < fieldB) {
          return sort.direction === 'asc' ? -1 : 1;
        }
        if (fieldA > fieldB) {
          return sort.direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }
  
  // Method to group data
  applyGrouping(data: ReportDataItem[], groupBy: Array<{field: string}>): Record<string, ReportDataItem[]> {
    if (!groupBy || groupBy.length === 0) {
      return { 'All Data': data };
    }
    
    const groupedData: Record<string, ReportDataItem[]> = {};
    
    data.forEach(item => {
      let groupKey = '';
      
      groupBy.forEach((group, index) => {
        if (!group.field) return;
        
        const fieldValue = String(item[group.field as keyof ReportDataItem]);
        groupKey += index === 0 ? fieldValue : ` - ${fieldValue}`;
      });
      
      if (!groupKey) {
        groupKey = 'Ungrouped';
      }
      
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      
      groupedData[groupKey].push(item);
    });
    
    return groupedData;
  }
  
  // Prepare data for chart based on X and Y axes
  prepareChartData(data: ReportDataItem[], xAxis: string, yAxis: string): {label: string; value: number}[] {
    if (!xAxis || !yAxis) {
      return [];
    }
    
    const chartData: Record<string, number> = {};
    
    data.forEach(item => {
      const xValue = String(item[xAxis as keyof ReportDataItem]);
      const yValue = Number(item[yAxis as keyof ReportDataItem]);
      
      if (!chartData[xValue]) {
        chartData[xValue] = 0;
      }
      
      chartData[xValue] += yValue;
    });
    
    return Object.entries(chartData).map(([label, value]) => ({ label, value }));
  }
  
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
