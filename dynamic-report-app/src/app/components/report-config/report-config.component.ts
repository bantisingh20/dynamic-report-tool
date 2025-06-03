import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReportConfigService } from '../../service/report-config.service';
import { MetadataService } from '../../service/metadata.service';
import { NotificationService } from '../../service/NotificationService.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

declare var bootstrap: any;
@Component({
  selector: 'app-report-config',
  standalone: false,
  templateUrl: './report-config.component.html',
  styleUrl: './report-config.component.css'
})
export class ReportConfigComponent implements OnInit {
  originalTablesAndViews: any[] = [];
  previewMode: 'report' | 'chart' | null = null;
  showPreviewButtons: boolean = false;
  previewData: any;
  ChartData: any[] = [];
  displayedColumns: string[] = [];
  showPreview = false;
  operators: string[] = ['between', 'equals', 'not equals', 'greater than', 'less than', 'contains'];
  operators2 = [
    { label: 'between', symbol: 'between' },
    { label: 'equals', symbol: '=' },
    { label: 'not equals', symbol: '≠' },
    { label: 'greater than', symbol: '>' },
    { label: 'less than', symbol: '<' },
    { label: 'greater than equal to', symbol: '>=' },
    { label: 'less than equal to', symbol: '<=' },
    { label: 'contains', symbol: 'like' }, // or use 'includes' icon like '∈'
  ];

  stringTypes: string[] = ['varchar', 'character varying', 'character', 'char', 'text', 'citext'];
  Countoperators: string[] = ['sum', 'count', 'average', 'max', 'min'];
  numberTypes: string[] = ['integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'serial', 'bigserial'];
  dateTypes: string[] = ['date', 'timestamp', 'timestamp with time zone', 'timestamp without time zone'];
  booleanTypes: string[] = ['boolean'];
  tablesAndViews: any[] = [];
  availableFields: any[] = [];
  selectedcolumns: any[] = [];
  showColumnsAndGroupBy: boolean = true;
  showXYConfig: boolean = true;
  reportId: string | null = null;
  mode: string | null = null;

  reportForm = new FormGroup({
    fieldtype: new FormControl('summary', Validators.required),
    tableandview: new FormControl([], [Validators.required, minSelectedCheckboxes(1)]),
    reportname: new FormControl(),
    selectedcolumns: new FormControl([]),//.minSelectedCheckboxes(1)
    filters: new FormArray([]),
    groupby: new FormArray([]),
    sortby: new FormArray([]),
    xyaxis: new FormArray([])
  });


  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute, private notificationService: NotificationService, private metadataService: MetadataService, private fb: FormBuilder, private reprotconfig: ReportConfigService) { }

  ngOnInit() {
    this.availableFields = [];
    this.selectedcolumns = [];
    this.metadataService.getTablesAndViews().subscribe(data => {
      // console.log(data)
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



  onFieldTypeChange() {
    const fieldType = this.reportForm.get('fieldtype')?.value;

    // Show/Hide sections based on selection
    if (fieldType === 'count') {
      this.showColumnsAndGroupBy = false;
      this.showXYConfig = true;
      console.log(this.availableFields);
      this.selectedcolumns = [...this.availableFields];
      this.reportForm.get('selectedcolumns')?.clearValidators();
      this.reportForm.get('selectedcolumns')?.updateValueAndValidity();
    } else if (fieldType === 'summary') {
      this.showColumnsAndGroupBy = true;
      this.showXYConfig = false;
      this.reportForm.get('selectedcolumns')?.setValidators([Validators.required]);
      this.reportForm.get('selectedcolumns')?.updateValueAndValidity();
    }
  }

  loadReportData(id: string): void {
    this.metadataService.getReportById(id).subscribe((response: any) => {
      const data = response.report;

      this.reportForm.patchValue({
        fieldtype: data.fieldtype,
        tableandview: data.table_name,
        reportname: data.report_name,
        selectedcolumns: data.selected_columns,
      });

      this.onFieldTypeChange();

      this.setFormArray('filters', data.filter_criteria);
      this.setFormArray('groupby', data.group_by);
      this.setFormArray('sortby', data.sort_order);
      this.setFormArray('xyaxis', data.axis_config);

      this.metadataService.getAvailableFieldsForTables(data.table_name).subscribe((fields: any[]) => {
        this.availableFields = fields;
        console.log(this.reportForm.get('selectedcolumns'));
        console.log(this.availableFields)
        this.onColumnSelect("");
      });
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
    this.getColumns(selectedTables);

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

        if (relatedTables && relatedTables.length >= 1) {
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
    this.metadataService.getAvailableFieldsForTables(table).subscribe((fields: any[]) => {
      this.availableFields = fields;
    });
  }


  onColumnSelect(event: any) {
    //this.selectedcolumns = [...event]
    if (this.reportForm.get("fieldtype")?.value !== 'count') {
      const selectedValues: string[] = this.reportForm.get('selectedcolumns')?.value || [];
      this.selectedcolumns = this.availableFields.filter(field =>
        selectedValues.includes(field.column_name)
      );
    } else {
      this.selectedcolumns = this.availableFields;
    }
  }


  

  onFieldChange(field: any, index: number): void {

    console.log(field.data_type);
    const filterGroup = this.filters.at(index) as FormGroup;

    // const stringTypes = ['varchar', 'character varying', 'character', 'char', 'text', 'citext'];
    // const numericTypes = ['integer', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision', 'serial', 'bigserial'];
    // const dateTypes = ['date', 'timestamp', 'timestamp without time zone', 'timestamp with time zone', 'time', 'time without time zone', 'time with time zone'];
    // const booleanTypes = ['boolean'];

    let newOperators: string[] = [];

    if (this.numberTypes.includes(field.data_type)) {
      newOperators = ['between', 'equals', 'not equals', 'greater than', 'less than'];
    } else if (this.stringTypes.includes(field.data_type)) {
      newOperators = ['equals', 'not equals', 'contains'];
    } else if (this.dateTypes.includes(field.data_type)) {
      newOperators = ['between', 'equals', 'not equals', 'greater than', 'less than'];
    } else if (this.booleanTypes.includes(field.data_type)) {
      newOperators = ['equals', 'not equals'];
    } else {
      newOperators = []; // default: unsupported type
    }

// this.operators = newOperators.map(op => ({
//     label: op,
//     symbol: operatorMap[op] || op
//   }));
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
      xAxisField: [null, Validators.required],
      xAxisDirection: ['asc'],
      xAxisTransformation: ['daywise'],
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
      this.xyaxis.at(index).get('xAxisTransformation')?.setValue(null);
      this.xyaxis.at(index).get('xAxisTransformation')?.clearValidators();
    }
    this.xyaxis.at(index).get('xAxisTransformation')?.updateValueAndValidity();
  }



  //// Add this method to your component
  getYaxisAggregationOptions(index: number): string[] {
    const yAxisField = this.xyaxis.at(index).get('yAxisField')?.value;
    const field = this.availableFields.find(f => f.column_name === yAxisField);

    // Check if the field is numeric
    if (field && this.numberTypes.includes(field.data_type)) {
      return ['sum', 'count', 'average', 'max', 'min']; // Full list for numeric fields
    } else {
      return ['count', 'max', 'min']; // Limited list for non-numeric fields
    }
  }


  // Check if the X-Axis has date field selected to show transformation options
  showXAxisTransformationOptions(index: number): boolean {
    const xAxisField = this.xyaxis.at(index).get('xAxisField')?.value;
    const field = this.availableFields.find(f => f.column_name === xAxisField);

    if (this.dateTypes.includes(field?.data_type)) {
      return true;
    }
    else {
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
          //this.addNewReport();
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
          //this.addNewReport();
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

  previewReport(): void {

    this.showPreview = false;

    //console.log(this.reportForm.value);
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      console.log('error')
      return;
    }

    const config = { ...this.reportForm.value };

    this.metadataService.getDataforPreview(config).subscribe({
      next: (response: any) => {
        const responseData = response?.data;


        const { data, groupBy, chartData, displayedColumns, showPreview, ischart } = this.metadataService.processPreviewData(responseData);

        this.previewData = { groupBy, data, chartData, ischart };
        this.displayedColumns = displayedColumns;
        this.showPreview = showPreview;

        console.log('API Response:', responseData);

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
    this.ngOnInit();
    this.router.navigate(['Create-Custom-Report']);
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

const operatorMap: { [key: string]: string } = {
    'between': '⇿',
    'equals': '=',
    'not equals': '≠',
    'greater than': '>',
    'less than': '<',
    'contains': '∋', // Or '∈', or even '🔍' for UI
  };