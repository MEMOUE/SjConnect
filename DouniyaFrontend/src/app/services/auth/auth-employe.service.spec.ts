import { TestBed } from '@angular/core/testing';

import { AuthEmployeService } from './auth-employe.service';

describe('AuthEmployeService', () => {
  let service: AuthEmployeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthEmployeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
