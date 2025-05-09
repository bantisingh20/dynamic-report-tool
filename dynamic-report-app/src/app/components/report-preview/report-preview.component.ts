import { Component,OnInit  } from '@angular/core';
import { ReportConfigService, ReportConfiguration, ReportDataItem } from '../../service/report-config.service';

@Component({
  selector: 'app-report-preview',
  standalone: false,
  templateUrl: './report-preview.component.html',
  styleUrl: './report-preview.component.css'
})
export class ReportPreviewComponent implements OnInit {
  originalData: ReportDataItem[] = [];
  filteredData: ReportDataItem[] = [];
  groupedData: Record<string, ReportDataItem[]> = {};
  chartData: {label: string; value: number}[] = [];
  
  currentConfig: ReportConfiguration | null = null;
  
  
  // For table display, ensure it's a valid key of ReportDataItem
displayedColumns: (keyof ReportDataItem)[] = ['date', 'category', 'region', 'product', 'revenue', 'quantity', 'customer'];

  constructor(private reportConfigService: ReportConfigService) { }

  ngOnInit(): void {
    this.originalData = this.reportConfigService.getDummyData();
    
    
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
    this.filteredData = this.reportConfigService.applyFilters(
      this.originalData, 
      this.currentConfig.filters
    );
    
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