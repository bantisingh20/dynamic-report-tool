import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from './material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReportDynamicComponent } from './components/report-dynamic/report-dynamic.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ReportBuilderComponent } from './components/report-builder/report-builder.component';
import { FiltersComponent } from './components/filters/filters.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { ReportConfigComponent } from './components/report-config/report-config.component'; 
import { ReportPreviewComponent } from './components/report-preview/report-preview.component';
@NgModule({
  declarations: [
    AppComponent,
    ReportDynamicComponent,
    ReportBuilderComponent,
    FiltersComponent ,
    TableViewComponent,
    ReportConfigComponent,
    ReportPreviewComponent
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule ,
    ReactiveFormsModule ,
    MaterialModule ,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
