import { Component, OnInit } from '@angular/core';
import { MetadataService } from '../service/metadata.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-report-dynamic',
  standalone: false,
  templateUrl: './report-dynamic.component.html',
  styleUrl: './report-dynamic.component.css'
})
export class ReportDynamicComponent implements OnInit {
   
  tablesAndViews: any[] = [];
  selectedTable: string | null = null;
  columns: string[] = [];
  selectedColumns: Set<string> = new Set();
 
  previewData: any[] = [];
  constructor(private metadataService: MetadataService) {}
  
  ngOnInit() {
    this.metadataService.getTablesAndViews().subscribe(data => {
      this.tablesAndViews = data;
    });
  }

   onTableSelect(event: Event) {
    const table = (event.target as HTMLSelectElement).value;
    this.selectedTable = table;
    this.selectedColumns.clear();

    this.metadataService.getColumns(table).subscribe(cols => {
      this.columns = cols;
    });
  }
  onCheckboxChange(column: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedColumns.add(column);
    } else {
      this.selectedColumns.delete(column);
    }

    this.generateDummyData();
  }

  generateDummyData() {
    const dummyRows = 5; // you can change to 2 or 10
    this.previewData = [];
  
    for (let i = 0; i < dummyRows; i++) {
      const row: any = {};
      for (const col of this.selectedColumns) {
        row[col] = `${col}_${i + 1}`;
      }
      this.previewData.push(row);
    }
  }

  onSaveReport() {
    const reportName = prompt('Enter a name for your report:');
    if (!reportName) return;

    const data = {
      reportName,
      table: this.selectedTable,
      columns: Array.from(this.selectedColumns)
    };

    this.metadataService.SaveReportForamt(data).subscribe({
      next: (res) => {
        console.log('Report saved:', res);
      },
      error: (err) => {
        console.error('Error saving report:', err);
      }
    });

    //console.log('📝 Report Saved:', data);
    alert(`Report "${reportName}" saved! (See console for data)`);
  }
  
  get selectedColumnsArray(): string[] {
    return Array.from(this.selectedColumns);
  }
}
