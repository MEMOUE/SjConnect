import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketPace } from './market-pace';

describe('MarketPace', () => {
  let component: MarketPace;
  let fixture: ComponentFixture<MarketPace>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketPace]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketPace);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
