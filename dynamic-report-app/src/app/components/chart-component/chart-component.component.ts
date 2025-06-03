import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ChartType } from 'angular-google-charts';


@Component({
  selector: 'app-chart-component',
  standalone: false,
  templateUrl: './chart-component.component.html',
  styleUrl: './chart-component.component.css'
})
 
export class ChartComponentComponent implements OnInit {
  @Input() chartDatas: any[] = [];
 
  chartType: ChartType = ChartType.ColumnChart;
  chartData: any[] = [];
  chartColumns: string[] = [];
  chartOptions: any = {};
  chartWidth = 400;
  chartHeight = 400;
  // data : any[]=[ ['year', 'sales'],
  // [1, 1396.035],
  // [2, 1653.069],
  // [3, 1496.28375]]
  constructor(private http: HttpClient) {}

  ngOnInit() { 
     this.getChartData(ChartType.ColumnChart);
  }
  
  getChartData(chartType: ChartType) {
    const apiUrl = '';
    console.log(this.chartDatas);
    this.processChartData(chartType, this.chartDatas); 
  }
 

   
  processChartData(chartType: ChartType, chart: any) {
    switch (chartType) {
      case ChartType.ColumnChart:
         this.chartColumns = chart.data[0]; // First row defines columns
         this.chartData = chart.data.slice(1); // Skip the header row        
         this.chartOptions = {
         title: chart.title,
         hAxis: { title: chart.xAxisLabel },
         vAxis: { title: chart.yAxisLabel },
         colors: ['#4caf50']
        };
        break;
          
      
      default:
        break;
    }
  }

  // Function to handle chart type change
  changeChartType(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (selectElement) {
      const newChartType = selectElement.value as ChartType;
      this.chartType = newChartType;
      this.getChartData(newChartType);  // Fetch data based on new chart type
    }
  }

  // Function to download chart as an image
  downloadChart(chart: any) {
    if (chart && typeof chart.getImageURI === 'function') {
      const imageURI = chart.getImageURI();
      const link = document.createElement('a');
      link.href = imageURI;
      link.download = 'chart.png';
      link.click();
    }
  }
}
