import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetB2b } from './projet-b2b';

describe('ProjetB2b', () => {
  let component: ProjetB2b;
  let fixture: ComponentFixture<ProjetB2b>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetB2b]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjetB2b);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
