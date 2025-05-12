import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportConfigComponent } from './components/report-config/report-config.component';
import { ListReportComponent } from './components/list-report/list-report.component';

const routes: Routes = [
  { path: '', redirectTo: 'List-Report', pathMatch: 'full' },
  { path: 'Create-Custom-Report', component: ReportConfigComponent },
  { path: 'List-Report', component: ListReportComponent },
  { path: '**', redirectTo: 'List-Report' }  // <- wildcard route
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
