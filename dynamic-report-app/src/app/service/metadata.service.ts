import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {
  private apiUrl = 'http://localhost:3000/api/metadata';

  constructor(private http: HttpClient) {}

  getTablesAndViews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tables`);
  }

  getColumns(tableName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/columns/${tableName}`);
  }

  getDataforPreview(tableName :any , selectedColumns :any){
    const requestPayload = {
      tableName,
      selectedColumns :Array.from(selectedColumns),
    };

    console.log('Request Payload:', requestPayload);

    return this.http.post<string[]>(`${this.apiUrl}/preview`, requestPayload);
  }

  SaveReportForamt(report :any){
    return this.http.post(this.apiUrl, report);
  }
}
