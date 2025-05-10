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

  operators: string[] = ['between','equals', 'not equals', 'greater than', 'less than', 'contains'];
  
    tablesAndViews: any[] = [];  // api table
    //selectedColumns = []; 
    availableFields: any[] = [];   // api col and type
    
    reportForm = new FormGroup({
      dataSource: new FormControl('', Validators.required),
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
      this.addFilter();
    }
 
    createFilter(): FormGroup {
      return this.fb.group({
        field: [null, Validators.required],
        operator: ['', Validators.required], 
        value: [''],
        valueFrom: [''],
        valueTo: ['']
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

  // When the operator is changed, check if "between" is allowed on the selected field.
  onOperatorChange(index: number): void {   
    const filterGroup = this.filters.at(index) as FormGroup;
    const selectedOperator = filterGroup.get('operator')?.value;
    const selectedField = filterGroup.get('field')?.value;
    const allowedTypes = ['date', 'datetime', 'numeric', 'decimal', 'float', 'integer'];

    ////If operator "between" is selected, validate the selected field's type.
    if (selectedOperator === 'between') {
      if (!selectedField || allowedTypes.indexOf(selectedField.data_type.toLowerCase()) === -1) {
         console.log('cannot use between ')
        // filterGroup.get('operator').setValue('');
      }
    }
  }

  // Return the list of valid operators based on the selected field's type.
  getOperators(selectedField: any): string[] {
    const numericTypes = ['date', 'datetime', 'numeric', 'decimal', 'float', 'integer'];

    if (!selectedField) {
      // No field selected: show a default set.
      return this.operators;
    }

    if (numericTypes.indexOf(selectedField.data_type.toLowerCase()) !== -1) {
      // For numeric/date types, include the "between" operator.
      return ['=', '!=', '>', '<', '>=', '<=', 'between'];
    }

    // For non-numeric/string fields, use a limited set.
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
// Called when the 'Preview' button is clicked
    previewReport(): void {
      // Implement your preview logic here,
      // e.g., display a modal or a preview pane with the generated report
      console.log('Previewing report...');
    }

    // Clears the form inputs
    clearReport(): void {
      this.reportForm.reset();
      // Additional logic if required to clear dynamic fields (filters, groupBy, sortBy)
      console.log('Form cleared');
    }

    // Creates a new report configuration
    addNewReport(): void {
      // Implementation could redirect to a new form or reset the current form for a new configuration
      this.reportForm.reset();
      console.log('New report initiated');
    }

  
    get filters() {
      return this.reportForm.get('filters') as FormArray;
    }

    get groupBy() {
      return this.reportForm.get('groupBy') as FormArray;
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
      const config = this.reportForm.value;
      this.reprotconfig.saveConfiguration(config);
      console.log('Report configuration:', config); 
    }

     // Save the configuration after validation.
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

    // Call the service to save the configuration.
    this.reprotconfig.saveConfiguration(config);
    console.log('Report configuration:', config);
    //this.toastService.success('Report configuration saved successfully!', 'Success', { positionClass: 'toast-top-right' });
  }
}
