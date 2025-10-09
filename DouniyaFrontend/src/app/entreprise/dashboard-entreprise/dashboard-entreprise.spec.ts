import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardEntreprise } from './dashboard-entreprise';

describe('DashboardEntreprise', () => {
  let component: DashboardEntreprise;
  let fixture: ComponentFixture<DashboardEntreprise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardEntreprise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardEntreprise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
