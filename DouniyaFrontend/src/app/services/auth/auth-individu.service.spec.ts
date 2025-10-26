import { TestBed } from '@angular/core/testing';

import { AuthIndividuService } from './auth-individu.service';

describe('AuthIndividuService', () => {
  let service: AuthIndividuService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthIndividuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
