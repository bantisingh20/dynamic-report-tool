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

  constructor(private http: HttpClient) {}

  ngOnInit() { 
     this.getChartData(ChartType.ColumnChart);
  }
  
  getChartData(chartType: ChartType) {
    const apiUrl = '';
    
    if (apiUrl) {
      this.http.get<any[]>(apiUrl).subscribe((data) => {
        this.processChartData(chartType, data);   
      });
    }
  }

  // Process data based on the chart type
  processChartData(chartType: ChartType, data: any[]) {
    switch (chartType) {
      case ChartType.ColumnChart:
        this.chartColumns = ['Year', 'Sales'];
        this.chartData = data.map(item => [item.year, item.sales]);
        this.chartOptions = {
          title: 'Sales Over Time',
          hAxis: { title: 'Year' },
          vAxis: { title: 'Sales' },
          colors: ['#4caf50']
        };
        break;
        
      case ChartType.PieChart:
        this.chartColumns = ['Category', 'Value'];
        this.chartData = data.map(item => [item.category, item.value]);
        this.chartOptions = {
          title: 'Expenses Distribution',
          is3D: true,
          colors: ['#ff5722', '#2196f3', '#8bc34a']
        };
        break;
        
      case ChartType.LineChart:
        this.chartColumns = ['Month', 'Revenue'];
        this.chartData = data.map(item => [item.month, item.revenue]);
        this.chartOptions = {
          title: 'Revenue Over Time',
          hAxis: { title: 'Month' },
          vAxis: { title: 'Revenue' },
          legend: { position: 'bottom' },
          curveType: 'function'
        };
        break;

      // Add other chart types as needed...
      
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
