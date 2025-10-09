import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewEmployer } from './new-employer';

describe('NewEmployer', () => {
  let component: NewEmployer;
  let fixture: ComponentFixture<NewEmployer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewEmployer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewEmployer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
