import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ReportConfigService } from '../../service/report-config.service';
import { MetadataService } from '../../service/metadata.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../service/NotificationService.service';
import { ChartType } from 'angular-google-charts';
import { ActivatedRoute,Router } from '@angular/router';

@Component({
  selector: 'app-report-config',
  standalone: false, 
  templateUrl: './report-config.component.html',
  styleUrl: './report-config.component.css'
})
export class ReportConfigComponent implements OnInit {
 previewMode: 'report' | 'chart' | null = null;
 showPreviewButtons :boolean=false;
  previewData: { table: any[]; chart: any[] } = { table: [], chart: [] };
  ChartData : any[] =[];
  displayedColumns: string[] = [];
  showPreview = false;
  operators: string[] = ['between','equals', 'not equals', 'greater than', 'less than', 'contains'];
  tablesAndViews: any[] = [];   
  availableFields: any[] = [];   
 
  reportId: string | null = null;
  mode: string | null = null;

  reportForm = new FormGroup({
    tableandView: new FormControl(null, Validators.required),
    reportName :new FormControl(),
    selectedColumns: new FormControl([]),
    filters: new FormArray([]),
    groupBy: new FormArray([]),
    sortBy: new FormArray([]),
    xyaxis: new FormArray([])
  }); 

  constructor(private router: Router,private route: ActivatedRoute,private notificationService: NotificationService,private metadataService: MetadataService,private fb: FormBuilder, private reprotconfig:ReportConfigService) {}
  
  ngOnInit() {
    this.metadataService.getTablesAndViews().subscribe(data => {
      console.log(data)
      this.tablesAndViews = data;
      this.tablesAndViews = this.tablesAndViews.map(field => ({
      ...field,
      label: `${this.capitalize(field.name)} || ${this.capitalize(field.type)}`
    }));
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
      console.log(data);
      this.getColumns(data.table_name); 
      
      this.reportForm.patchValue({
        tableandView: data.table_name,
        reportName: data.report_name,
         selectedColumns: data.selected_columns,
      });
  
      this.setFormArray('filters', data.filter_criteria);
      this.setFormArray('groupBy', data.group_by);
       this.setFormArray('sortBy', data.sort_order);
      // this.setFormArray('xyaxis', data.axis_config);

      console.log(this.reportForm.value);
    });
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
    
  // 1. Table Change Based on this Bind all Column 

  onTableSelect(selectedItem: any) {

    console.log(selectedItem);
    if(selectedItem == null){
      this.reportForm.get('selectedColumns')?.setValue([]);
      this.availableFields=[];
      return;
    }
      
    console.log(selectedItem.name); 
    const table = selectedItem.name;
    this.getColumns(table);
    
    this.reportForm.get('selectedColumns')?.setValue([]); 
    (this.reportForm.get('filters') as FormArray).clear();
    (this.reportForm.get('groupBy') as FormArray).clear();
    (this.reportForm.get('sortBy') as FormArray).clear();

  }

  getColumns(table :any){
    this.metadataService.getColumns(table).subscribe(cols => {
      this.availableFields = cols;

      this.availableFields = this.availableFields.map(field => ({
        ...field,label: this.capitalize(field.column_name)
      })); 
    }); 
  }

 
 
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
        xAxisDirection: ['asc', Validators.required],
        yAxisField: ['', Validators.required],
        yAxisDirection: ['asc', Validators.required]
      });
      this.xyaxis.push(xyAxisGroup);
    }

 
    removeXYAxis(index: number) {
      this.xyaxis.removeAt(index);
    }


    saveConfiguration(): void {

      if (this.reportForm.invalid) {
        this.reportForm.markAllAsTouched();  
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

      if (this.mode === 'edit' && this.reportId) {
        //config.id = this.reportId;
        this.metadataService.updateReportFormat(config,this.reportId).subscribe({
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
      } else{

        this.metadataService.SaveReportForamt(config).subscribe({
          next: (response :any) =>{        
            this.notificationService.showNotification(response.message, 'success');
            this.addNewReport();
            this.router.navigateByUrl('List-Report');
          },
          error:(err) =>{
            console.error('Error While Saving: ', err.error); 
            this.notificationService.showNotification(err.error.message, 'error');
          }
        }) ;
      }
      
      console.log('Report configuration:', config);
    }


    previewChart(): void {

    }

    
    previewReport(): void {
      
      if (this.reportForm.invalid) {
        this.reportForm.markAllAsTouched();  
        console.log('error')
        return;
      }

      const config = this.reportForm.value; 

      console.log(config);
      this.metadataService.getDataforPreview(config).subscribe({
        next: (response: any) => {
          console.log(response);
          const data = response?.data;
          const chartData = response?.chartData;
          console.log(data);

          if (Array.isArray(data) && data.length > 0) {
            this.previewData = {
              table: data,
              chart: chartData || []
            };

            this.displayedColumns = Object.keys(data[0]);
            this.showPreviewButtons = true;
            this.showPreview = true;
            this.previewMode = 'report'; // default to report view
          } else {
            this.previewData = {
                table: [],
                chart: []
              };
            this.displayedColumns = [];
            this.showPreviewButtons=false;  
            this.notificationService.showNotification('No Data Found', 'success');           
          }
           
          //if(Array.isArray(data) && data.length > 0)
       
           
        },
        error: (err) => {
          this.showPreviewButtons=false;
          console.error('Error fetching data: ', err.error);
          this.notificationService.showNotification(err.error.message, 'error');
        }
      });

 
    }

    closeModal() {
      this.showPreview = false;
      this.previewMode = null;
       
    }

    showReportView() {
      this.showPreview =true;
      this.previewMode = 'report';
    }

    showChartView() {
      this.showPreview =true;
      this.previewMode = 'chart';
    }
  
    addNewReport(): void {
      this.reportForm.reset();
      (this.reportForm.get('filters') as FormArray).clear();
      (this.reportForm.get('groupBy') as FormArray).clear();
      (this.reportForm.get('sortBy') as FormArray).clear();
      (this.reportForm.get('xyaxis') as FormArray).clear();
      this.reprotconfig.clearConfiguration();
      console.log('New report initiated');
    }
}
