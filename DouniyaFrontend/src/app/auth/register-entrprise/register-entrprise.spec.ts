import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterEntrprise } from './register-entrprise';

describe('RegisterEntrprise', () => {
  let component: RegisterEntrprise;
  let fixture: ComponentFixture<RegisterEntrprise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterEntrprise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterEntrprise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
