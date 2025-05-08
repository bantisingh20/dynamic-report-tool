import { TestBed } from '@angular/core/testing';

import { ReportConfigService } from './report-config.service';

describe('ReportConfigService', () => {
  let service: ReportConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
