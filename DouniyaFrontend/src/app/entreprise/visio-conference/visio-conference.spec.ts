import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisioConference } from './visio-conference';

describe('VisioConference', () => {
  let component: VisioConference;
  let fixture: ComponentFixture<VisioConference>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisioConference]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisioConference);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
