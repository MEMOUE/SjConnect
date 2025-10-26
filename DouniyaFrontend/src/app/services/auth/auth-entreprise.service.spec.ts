import { TestBed } from '@angular/core/testing';

import { AuthEntrepriseService } from './auth-entreprise.service';

describe('AuthEntrepriseService', () => {
  let service: AuthEntrepriseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthEntrepriseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
