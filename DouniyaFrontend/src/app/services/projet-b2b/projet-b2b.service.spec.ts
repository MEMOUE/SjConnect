import { TestBed } from '@angular/core/testing';

import { ProjetB2bService } from './projet-b2b.service';

describe('ProjetB2bService', () => {
  let service: ProjetB2bService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjetB2bService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
