import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../service/NotificationService.service';
import { MetadataService } from '../../service/metadata.service';
import { ReportConfigService } from '../../service/report-config.service';

declare var bootstrap: any;

@Component({
  selector: 'app-multi-step-form',
  standalone: false,
  templateUrl: './multi-step-form.component.html',
  styleUrl: './multi-step-form.component.css'
})

export class MultiStepFormComponent implements OnInit {
   step = 1;

 originalTablesAndViews: any[] = [];
  previewMode: 'report' | 'chart' | null = null;
  showPreviewButtons: boolean = false;
  previewData: any;
  ChartData: any[] = [];
  displayedColumns: string[] = [];
  showPreview = false;
  operators: string[] = ['between', 'equals', 'not equals', 'greater than', 'less than', 'contains'];
  numberTypes: string[] = ['integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'serial', 'bigserial'];
  dateTypes: string[] = ['date', 'timestamp', 'timestamp with time zone', 'timestamp without time zone'];
  booleanTypes: string[] = ['boolean'];
  tablesAndViews: any[] = [];
  availableFields: any[] = [];

  reportId: string | null = null;
  mode: string | null = null;

  reportForm = new FormGroup({
    reportType: new FormControl('summary'), // Now just a simple string
    tableandview: new FormControl<string[]>([]),
    reportname: new FormControl(),
    selectedcolumns: new FormControl([], minSelectedCheckboxes(1)),
    filters: new FormArray([]),
    groupby: new FormArray([]),
    sortby: new FormArray([]),
    xyaxis: new FormArray([])
  });


  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, 
    private notificationService: NotificationService, private metadataService: MetadataService, private fb: FormBuilder, 
    private reprotconfig: ReportConfigService) { }

  ngOnInit() {
    this.metadataService.getTablesAndViews().subscribe(data => {
      console.log(data)
      this.tablesAndViews = data;
      this.tablesAndViews = this.tablesAndViews.map(field => ({
        ...field,
        label: `${this.capitalize(field.name)} || ${this.capitalize(field.type)}`
      }));

      this.originalTablesAndViews = [...this.tablesAndViews];
    });

    // check mode 
    this.route.queryParamMap.subscribe(params => {
      this.mode = params.get('mode');
      this.reportId = this.route.snapshot.paramMap.get('id');
      if (this.mode === 'edit' && this.reportId) {
        this.loadReportData(this.reportId);
      }
    });

  }
 
  loadReportData(id: string): void {
    this.metadataService.getReportById(id).subscribe((response: any) => {
      const data = response.report;

      // Parse PostgreSQL array string to string[]
      const parsedTableNames = this.parsePostgresArray(data.table_name);
      this.getColumns(parsedTableNames)
      // Patch form with parsed values
      this.reportForm.patchValue({
        tableandview: parsedTableNames,  // correctly assign string[] here
        reportname: data.report_name,
        selectedcolumns: data.selected_columns,
      });

      this.setFormArray('filters', data.filter_criteria);
      this.setFormArray('groupby', data.group_by);
      this.setFormArray('sortby', data.sort_order);

      console.log(this.reportForm.value);
    });
  }



  parsePostgresArray(input: string): string[] {
    // Remove the surrounding curly braces and quotes
    return input
      .replace(/^{|}$/g, '')      // Remove leading and trailing curly braces
      .split(',')                 // Split by commas
      .map(item => item.replace(/^"(.*)"$/, '$1')); // Remove double quotes around each item
  }


  closeFilterDrawer() {
    // Optional: Close offcanvas programmatically if needed
    const offcanvasElement = document.getElementById('filterDrawer');
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
    bsOffcanvas?.hide();
  }

  onFilterSaved() {
    const offcanvas = document.getElementById('filterDrawer');
    const bsInstance = bootstrap.Offcanvas.getInstance(offcanvas);
    bsInstance?.hide();
  }


  setFormArray(key: string, values: any[]): void {
    const formArray = this.reportForm.get(key) as FormArray;
    formArray.clear();

    if (values && values.length > 0) {
      values.forEach(val => {

        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch (e) {
            console.error('Error parsing JSON:', val);
            return;
          }
        }


        if (typeof val === 'object' && !Array.isArray(val)) {
          const group = new FormGroup({});
          for (const key in val) {
            if (val.hasOwnProperty(key)) {
              group.addControl(key, new FormControl(val[key]));
            }
          }
          formArray.push(group);
        } else {
          formArray.push(new FormControl(val));
        }
      });
    }

    // console.log(formArray); // For debugging: check the form array structure
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


  onDropdownClose(): void {
    const selectedTables = this.reportForm.get('tableandview')?.value || [];

    if (selectedTables.length === 0) {
      this.tablesAndViews = [...this.originalTablesAndViews];
      return;
    }

    this.metadataService.getAvailableFieldsForTables(selectedTables)
      .subscribe((fields: any[]) => {
        this.availableFields = fields;
      });

    // this.availableFields = this.metadataService.getAvailableFieldsForTables(selectedTables)
    // this.http.post('http://localhost:3000/api/check-table-relations', { selectedTables }).subscribe((result: any) => {
    //   const relatedTables = result.relatedTables || [];
    //   const columnsByTable = result.columnsByTable || {};

    //   const updatedTables = Array.from(new Set([...selectedTables, ...relatedTables]));

    //   this.tablesAndViews = updatedTables.map(name => ({
    //     name,
    //     label: this.capitalize(name),
    //   }));

    //   this.availableFields = [];
    //   for (const tableName of selectedTables) {
    //     const columns = columnsByTable[tableName];
    //     if (!columns) continue;

    //     for (const column of columns) {
    //       this.availableFields.push({
    //         column_name: `${tableName}.${column.column_name}`, // used for binding
    //         label: `${tableName} - ${column.column_name}`,     // shown in dropdown
    //         data_type: column.data_type,                        // store data type
    //         raw: `${tableName}.column.${column.column_name}`   // optional: full path string
    //       });
    //     }
    //   }

    //   console.log(this.availableFields);
    // });
  }


  onTableSelect(selectedItem: any) {

    console.log(selectedItem);
    const selectedTables = this.reportForm.get('tableandview')?.value || [];

    if (selectedTables.length === 0) {
      // If all cleared, reset to full list
      this.tablesAndViews = [...this.originalTablesAndViews];
      return;
    }

    if (selectedTables) {

      this.metadataService.getTablesLinkTable(selectedTables).subscribe((result: any) => {
        const relatedTables = result.relatedTables;
        const columnsByTable = result.columnsByTable;

        if (relatedTables && relatedTables.length > 1) {
          const updatedTables = Array.from(new Set([...selectedTables, ...relatedTables]));

          this.tablesAndViews = updatedTables.map(name => ({
            name,
            label: name
          }));

          console.log("Linked tables found:", relatedTables);
          console.log("Columns:", columnsByTable);
        } else {
          console.log("Selected tables are not related");
        }
      });

      // this.http.post('http://localhost:3000/api/metadata/check-table-relations', { selectedTables })
      //   .subscribe((result: any) => {
      //     const relatedTables = result.relatedTables;
      //     const columnsByTable = result.columnsByTable;

      //     if (relatedTables.length > 1) {

      //       const newRelatedTables = result.relatedTables || [];

      //       // Combine selected + API response
      //       const updatedTables = Array.from(new Set([...selectedTables, ...newRelatedTables]));

      //       // Rebuild tablesAndViews with only the relevant items
      //       this.tablesAndViews = updatedTables.map(name => {
      //         return { name, label: name };
      //       });

      //       console.log("Linked tables found:", relatedTables);
      //       console.log("Columns:", columnsByTable);
      //       // You can now show this in your UI
      //     } else {
      //       console.log("Selected tables are not related");
      //     }
      //   });
    }

    this.reportForm.get('selectedcolumns')?.setValue([]);
    (this.reportForm.get('filters') as FormArray).clear();
    (this.reportForm.get('groupby') as FormArray).clear();
    (this.reportForm.get('sortby') as FormArray).clear();

  }

  getColumns(table: any) {
    // this.metadataService.getColumns(table).subscribe(cols => {
    //   this.availableFields = cols;

    //   this.availableFields = this.availableFields.map(field => ({
    //     ...field, label: this.capitalize(field.column_name)
    //   }));

    //   console.log(this.availableFields);
    // });

    this.metadataService.getAvailableFieldsForTables(table)
      .subscribe((fields: any[]) => {
        this.availableFields = fields;
      });
  }



  onFieldChange(field: any, index: number): void {

    console.log(field.data_type);
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
    return this.reportForm.get('selectedcolumns') as FormControl;
  }


  get filters() {
    return this.reportForm.get('filters') as FormArray;
  }


  get groupBy() {
    return this.reportForm.get('groupby') as FormArray;
  }

  get groupByFields(): string[] {
    return this.reportForm.get('groupby')?.value.map((g: any) => g.field) || [];
  }

  get sortBy() {
    return this.reportForm.get('sortby') as FormArray;
  }

  get xyaxis() {
    return this.reportForm.get('xyaxis') as FormArray;
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

  addXYAxis() {
    const xyAxisGroup = this.fb.group({
      xAxisField: ['', Validators.required],
      xAxisDirection: ['asc'],
      xAxisTransformation: ['raw'],
      yAxisField: ['', Validators.required],
      yAxisDirection: ['asc'],
      yAxisAggregation: ['sum']
    });
    this.xyaxis.push(xyAxisGroup);
  }


  removeXYAxis(index: number) {
    this.xyaxis.removeAt(index);
  }


  // Handle changes in the X-Axis field to show transformation options if needed
  onXAxisFieldChange(index: number) {
    const xAxisField = this.xyaxis.at(index).get('xAxisField')?.value;
    const field = this.availableFields.find(f => f.column_name === xAxisField);

    if (this.dateTypes.includes(field?.data_type)) {
       
      this.xyaxis.at(index).get('xAxisTransformation')?.setValidators([Validators.required]);
    } else {
    
      this.xyaxis.at(index).get('xAxisTransformation')?.clearValidators();
    }
    this.xyaxis.at(index).get('xAxisTransformation')?.updateValueAndValidity();
  }

  // Check if the X-Axis has date field selected to show transformation options
  showXAxisTransformationOptions(index: number): boolean {
    const xAxisField = this.xyaxis.at(index).get('xAxisField')?.value;
    const field = this.availableFields.find(f => f.column_name === xAxisField);
 
    if(this.dateTypes.includes(field?.data_type)){
      return true;
    }
    else{
      return false;
    } 
  }
 
  showYAxisAggregationOptions(index: number): boolean {
    const yAxisField = this.xyaxis.at(index).get('yAxisField')?.value;
    return yAxisField !== '';  
  }

  saveConfiguration(): void {

    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      console.log('error')
      return;
    }

    const reportname = this.reportForm.get('reportname')?.value;

    if (!reportname || reportname.trim() === '') {
      this.notificationService.showNotification('Report name is required', 'error');
      return;
    }

    const config = this.reportForm.value;
    this.showPreview = false;

    if (this.mode === 'edit' && this.reportId) {
      //config.id = this.reportId;
      this.metadataService.updateReportFormat(config, this.reportId).subscribe({
        next: (response: any) => {
          this.notificationService.showNotification(response.message, 'success');
          this.addNewReport();
          this.router.navigateByUrl('List-Report');
        },
        error: (err) => {
          console.error('Error While Updating:', err.error);
          this.notificationService.showNotification(err.error.message, 'error');
        }
      });
    } else {

      this.metadataService.SaveReportForamt(config).subscribe({
        next: (response: any) => {
          this.notificationService.showNotification(response.message, 'success');
          this.addNewReport();
          this.router.navigateByUrl('List-Report');
        },
        error: (err) => {
          console.error('Error While Saving: ', err.error);
          this.notificationService.showNotification(err.error.message, 'error');
        }
      });
    }

    console.log('Report configuration:', config);
  }


  previewChart(): void {

  }
 
  previewReport(): void {

    this.showPreview = false;

    // Simulate an async fetch or set new data
   

    console.log(this.reportForm.value);
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      console.log('error')
      return;
    }

    const config = { ...this.reportForm.value }; 
     
    
    console.log(config) 
    this.metadataService.getDataforPreview(config).subscribe({
      next: (response: any) => {
        const responseData = response?.data;

        // Process the preview data with the helper method
        const { data, groupBy, chartData, displayedColumns, showPreview } = this.metadataService.processPreviewData(responseData);

        this.previewData = { groupBy, data, chartData };
        this.displayedColumns = displayedColumns;
        this.showPreview = showPreview;

        console.log('API Response:', response);

        // Show appropriate data messages
        console.log(this.previewData.data.length);

        if (this.previewData.data.length > 0) {
          console.log(this.previewData);
          this.notificationService.showNotification("Fetch Data Successfully.", 'success');
        } else {
          console.log(this.previewData);
          this.notificationService.showNotification("No Data Found.", 'warning');
        }

         setTimeout(() => {
        //  this.previewData = this.getNewPreviewData(); // fetch or generate data here
          this.showPreview = true;
        }, 0);

      },

      error: (err) => {
        this.previewData = {
          data: [],
          chartData: []
        };
        this.displayedColumns = [];
        this.showPreview = false;

        const message = err?.error?.message || 'Failed to fetch preview data.';
        console.error('Error fetching data:', err);
        this.notificationService.showNotification(message, 'error');
      }
    });

  }

  closeModal() {
    this.showPreview = false;
    this.previewMode = null;

  }

  showReportView() {
    this.showPreview = true;
    this.previewMode = 'report';
  }

  showChartView() {
    this.showPreview = true;
    this.previewMode = 'chart';
  }

  addNewReport(): void {
    this.reportForm.reset();
    (this.reportForm.get('filters') as FormArray).clear();
    (this.reportForm.get('groupby') as FormArray).clear();
    (this.reportForm.get('sortby') as FormArray).clear();
    (this.reportForm.get('xyaxis') as FormArray).clear();
    this.reprotconfig.clearConfiguration();
    console.log('New report initiated');

    this.router.navigate(['/Create-Custom-Report']);
  }

   nextStep() {
    if (this.step < 5) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  onReportTypeChange(type: string) {
    if (type === 'summary') {
      this.step = 2; // Skip directly to the columns setup for Summary
    } else {
      this.step = 2; // Continue to XY configuration for Count
    }
  }
}

 
function minSelectedCheckboxes(min: number = 1) {
  return function (control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (Array.isArray(value) && value.length >= min) {
      return null;
    }
    return { minSelected: true };
  };
}