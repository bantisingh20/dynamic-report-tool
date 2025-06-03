import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Route, Router } from '@angular/router';
import { MetadataService } from '../../service/metadata.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { filter } from 'rxjs';
import { NotificationService } from '../../service/NotificationService.service';

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
  previewData: any;
  constructor(private router: Router, private metadataService: MetadataService, private notificationService: NotificationService) { }

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
        this.notificationService.showNotification("Something Went Wrong", 'error');
      }
    })
  }

  goToEdit(id: string): void {
    this.router.navigate(['Create-Custom-Report', id], { queryParams: { mode: 'edit' } });
  }

  previewConfig(id: any) {
    //console.log(id);
    //console.log(this.listData);
    const item = this.listData.find(obj => obj.report_id === id);

    const config = { ...item };
    //console.log(config);
     
    this.metadataService.getDataforPreview(config).subscribe({
      next: (response: any) => {
        const responseData = response?.data;
        console.log('API Response:', responseData);
        const { data, groupBy, chartData, displayedColumns, showPreview,ischart } = this.metadataService.processPreviewData(responseData);

        this.previewData = { groupBy, data,ischart, chartData, config, tableName: config.table_name || config.tableandview || 'Unknown' };
        this.displayedColumns = displayedColumns;
        this.showPreview = showPreview;

       

         if (this.previewData.data.length > 0) {
          //console.log(this.previewData);
          this.notificationService.showNotification("Fetch Data Successfully.", 'success');
        } else {
          //console.log(this.previewData);
          this.notificationService.showNotification("No Data Found.", 'warning');
        }
      },

      error: (err) => {
        this.previewData = {
          data: [],
          chartData: [],
          tableName: ''
        };
        this.displayedColumns = [];
        this.showPreview = false;

        const message = err?.error?.message || 'Failed to fetch preview data.';
        console.error('Error fetching data:', err);
        this.notificationService.showNotification(err.error.message, 'error');
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



