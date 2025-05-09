import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ReportConfigService } from '../../service/report-config.service';


@Component({
  selector: 'app-report-config',
  standalone: false,
  templateUrl: './report-config.component.html',
  styleUrl: './report-config.component.css'
})
export class ReportConfigComponent implements OnInit {
  reportForm: FormGroup;
  
  private dummyData = [
    { id: 1, date: '2025-01-15', category: 'Electronics', region: 'North', product: 'Laptop', revenue: 1200, quantity: 2, customer: 'TechCorp' },
    { id: 2, date: '2025-01-20', category: 'Electronics', region: 'South', product: 'Smartphone', revenue: 800, quantity: 4, customer: 'MobileTech' },
    { id: 3, date: '2025-01-25', category: 'Furniture', region: 'East', product: 'Desk', revenue: 350, quantity: 1, customer: 'HomeOffice' },
    { id: 4, date: '2025-02-01', category: 'Electronics', region: 'West', product: 'Tablet', revenue: 600, quantity: 3, customer: 'TechCorp' },
    { id: 5, date: '2025-02-05', category: 'Furniture', region: 'North', product: 'Chair', revenue: 250, quantity: 2, customer: 'HomeOffice' },
    { id: 6, date: '2025-02-10', category: 'Office', region: 'South', product: 'Stationery', revenue: 150, quantity: 10, customer: 'PaperWorks' },
    { id: 7, date: '2025-02-15', category: 'Electronics', region: 'East', product: 'Laptop', revenue: 1200, quantity: 2, customer: 'MobileTech' },
    { id: 8, date: '2025-02-20', category: 'Office', region: 'West', product: 'Printer', revenue: 400, quantity: 1, customer: 'PaperWorks' },
    { id: 9, date: '2025-03-01', category: 'Furniture', region: 'North', product: 'Bookshelf', revenue: 300, quantity: 1, customer: 'HomeOffice' },
    { id: 10, date: '2025-03-05', category: 'Electronics', region: 'South', product: 'Smartphone', revenue: 900, quantity: 3, customer: 'TechCorp' },
    { id: 11, date: '2025-03-10', category: 'Office', region: 'East', product: 'Stationery', revenue: 200, quantity: 15, customer: 'PaperWorks' },
    { id: 12, date: '2025-03-15', category: 'Furniture', region: 'West', product: 'Desk', revenue: 400, quantity: 1, customer: 'HomeOffice' }
  ];

  // Sample data fields that can be used for filtering, grouping, etc.
  availableFields: string[] = [
    'id','date', 'category', 'region', 'product', 'revenue', 'quantity', 'customer','revenue','quantity','customer'
  ];
  
  // Sample operators for filters
  operators: string[] = ['equals', 'not equals', 'greater than', 'less than', 'contains', 'starts with', 'ends with'];
  
  constructor(private fb: FormBuilder, private reprotconfig:ReportConfigService) {
    this.reportForm = this.fb.group({
      filters: this.fb.array([]),
      groupBy: this.fb.array([]),
      sortBy: this.fb.array([]),
      xAxis: [''],
      yAxis: ['']
    });
   }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.reportForm = this.fb.group({
      filters: this.fb.array([]),
      groupBy: this.fb.array([]),
      sortBy: this.fb.array([]),
      xAxis: [''],
      yAxis: ['']
    });
  }

  // Getters for form arrays
  get filters(): FormArray {
    return this.reportForm.get('filters') as FormArray;
  }

  get groupBy(): FormArray {
    return this.reportForm.get('groupBy') as FormArray;
  }

  get sortBy(): FormArray {
    return this.reportForm.get('sortBy') as FormArray;
  }

  // Methods to add items to form arrays
  addFilter(): void {
    this.filters.push(
      this.fb.group({
        field: [''],
        operator: ['equals'],
        value: ['']
      })
    );
  }

  addGrouping(): void {
    this.groupBy.push(
      this.fb.group({
        field: ['']
      })
    );
  }

  addSorting(): void {
    this.sortBy.push(
      this.fb.group({
        field: [''],
        direction: ['asc']
      })
    );
  }

  // Methods to remove items from form arrays
  removeFilter(index: number): void {
    this.filters.removeAt(index);
  }

  removeGrouping(index: number): void {
    this.groupBy.removeAt(index);
  }

  removeSorting(index: number): void {
    this.sortBy.removeAt(index);
  }

  // Method to save the configuration
  saveConfiguration(): void {
    const config = this.reportForm.value;
    this.reprotconfig.saveConfiguration(config);
    console.log('Report configuration:', config);
    // Here you would store this in your app state
  }
}