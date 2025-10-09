import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterIndividu } from './register-individu';

describe('RegisterIndividu', () => {
  let component: RegisterIndividu;
  let fixture: ComponentFixture<RegisterIndividu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterIndividu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterIndividu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
