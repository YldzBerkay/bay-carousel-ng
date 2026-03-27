import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';
import { vi } from 'vitest';

import { BayCarouselComponent } from './bay-carousel';

describe('BayCarouselComponent', () => {
  let component: BayCarouselComponent;
  let fixture: ComponentFixture<BayCarouselComponent>;

  const createMockSlides = (count: number): TemplateRef<unknown>[] =>
    Array.from({ length: count }, () => ({}) as TemplateRef<unknown>);

  const setContainerWidth = (targetFixture: ComponentFixture<BayCarouselComponent>, width: number): void => {
    const containerEl = targetFixture.nativeElement.querySelector('.bay-carousel-container') as HTMLElement;
    Object.defineProperty(containerEl, 'offsetWidth', {
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    if (!(globalThis as { ResizeObserver?: unknown }).ResizeObserver) {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
        observe(): void {}
        disconnect(): void {}
      };
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BayCarouselComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BayCarouselComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps mouse drag disabled by default', () => {
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement.querySelector('.bay-carousel-container');

    component.onDragStart(new MouseEvent('mousedown', { clientX: 100 }));

    expect(component.isDragging()).toBe(false);
    expect(component.isMouseDragEnabled()).toBe(false);
    expect(container.classList.contains('bay-carousel-container--mouse-drag-enabled')).toBe(false);
  });

  it('enables mouse drag when simulateTouch is true', () => {
    fixture.componentRef.setInput('simulateTouch', true);
    fixture.detectChanges();
    const container: HTMLElement = fixture.nativeElement.querySelector('.bay-carousel-container');

    component.onDragStart(new MouseEvent('mousedown', { clientX: 120 }));

    expect(component.isMouseDragEnabled()).toBe(true);
    expect(component.isDragging()).toBe(true);
    expect(container.classList.contains('bay-carousel-container--mouse-drag-enabled')).toBe(true);
  });

  it('respects loop boundaries when loop is disabled', () => {
    fixture.detectChanges();
    component.slidesArray.set(createMockSlides(3));
    component.slideTo(2);

    component.slideNext();
    expect(component.currentIndex()).toBe(2);

    component.slideTo(0);
    component.slidePrev();
    expect(component.currentIndex()).toBe(0);
  });

  it('wraps around edges when loop is enabled', () => {
    fixture.componentRef.setInput('loop', true);
    fixture.detectChanges();
    component.slidesArray.set(createMockSlides(3));
    component.slideTo(2);

    component.slideNext();
    expect(component.currentIndex()).toBe(0);

    component.slidePrev();
    expect(component.currentIndex()).toBe(2);
  });

  it('resolves breakpoints for slidesPerView and spaceBetween', () => {
    fixture.componentRef.setInput('config', {
      slidesPerView: 1,
      spaceBetween: 8,
      breakpoints: {
        600: { slidesPerView: 2, spaceBetween: 12 },
        900: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
    fixture.detectChanges();

    component.screenWidth.set(750);
    expect(component.currentSlidesPerView()).toBe(2);
    expect(component.currentSpaceBetween()).toBe(12);

    component.screenWidth.set(950);
    expect(component.currentSlidesPerView()).toBe(3);
    expect(component.currentSpaceBetween()).toBe(24);
  });

  it('syncs slide index between components in same syncGroup', () => {
    const fixtureA = TestBed.createComponent(BayCarouselComponent);
    const fixtureB = TestBed.createComponent(BayCarouselComponent);
    const componentA = fixtureA.componentInstance;
    const componentB = fixtureB.componentInstance;

    fixtureA.componentRef.setInput('syncGroup', 'gallery-sync');
    fixtureB.componentRef.setInput('syncGroup', 'gallery-sync');
    componentA.slidesArray.set(createMockSlides(3));
    componentB.slidesArray.set(createMockSlides(3));
    componentA.slideTo(0);
    componentB.slideTo(0);

    (componentA as unknown as { registerToSyncGroup: () => void }).registerToSyncGroup();
    (componentB as unknown as { registerToSyncGroup: () => void }).registerToSyncGroup();

    (componentA as unknown as { broadcastSync: (index: number) => void }).broadcastSync(1);

    expect(componentB.currentIndex()).toBe(1);

    fixtureA.destroy();
    fixtureB.destroy();
  });

  it('applies swipe threshold ratio and pixel modes correctly', () => {
    fixture.componentRef.setInput('simulateTouch', true);
    fixture.detectChanges();
    component.slidesArray.set(createMockSlides(3));
    setContainerWidth(fixture, 200);

    fixture.componentRef.setInput('swipeThreshold', 0.5);
    component.onDragStart(new MouseEvent('mousedown', { clientX: 200 }));
    component.onDragMove(new MouseEvent('mousemove', { clientX: 120 }));
    component.onDragEnd();
    expect(component.currentIndex()).toBe(0);

    component.onDragStart(new MouseEvent('mousedown', { clientX: 200 }));
    component.onDragMove(new MouseEvent('mousemove', { clientX: 80 }));
    component.onDragEnd();
    expect(component.currentIndex()).toBe(1);

    component.slideTo(0);
    fixture.componentRef.setInput('swipeThreshold', 80);
    component.onDragStart(new MouseEvent('mousedown', { clientX: 200 }));
    component.onDragMove(new MouseEvent('mousemove', { clientX: 130 }));
    component.onDragEnd();
    expect(component.currentIndex()).toBe(0);

    component.onDragStart(new MouseEvent('mousedown', { clientX: 200 }));
    component.onDragMove(new MouseEvent('mousemove', { clientX: 110 }));
    component.onDragEnd();
    expect(component.currentIndex()).toBe(1);
  });

  it('handles keyboard navigation keys when enabled', () => {
    fixture.detectChanges();
    component.slidesArray.set(createMockSlides(4));

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const rightPrevent = vi.spyOn(right, 'preventDefault');
    component.onKeydown(right);
    expect(component.currentIndex()).toBe(1);
    expect(rightPrevent).toHaveBeenCalled();

    const end = new KeyboardEvent('keydown', { key: 'End' });
    const endPrevent = vi.spyOn(end, 'preventDefault');
    component.onKeydown(end);
    expect(component.currentIndex()).toBe(3);
    expect(endPrevent).toHaveBeenCalled();

    const home = new KeyboardEvent('keydown', { key: 'Home' });
    const homePrevent = vi.spyOn(home, 'preventDefault');
    component.onKeydown(home);
    expect(component.currentIndex()).toBe(0);
    expect(homePrevent).toHaveBeenCalled();
  });

  it('ignores keyboard events when keyboardNavigation is disabled', () => {
    fixture.componentRef.setInput('keyboardNavigation', false);
    fixture.detectChanges();
    component.slidesArray.set(createMockSlides(4));
    component.slideTo(1);

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    component.onKeydown(event);

    expect(component.currentIndex()).toBe(1);
    expect(preventSpy).not.toHaveBeenCalled();
  });
});
