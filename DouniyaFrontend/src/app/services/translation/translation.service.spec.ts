import { TestBed } from '@angular/core/testing';

import { RanslationService } from './translation.service';

describe('RanslationService', () => {
  let service: RanslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RanslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
