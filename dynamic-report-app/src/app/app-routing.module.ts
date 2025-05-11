import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportConfigComponent } from './components/report-config/report-config.component';

const routes: Routes = [
   { path: '', redirectTo: 'Create-Custom-Report', pathMatch: 'full' },
   {path :'Create-Custom-Report', component:ReportConfigComponent}
  // {
  //   path: '',
  //   component: LayoutComponent, 
  //   children: [
  //     { path: 'configure-report', component: ReportDynamicComponent },
  //     { path: 'view-Report', component: ReportBuilderComponent },
  //   ]
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
