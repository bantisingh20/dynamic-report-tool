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
//import { ReportCreatorComponent } from './components/report-creator/report-creator.component';

@NgModule({
  declarations: [
    AppComponent,
    // ReportCreatorComponent,   
    ReportConfigComponent,
    ReportPreviewComponent,
    FormatNamePipe   
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
    MatSnackBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
