import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ReportConfigService } from '../../service/report-config.service';
import { MetadataService } from '../../service/metadata.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    
    reportForm = new FormGroup({
      tableandView: new FormControl(null, Validators.required),
      selectedColumns: new FormControl([]),
      filters: new FormArray([]),
      groupBy: new FormArray([]),
      sortBy: new FormArray([]),
    }); // reactive form for preview and save 

    constructor(private snackBar: MatSnackBar,private metadataService: MetadataService,private fb: FormBuilder, private reprotconfig:ReportConfigService) {}

    showSuccess() {
      // this.toastService.success('Hello, this is a success message!');
      this.snackBar.open('✅ Success message', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
    }

 
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
        value: ['', Validators.required],
        valueFrom: ['', Validators.required],
        valueTo: ['', Validators.required]
      });
    }
    
    onFieldChange(index: number): void {
      const filterGroup = this.filters.at(index) as FormGroup;
      // Reset operator and values when the field changes
      filterGroup.patchValue({
        operator: '',
        value: '',
        valueFrom: '',
        valueTo: ''
      });
    }
 
    onOperatorChange(index: number): void {   
      const filterGroup = this.filters.at(index) as FormGroup;
      const selectedOperator = filterGroup.get('operator')?.value;
      const selectedField = filterGroup.get('field')?.value;
      const allowedTypes = ['date', 'datetime', 'numeric', 'decimal', 'float', 'integer','int'];

      console.log(selectedField); 
      if (selectedOperator === 'between') {
        if (!selectedField || allowedTypes.indexOf(selectedField.data_type.toLowerCase()) === -1) {
          console.log('cannot use between ')
          filterGroup.get('operator')!.setValue('');
        }
      }
    }
  
    getOperators(selectedField: any): string[] {
      
      const numericTypes = ['date', 'datetime', 'numeric', 'decimal', 'float', 'integer'];
 
      if (!selectedField) { 
        return this.operators;
      }

       if (selectedField.data_type === 'date' || selectedField.data_type === 'number') {
        return ['equal to', 'greater than', 'less than', 'between'];
      }

      if (numericTypes.indexOf(selectedField.data_type.toLowerCase()) !== -1) { 
        return ['=', '!=', '>', '<', '>=', '<=', 'between'];
      }
 
      return ['=', '!=', 'contains'];
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

    onTableSelect(selectedItem: any) {

      if(selectedItem == null){
        return;
      }
      console.log(selectedItem.name);
      //const table = (event.target as HTMLSelectElement).name;
      const table = selectedItem.name;
      this.metadataService.getColumns(table).subscribe(cols => {
        this.availableFields = cols;

        this.availableFields = this.availableFields.map(field => ({
          ...field,
          label: this.capitalize(field.column_name)
        }));

        console.log(this.availableFields);
        this.reportForm.get('selectedColumns')?.setValue([]); // Clear selected columns
      });
    }


    get selectedColumnsControl(): FormControl {
      return this.reportForm.get('selectedColumns') as FormControl;
    }

    previewReport(): void {
      
      if (this.reportForm.invalid) {
        this.reportForm.markAllAsTouched(); // show validation messages
        return;
      }

      const config = this.reportForm.value; 

      this.metadataService.getDataforPreview(config).subscribe((response:any)  =>{
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

        this.showPreview = true;
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

   // Get all Filter Array
    get filters() {
      return this.reportForm.get('filters') as FormArray;
    }

    // Get all Group By Array
    get groupBy() {
      return this.reportForm.get('groupBy') as FormArray;
    }

    get groupByFields(): string[] {
      return this.reportForm.get('groupBy')?.value.map((g: any) => g.field) || [];
    }


    // Get all Sort By Array
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
      const config = this.reportForm.value;
      this.reprotconfig.saveConfiguration(config);
      console.log('Report configuration:', config); 
    }
 

    saveConfiguration1(): void {
    const config = this.reportForm.value;

    // Check if overall form is valid.
    if (this.reportForm.invalid) {
      //this.toastService.error('Please fill out all required fields', 'Validation Error', { positionClass: 'toast-top-right' });
      return;
    }
    
    // Validate each filter for the "between" operator.
    for (const filterGroup of this.filters.controls) {
      const operator = filterGroup.get('operator')?.value;
      if (operator === 'between') {
        if (!filterGroup.get('valueFrom')?.value || !filterGroup.get('valueTo')?.value) {
          // this.toastService.error(
          //   `Please provide both "From" and "To" values for the "between" filter.`,
          //   'Validation Error',
          //   { positionClass: 'toast-top-right' }
          // );
          return; // Stop saving if validation fails.
        }
      }
    }
 
    this.reprotconfig.saveConfiguration(config);
    console.log('Report configuration:', config);
    //this.toastService.success('Report configuration saved successfully!', 'Success', { positionClass: 'toast-top-right' });
  }
}
