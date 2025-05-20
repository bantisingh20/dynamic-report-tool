import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
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
  
 
  
  // Method to apply filters
  // applyFilters(data: ReportDataItem[], filters: Array<{field: string; operator: string; value: string}>): ReportDataItem[] {
  //   if (!filters || filters.length === 0) {
  //     return data;
  //   }
    
  //   return data.filter(item => {
  //     return filters.every(filter => {
  //       if (!filter.field || !filter.operator || filter.value === undefined || filter.value === '') {
  //         return true; // Skip incomplete filters
  //       }
        
  //       const itemValue = item[filter.field as keyof ReportDataItem];
  //       const filterValue = filter.value;
        
  //       switch(filter.operator) {
  //         case 'equals':
  //           return String(itemValue) === filterValue;
  //         case 'not equals':
  //           return String(itemValue) !== filterValue;
  //         case 'greater than':
  //           return Number(itemValue) > Number(filterValue);
  //         case 'less than':
  //           return Number(itemValue) < Number(filterValue);
  //         case 'contains':
  //           return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
  //         case 'starts with':
  //           return String(itemValue).toLowerCase().startsWith(filterValue.toLowerCase());
  //         case 'ends with':
  //           return String(itemValue).toLowerCase().endsWith(filterValue.toLowerCase());
  //         default:
  //           return true;
  //       }
  //     });
  //   });
  // }
  
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


  
 minSelectedCheckboxes(min: number = 1) {
  return function (control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (Array.isArray(value) && value.length >= min) {
      return null;
    }
    return { minSelected: true };
  };
}
}
