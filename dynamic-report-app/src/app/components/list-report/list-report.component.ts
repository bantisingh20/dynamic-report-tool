import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { MetadataService } from '../../service/metadata.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { filter } from 'rxjs';

@Component({
  selector: 'app-list-report',
  standalone: false,
  templateUrl: './list-report.component.html',
  styleUrl: './list-report.component.css',
  encapsulation: ViewEncapsulation.None
})

export class ListReportComponent implements OnInit, AfterViewInit {

  selectedConfig: any = null;
  viewType: 'report' | 'chart' | null = null;
  showPreview: boolean = false;
  previewData: { table: any[]; chart: any[] } = { table: [], chart: [] };
  constructor(private router: Router, private metadataService: MetadataService) { }

  displayedColumns: string[] = [];

  listData: any[] = [];

  @ViewChild(MatPaginator)
  paginator: MatPaginator = new MatPaginator;

  configs = [];

  ngAfterViewInit() {
    //this.loadReport();
  }

  ngOnInit(): void {
    this.loadReport();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadReport();
    });

  }


  loadReport() {

    this.metadataService.getListOfReportConfigure().subscribe({
      next: (response: any) => {
        this.listData = response.reports;
      }
      , error: (err) => {
        console.log(err);
      }
    })
  }

  goToEdit(id: string): void {
    this.router.navigate(['Create-Custom-Report', id], { queryParams: { mode: 'edit' } });
  }

  previewConfig(id: any) {
    console.log(id);
    console.log(this.listData);
     const item = this.listData.find(obj => obj.report_id === id); 
     this.metadataService.getDataforPreview(item).subscribe({
      next: (response: any) => {
        console.log(response);
        const data = response?.data;
        const chartData = response?.chartData;
        console.log(data);

        if (Array.isArray(data) && data.length > 0) {
          this.previewData = {
            table: data,
            chart: chartData || []
          };

          this.displayedColumns = Object.keys(data[0]);
          this.showPreview = true;
 
        } else {
          this.previewData = {
            table: [],
            chart: []
          };
          this.displayedColumns = [];

        }

      },
      error: (err) => {

        console.error('Error fetching data: ', err.error);

      }
    });
 
  }

  closeModal() {
    this.showPreview = false;
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



