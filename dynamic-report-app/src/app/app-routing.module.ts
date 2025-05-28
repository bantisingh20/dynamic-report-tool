import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportConfigComponent } from './components/report-config/report-config.component';
import { ListReportComponent } from './components/list-report/list-report.component';
import { CustomTableComponent } from './components/custom-table/custom-table.component';
import { MultiStepFormComponent } from './components/multi-step-form/multi-step-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'List-Report', pathMatch: 'full' },
  { path: 'Create-Custom-Report/:id', component: ReportConfigComponent },
  { path: 'Reprot/View/:id', component: CustomTableComponent },
  { path: 'Create-Custom-Report', component: ReportConfigComponent },
  { path: 'List-Report', component: ListReportComponent },
  { path: '**', redirectTo: 'List-Report' }  // <- wildcard route
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
