import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaceB2B } from './espace-b2-b';

describe('EspaceB2B', () => {
  let component: EspaceB2B;
  let fixture: ComponentFixture<EspaceB2B>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceB2B]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspaceB2B);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
