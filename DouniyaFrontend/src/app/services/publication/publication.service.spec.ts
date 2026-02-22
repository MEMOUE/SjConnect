import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationService } from './publication.service';

describe('PublicationService', () => {
  let component: PublicationService;
  let fixture: ComponentFixture<PublicationService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
