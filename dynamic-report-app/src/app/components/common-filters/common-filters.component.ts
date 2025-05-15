import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';


declare var bootstrap: any;
@Component({
  selector: 'app-common-filters',
  standalone: false,
  templateUrl: './common-filters.component.html',
  styleUrl: './common-filters.component.css'
})

export class CommonFiltersComponent implements OnInit {
  @Input() availableFields: any[] = []; // Input for dropdown data
  @Output() cancelled = new EventEmitter<void>();
  @Input() Allfilters: any;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  @Input() TableorView: any[] = [];


  reportForm: FormGroup;
  operators: string[] = ['between', 'equals', 'not equals', 'greater than', 'less than', 'contains'];
  showPreviewButtons = false;
  previewData: any = {};

  constructor(private fb: FormBuilder) {
    this.reportForm = this.fb.group({
      filters: this.fb.array([]),
      groupBy: this.fb.array([]),
      sortBy: this.fb.array([]),
      xyaxis: this.fb.array([])
    });
  }

  ngOnInit(): void {
    //this.addFilter(); // Add default filter
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['Allfilters'] && this.filters) {
      this.reportForm.patchValue(this.filters);
    }
  }
  // ========== Accessors ==========
  get filters(): FormArray {
    return this.reportForm.get('filters') as FormArray;
  }

  get groupBy(): FormArray {
    return this.reportForm.get('groupBy') as FormArray;
  }

  get sortBy(): FormArray {
    return this.reportForm.get('sortBy') as FormArray;
  }

  get xyaxis(): FormArray {
    return this.reportForm.get('xyaxis') as FormArray;
  }

  // ========== Form Actions ==========
  addFilter() {
    this.filters.push(this.fb.group({
      field: [null, Validators.required],
      operator: ['', Validators.required],
      value: ['', Validators.required],
      valueFrom: [''],
      valueTo: [''],
      selectedField: [null]
    }));
  }

  removeFilter(index: number) {
    this.filters.removeAt(index);
  }

  addGrouping() {
    this.groupBy.push(this.fb.group({
      field: ['', Validators.required]
    }));
  }

  removeGrouping(index: number) {
    this.groupBy.removeAt(index);
  }

  addSorting() {
    this.sortBy.push(this.fb.group({
      field: ['', Validators.required],
      direction: ['asc']
    }));
  }

  removeSorting(index: number) {
    this.sortBy.removeAt(index);
  }

  addXYAxis() {
    this.xyaxis.push(this.fb.group({
      xAxisField: ['', Validators.required],
      xAxisDirection: ['asc'],
      yAxisField: ['', Validators.required],
      yAxisDirection: ['asc']
    }));
  }

  removeXYAxis(index: number) {
    this.xyaxis.removeAt(index);
  }


  onFieldChange(field: any, index: number): void {

    console.log(field);

    if (field == undefined) {
      return;
    }
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

  previewReport() {
    this.showPreviewButtons = true;
    // Add preview logic if needed
  }


  // ========== Save & Cancel ==========
  onSave() {
    console.log('Save button clicked'); // Confirm button click triggers this method

    if (this.reportForm.valid) {
      const filterConfig = {
        filters: this.filters.getRawValue(),
        groupBy: this.groupBy.getRawValue(),
        sortBy: this.sortBy.getRawValue(),
        xyaxis: this.xyaxis.getRawValue()
      };
      localStorage.setItem('reportBuilderData', JSON.stringify(filterConfig));

      console.log('Common page :', filterConfig); // Print actual data
      this.save.emit(filterConfig); // notify parent

      const offcanvasElement = document.getElementById('filterDrawer');
      if (offcanvasElement) {
        const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        offcanvas.hide(); // This hides the offcanvas
      }
    } else {
      console.log('Form is invalid');
      this.reportForm.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancelled.emit();
    const offcanvasElement = document.getElementById('filterDrawer');
    if (offcanvasElement) {
      const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      offcanvas.hide(); // This hides the offcanvas
    }
  }
}