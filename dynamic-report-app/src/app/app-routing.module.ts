import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // { path: '', redirectTo: 'table-selector', pathMatch: 'full' },
  // {path :'table-selector', component:ReportDynamicComponent}
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
