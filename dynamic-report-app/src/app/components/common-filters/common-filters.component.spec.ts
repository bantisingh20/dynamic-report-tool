import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonFiltersComponent } from './common-filters.component';

describe('CommonFiltersComponent', () => {
  let component: CommonFiltersComponent;
  let fixture: ComponentFixture<CommonFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
