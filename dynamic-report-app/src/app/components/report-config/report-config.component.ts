import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ReportConfigService } from '../../service/report-config.service';
import { MetadataService } from '../../service/metadata.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../service/NotificationService.service';

@Component({
  selector: 'app-report-config',
  standalone: false, 
  templateUrl: './report-config.component.html',
  styleUrl: './report-config.component.css'
})
export class ReportConfigComponent implements OnInit {

  previewData: any[] = [];
  displayedColumns: string[] = [];
  showPreview = false;
  operators: string[] = ['between','equals', 'not equals', 'greater than', 'less than', 'contains'];
  tablesAndViews: any[] = [];   
  availableFields: any[] = [];   
  shouldUpdatePreview: boolean = false;
  
  reportForm = new FormGroup({
    tableandView: new FormControl(null, Validators.required),
    reportName :new FormControl(),
    selectedColumns: new FormControl([]),
    filters: new FormArray([]),
    groupBy: new FormArray([]),
    sortBy: new FormArray([]),
  }); 

  constructor(private notificationService: NotificationService,private metadataService: MetadataService,private fb: FormBuilder, private reprotconfig:ReportConfigService) {}
  
  ngOnInit() {
    this.metadataService.getTablesAndViews().subscribe(data => {
      console.log(data)
      this.tablesAndViews = data;
      this.tablesAndViews = this.tablesAndViews.map(field => ({
      ...field,
      label: `${this.capitalize(field.name)} || ${this.capitalize(field.type)}`
    }));
    });
  }
 
  createFilter(): FormGroup {
    return this.fb.group({
      field: [null, Validators.required],
      operator: ['', Validators.required], 
      value: [''],
      valueFrom: [''],
      valueTo: [''],
      selectedField: null
    });
  }
    
  // 1. Table Change Based on this Bind all Column 

  onTableSelect(selectedItem: any) {
      if(selectedItem == null){
        this.reportForm.get('selectedColumns')?.setValue([]);
        this.availableFields=[];
        return;
      }
      console.log(selectedItem.name); 
      const table = selectedItem.name;
      this.metadataService.getColumns(table).subscribe(cols => {
        this.availableFields = cols;

        this.availableFields = this.availableFields.map(field => ({
          ...field,
          label: this.capitalize(field.column_name)
        }));

        console.log(this.availableFields);
        this.reportForm.get('selectedColumns')?.setValue([]); 
        (this.reportForm.get('filters') as FormArray).clear();
        (this.reportForm.get('groupBy') as FormArray).clear();
        (this.reportForm.get('sortBy') as FormArray).clear();
      });
 
  }

  // For Filter field change based on that bind operator and value data type
    onFieldChange(field: any, index: number): void {
      const filterGroup = this.filters.at(index) as FormGroup;

      const stringTypes = ['varchar', 'character varying', 'character', 'char', 'text', 'citext'];
      const numericTypes = ['integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'serial', 'bigserial'];
      const dateTypes = ['date', 'timestamp', 'timestamp without time zone', 'timestamp with time zone', 'time', 'time without time zone', 'time with time zone'];
      const booleanTypes = ['boolean'];

      let newOperators: string[] = [];

      if (numericTypes.includes(field.data_type)) {
        newOperators = ['between', 'equals', 'not equals', 'greater than', 'less than'];
      } else if (stringTypes.includes(field.data_type)) {
        newOperators = ['equals', 'not equals', 'contains'];
      } else if (dateTypes.includes(field.data_type)) {
        newOperators = ['between', 'equals', 'not equals', 'greater than', 'less than'];
      } else if (booleanTypes.includes(field.data_type)) {
        newOperators = ['equals', 'not equals'];
      } else {
        newOperators = []; // default: unsupported type
      }
        

      this.operators = newOperators;
      filterGroup.patchValue({
          operator: '',
          value: '',
          valueFrom: '',
          valueTo: '',
          selectedField: field
      });
    }
  
    // now when user change operator add valiaiton for the mention field 
    onOperatorChange(index: number): void {
      const filterGroup = this.filters.at(index) as FormGroup;
      const operator = filterGroup.get('operator')?.value;

      if (operator === 'between') {
        filterGroup.get('value')?.clearValidators();
        filterGroup.get('valueFrom')?.setValidators([Validators.required]);
        filterGroup.get('valueTo')?.setValidators([Validators.required]);
      } else {
        filterGroup.get('value')?.setValidators([Validators.required]);
        filterGroup.get('valueFrom')?.clearValidators();
        filterGroup.get('valueTo')?.clearValidators();
      }

      filterGroup.get('value')?.updateValueAndValidity();
      filterGroup.get('valueFrom')?.updateValueAndValidity();
      filterGroup.get('valueTo')?.updateValueAndValidity();
    }


    // return data type for the selected field
    getInputType(dataType: string): string {
 
      const numberTypes = ['integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'serial', 'bigserial'];
      const dateTypes = ['date', 'timestamp', 'timestamp with time zone', 'timestamp without time zone'];
      const booleanTypes = ['boolean'];

      if (numberTypes.includes(dataType)) return 'number';
      if (dateTypes.includes(dataType)) return 'date';
      if (booleanTypes.includes(dataType)) return 'checkbox';

      return 'text'; // fallback
    }


 
    capitalize(str: string): string {
      if (!str) return '';
      const cleanStr = str.replace(/_/g, ' '); // Replace underscores with spaces
      return cleanStr
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    get selectedColumnsControl(): FormControl {
      return this.reportForm.get('selectedColumns') as FormControl;
    }

 
    get filters() {
      return this.reportForm.get('filters') as FormArray;
    }

 
    get groupBy() {
      return this.reportForm.get('groupBy') as FormArray;
    }

    get groupByFields(): string[] {
      return this.reportForm.get('groupBy')?.value.map((g: any) => g.field) || [];
    }

    get sortBy() {
      return this.reportForm.get('sortBy') as FormArray;
    }

    addFilter() {
      this.filters.push(this.createFilter());
    }

    removeFilter(index: number) {
      this.filters.removeAt(index);
    }

    addGrouping() {
      this.groupBy.push(
        new FormGroup({
          field: new FormControl('', Validators.required),
        })
      );
    }

    removeGrouping(index: number) {
      this.groupBy.removeAt(index);
    }

    addSorting() {
      this.sortBy.push(
        new FormGroup({
          field: new FormControl('', Validators.required),
          direction: new FormControl('asc'),
        })
      );
    }

    removeSorting(index: number) {
      this.sortBy.removeAt(index);
    } 

      
    saveConfiguration(): void {

      if (this.reportForm.invalid) {
        this.reportForm.markAllAsTouched(); // show validation messages
        console.log('error')
        return;
      }
      
    const reportName = this.reportForm.get('reportName')?.value;

    if (!reportName || reportName.trim() === '') {
      this.notificationService.showNotification('Report name is required','error');
      return;
    }

    const config = this.reportForm.value;
    this.showPreview=false;
    this.metadataService.SaveReportForamt(config).subscribe({
        next: (response :any) =>{        
          this.notificationService.showNotification(response.message, 'success');
          this.addNewReport();
        },
        error:(err) =>{
          console.error('Error While Saving: ', err.error); 
          this.notificationService.showNotification(err.error.message, 'error');
        }
    }) ;
    console.log('Report configuration:', config);
   
  }


    previewReport(): void {
      
      if (this.reportForm.invalid) {
        this.reportForm.markAllAsTouched(); // show validation messages
        console.log('error')
        return;
      }

      const config = this.reportForm.value; 

      console.log(config);
      this.metadataService.getDataforPreview(config).subscribe({
        next: (response: any) => {
          console.log(response);
          const data = response?.data;
          console.log(data);

          if (Array.isArray(data) && data.length > 0) {
            this.previewData = data;
            this.displayedColumns = Object.keys(data[0]);
            console.log('a');
          } else {
            this.previewData = [];
            this.displayedColumns = [];
            console.log('a1');
          }

          this.shouldUpdatePreview = true;
          this.showPreview = true;
        },
        error: (err) => {
             this.showPreview = false;
          console.error('Error fetching data: ', err.error);
          // Call the notification service to show error
          this.notificationService.showNotification(err.error.message, 'error');
        }
      });

 
    }

    // Clears the form inputs
    clearReport(): void {
      this.showPreview=false;
      this.reportForm.reset();
      (this.reportForm.get('filters') as FormArray).clear();
      (this.reportForm.get('groupBy') as FormArray).clear();
      (this.reportForm.get('sortBy') as FormArray).clear();
      this.reprotconfig.clearConfiguration();
      console.log('Form cleared');
    }

    // Creates a new report configuration
    addNewReport(): void {
      this.reportForm.reset();
      (this.reportForm.get('filters') as FormArray).clear();
      (this.reportForm.get('groupBy') as FormArray).clear();
      (this.reportForm.get('sortBy') as FormArray).clear();
      this.reprotconfig.clearConfiguration();
      console.log('New report initiated');
    }
}
