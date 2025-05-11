import { Component,OnInit  } from '@angular/core';
import { ReportConfigService, ReportConfiguration, ReportDataItem } from '../../service/report-config.service';
import { MetadataService } from '../../service/metadata.service';

@Component({
  selector: 'app-report-preview',
  standalone: false,
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.css'
})
export class ReportPreviewComponent implements OnInit {
  originalData: any[] = [];
  filteredData: ReportDataItem[] = [];
  groupedData: Record<string, ReportDataItem[]> = {};
  chartData: {label: string; value: number}[] = []; 
  currentConfig: ReportConfiguration | null = null;
   
  //displayedColumns: (keyof ReportDataItem)[] = ['date', 'name', 'region', 'product', 'revenue', 'quantity', 'customer'];
  displayedColumns :any[] =[];
  
  constructor(private reportConfigService: ReportConfigService,private metadataService:MetadataService) { }

  ngOnInit(): void {
    //this.originalData = this.reportConfigService.getDummyData();
    const config = this.reportConfigService.getConfiguration();
    
    this.metadataService.getDataforPreview(config).subscribe(data =>{
        console.log(data);
        this.originalData = data;
    }); 
    
    this.reportConfigService.getConfiguration().subscribe(config => {
      this.currentConfig = config;
      this.updatePreview();
    });

    console.log(this.currentConfig)
  }
  
  updatePreview(): void {
    if (!this.currentConfig) {
      this.filteredData = this.originalData;
      this.groupedData = { 'All Data': this.originalData };
      this.chartData = [];
      return;
    }
    
    // Apply filters
    // this.filteredData = this.reportConfigService.applyFilters(
    //   this.originalData, 
    //   this.currentConfig.filters
    // );
    
    // Apply sorting
    this.filteredData = this.reportConfigService.applySorting(
      this.filteredData,
      this.currentConfig.sortBy
    );
    
    // Apply grouping
    this.groupedData = this.reportConfigService.applyGrouping(
      this.filteredData,
      this.currentConfig.groupBy
    );
    
    // Prepare chart data
    this.chartData = this.reportConfigService.prepareChartData(
      this.filteredData,
      this.currentConfig.xAxis,
      this.currentConfig.yAxis
    );
  }
  
  // Helper method for template
  getGroupNames(): string[] {
    return Object.keys(this.groupedData);
  }

  maxChartValue(): number {
  if (this.chartData.length === 0) return 0;
  return Math.max(...this.chartData.map(item => item.value));
}
}