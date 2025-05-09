import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportConfigComponent } from './report-config.component';

describe('ReportConfigComponent', () => {
  let component: ReportConfigComponent;
  let fixture: ComponentFixture<ReportConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
