import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  currentPath: string;
  private apiUrl = 'http://localhost:3000/api/metadata';

  constructor(private http: HttpClient, private router: Router) {
    this.currentPath = this.router.url;
  }

  getTablesAndViews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tables`);
  }

  getColumns(tableName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/columns/${tableName}`);
  }

  getTablesLinkTable(selectedTables: any[]) {
  return this.http.post<any>(`${this.apiUrl}/check-table-relations`, { selectedTables });
}


  getAvailableFieldsForTables(selectedTables: string[]) : Observable<any[]>{
    return this.http.post<any>(`${this.apiUrl}/check-table-relations`, { selectedTables }).pipe(
      map((result: { columnsByTable: { [key: string]: any[] } }) => {
        const columnsByTable = result.columnsByTable || {};

        const fields: any[] = [];

        for (const tableName of selectedTables) {
          const columns = columnsByTable[tableName];
          if (!columns) continue;

          for (const column of columns) {
            fields.push({
              column_name: `${tableName}.${column.column_name}`,
              label: `${tableName} - ${column.column_name}`,
              data_type: column.data_type,
              raw: `${tableName}.column.${column.column_name}`,
            });
          }
        }

        return fields;
      })
    );
  }



  getDataforPreview(config: any) {
    console.log('Request Payload:', config);
    return this.http.post<string[]>(`${this.apiUrl}/report/preview`, config);
  }

  processPreviewData(responseData: any) {

    const rawData = responseData?.data || [];
    const groupBy = responseData?.groupBy || null;
    const chartData = responseData?.chartData || [];

    // Grouped data case
    if (Array.isArray(groupBy) && groupBy.length > 0 && Array.isArray(rawData) && rawData[0]?.records) {
      const firstRecord = rawData[0]?.records?.[0];

      return {
        groupBy,
        data: rawData,
        chartData,
        displayedColumns: firstRecord ? Object.keys(firstRecord) : [],
        showPreview: true
      };
    }

    // Flat data case
    else if (Array.isArray(responseData) && responseData.length > 0) {
      const firstItem = responseData[0];

      return {
        data: responseData,
        chartData,
        displayedColumns: firstItem ? Object.keys(firstItem) : [],
        showPreview: true
      };
    }

    // No data
    else {
      return {
        data: [],
        chartData: [],
        displayedColumns: [],
        showPreview: false
      };
    }
  }


  SaveReportForamt(report: any) {
    return this.http.post(`${this.apiUrl}/report/save/0`, report);
  }

  updateReportFormat(report: any, id: any) {
    return this.http.post(`${this.apiUrl}/report/save/${id}`, report);
  }
  getReportById(id: any) {
    return this.http.get<any>(`${this.apiUrl}/report/${id}`);
  }

  getListOfReportConfigure() {
    return this.http.get<string[]>(`${this.apiUrl}/List-Report`);
  }
}
