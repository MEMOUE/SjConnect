import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnaleticKpi } from './analetic-kpi';

describe('AnaleticKpi', () => {
  let component: AnaleticKpi;
  let fixture: ComponentFixture<AnaleticKpi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnaleticKpi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnaleticKpi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
