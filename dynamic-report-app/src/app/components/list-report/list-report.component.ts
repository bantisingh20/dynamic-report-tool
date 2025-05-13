import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Route, Router } from '@angular/router';
import { MetadataService } from '../../service/metadata.service';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';

@Component({
  selector: 'app-list-report',
  standalone: false,
  templateUrl: './list-report.component.html',
  styleUrl: './list-report.component.css',
  encapsulation: ViewEncapsulation.None 
})

export class ListReportComponent implements OnInit,AfterViewInit  {
 selectedConfig: any = null;
viewType: 'report' | 'chart' | null = null;

  constructor(private router: Router, private metadataService: MetadataService){}
  
goToEdit(id: string): void {
  this.router.navigate(['Create-Custom-Report', id], { queryParams: { mode: 'edit' } });
}

previewConfig(id: any) { 
 this.router.navigate(['Reprot/View', id]);
}

previewChart(config: any) {
  this.selectedConfig = config;
  this.viewType = 'chart';
}
 
 displayedColumns: string[] = [];
   
  listData :any[]=[];

  @ViewChild(MatPaginator)
  paginator: MatPaginator = new MatPaginator;

   configs = [];
  
   ngAfterViewInit() {
    //this.loadReport();
  }

  ngOnInit(): void {
    this.loadReport();
  }


  loadReport(){
    
      this.metadataService.getListOfReportConfigure().subscribe({
        next: (response :any) =>{
          this.listData = response.reports;
          // console.log(this.listData );
          // console.log(this.configs);
        }
        ,error :(err) => {
          console.log(err);
        }
      })
  }

  CreateNewConfig() {
   this.router.navigate(['Create-Custom-Report']);
  }
 
  editConfig(config: any) {     
    
    console.log('Edit:', config);
  }

 

  deleteConfig(config: any) {
    console.log('Delete:', config);
  }

   

}



 