import { Component, OnInit } from '@angular/core';
import { MetadataService } from '../../service/metadata.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-report-dynamic',
  standalone: false,
  templateUrl: './report-dynamic.component.html',
  styleUrl: './report-dynamic.component.css'
})
export class ReportDynamicComponent implements OnInit {
  showPreview : boolean =false;
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
    this.showPreview=false; 
  }

  generateDummyData() {
    this.showPreview=true;
    const dummyRows = 5; 
    this.previewData = [];
       
    this.metadataService.getDataforPreview(this.selectedTable,this.selectedColumns).subscribe({
      next: (res) => {
        console.log('View Data for preview:', res);
        this.previewData.push(res)
      },
      error: (err) => {
        console.error('Error saving report:', err);
      }
    });
 
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
 
    alert(`Report "${reportName}" saved! (See console for data)`);
  }
  
  get selectedColumnsArray(): string[] {
    return Array.from(this.selectedColumns);
  }
}
