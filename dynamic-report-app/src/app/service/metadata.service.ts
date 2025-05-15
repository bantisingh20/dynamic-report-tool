import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  currentPath: string;
  private apiUrl = 'http://localhost:3000/api/metadata';

  constructor(private http: HttpClient,private router: Router) {
    this.currentPath = this.router.url;
  }

  getTablesAndViews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tables`);
  }

  getColumns(tableName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/columns/${tableName}`);
  }

  getDataforPreview(config :any){
    console.log('Request Payload:', config);
    return this.http.post<string[]>(`${this.apiUrl}/report/preview`, config);
  }

  SaveReportForamt(report :any){
    return this.http.post(`${this.apiUrl}/report/save/0`, report);
  }

  updateReportFormat(report :any,id :any){
    return this.http.post(`${this.apiUrl}/report/save/${id}`, report);
  }
  getReportById(id :any){
    return this.http.get<any>(`${this.apiUrl}/report/${id}`);
  }

  getListOfReportConfigure(){
     return this.http.get<string[]>(`${this.apiUrl}/List-Report`);
  }
}
