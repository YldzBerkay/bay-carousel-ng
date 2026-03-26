import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BayCarouselComponent } from './bay-carousel';

describe('BayCarouselComponent', () => {
  let component: BayCarouselComponent;
  let fixture: ComponentFixture<BayCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BayCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BayCarouselComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
