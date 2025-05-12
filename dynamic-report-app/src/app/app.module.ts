import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { MatSnackBarModule } from '@angular/material/snack-bar'; 
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { ReportConfigComponent } from './components/report-config/report-config.component'; 
import { ReportPreviewComponent } from './components/report-preview/report-preview.component';
import { FormatNamePipe } from './Pipes/format-name.pipe';
import { CustomTableComponent } from './components/custom-table/custom-table.component';
import { ListReportComponent } from './components/list-report/list-report.component';
//import { ReportCreatorComponent } from './components/report-creator/report-creator.component';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    // ReportCreatorComponent,   
    ReportConfigComponent,
    ReportPreviewComponent,
    FormatNamePipe   ,
    CustomTableComponent,
    ListReportComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule ,
    ReactiveFormsModule ,
    MaterialModule ,
    FormsModule ,
    CommonModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatTableModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
