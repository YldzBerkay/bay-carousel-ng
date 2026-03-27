import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  QueryList,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[bayCarouselSlide]',
})
export class BayCarouselSlideDirective {
  constructor(public template: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[bayCarouselPrevIcon]',
})
export class BayCarouselPrevIconDirective {
  constructor(public template: TemplateRef<unknown>) {}
}

@Directive({
  selector: 'ng-template[bayCarouselNextIcon]',
})
export class BayCarouselNextIconDirective {
  constructor(public template: TemplateRef<unknown>) {}
}

export type BayCarouselMode = 'navigation' | 'pagination' | 'fraction' | 'breakpoint' | 'default';

export interface BayCarouselConfig {
  slidesPerView?: number;
  spaceBetween?: number;
  simulateTouch?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  breakpoints?: {
    [width: number]: {
      slidesPerView?: number;
      spaceBetween?: number;
    };
  };
}

export interface BayCarouselSwiperRef {
  slideNext: (speed?: number) => void;
  slidePrev: (speed?: number) => void;
  slideTo: (index: number, speed?: number) => void;
  update: () => void;
  activeIndex: number;
}

export interface BayCarouselSwipeEvent {
  distance: number;
  velocity: number;
  direction: 'next' | 'prev';
}

@Component({
  selector: 'app-bay-carousel',
  imports: [CommonModule],
  templateUrl: './bay-carousel.component.html',
  styleUrl: './bay-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BayCarouselComponent implements AfterContentInit, OnDestroy {
  private static syncGroups = new Map<string, Set<BayCarouselComponent>>();

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ContentChildren(BayCarouselSlideDirective) slides!: QueryList<BayCarouselSlideDirective>;
  @ContentChildren(BayCarouselPrevIconDirective) prevIcons!: QueryList<BayCarouselPrevIconDirective>;
  @ContentChildren(BayCarouselNextIconDirective) nextIcons!: QueryList<BayCarouselNextIconDirective>;

  readonly track = viewChild.required<ElementRef<HTMLDivElement>>('track');
  readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  readonly config = input<BayCarouselConfig>({});
  readonly mode = input<BayCarouselMode>('default');

  readonly slidesPerView = input<number>();
  readonly spaceBetween = input<number>();
  readonly maxHeight = input<number | string>();
  readonly contentHeight = input<number | string>();
  readonly pauseOnHover = input<boolean>(false);
  readonly pauseOnInteraction = input<boolean>(true);
  readonly resumeAutoplayOnLeave = input<boolean>(true);
  readonly keyboardNavigation = input<boolean>(true);
  readonly ariaLabel = input<string>('Carousel');
  readonly announceSlideChanges = input<boolean>(true);
  readonly swipeThreshold = input<number>(0.15);
  readonly swipeVelocityThreshold = input<number>(0);
  readonly syncGroup = input<string>();
  readonly syncRole = input<'main' | 'thumbs'>('main');
  readonly visibleOnly = input<boolean>(false);
  readonly renderBuffer = input<number>(1);
  readonly simulateTouch = input<boolean>();
  readonly loop = input<boolean>();
  readonly pagination = input<unknown>();
  readonly allowTouchMove = input<boolean>();
  readonly touchStartPreventDefault = input<boolean>();
  readonly dir = input<string>();

  readonly slideChange = output<number>();
  readonly swiper = output<BayCarouselSwiperRef>();
  readonly syncSlideChange = output<number>();
  readonly swipeGesture = output<BayCarouselSwipeEvent>();

  readonly currentIndex = signal(0);
  readonly isDragging = signal(false);
  readonly startX = signal(0);
  readonly currentTranslate = signal(0);
  readonly previousTranslate = signal(0);
  readonly slidesArray = signal<TemplateRef<unknown>[]>([]);
  readonly screenWidth = signal(this.isBrowser ? window.innerWidth : 1024);
  readonly liveAnnouncement = signal('');

  readonly currentSlidesPerView = computed(() => {
    const directSlidesPerView = this.slidesPerView();
    if (directSlidesPerView !== undefined) return directSlidesPerView;

    const cfg = this.config();
    const activeScreenWidth = this.screenWidth();
    let calculatedSlidesPerView = cfg.slidesPerView || 1;

    if (cfg.breakpoints) {
      const sortedBreakpoints = Object.entries(cfg.breakpoints)
        .map(([width, breakpointConfig]) => ({ width: parseInt(width, 10), breakpointConfig }))
        .sort((a, b) => a.width - b.width);

      for (const breakpoint of sortedBreakpoints) {
        if (activeScreenWidth >= breakpoint.width && breakpoint.breakpointConfig.slidesPerView) {
          calculatedSlidesPerView = breakpoint.breakpointConfig.slidesPerView;
        }
      }
    }

    return calculatedSlidesPerView;
  });

  readonly currentSpaceBetween = computed(() => {
    const directSpaceBetween = this.spaceBetween();
    if (directSpaceBetween !== undefined) return directSpaceBetween;

    const cfg = this.config();
    const activeScreenWidth = this.screenWidth();
    let calculatedSpaceBetween = cfg.spaceBetween || 0;

    if (cfg.breakpoints) {
      const sortedBreakpoints = Object.entries(cfg.breakpoints)
        .map(([width, breakpointConfig]) => ({ width: parseInt(width, 10), breakpointConfig }))
        .sort((a, b) => a.width - b.width);

      for (const breakpoint of sortedBreakpoints) {
        if (activeScreenWidth >= breakpoint.width && breakpoint.breakpointConfig.spaceBetween !== undefined) {
          calculatedSpaceBetween = breakpoint.breakpointConfig.spaceBetween;
        }
      }
    }

    return calculatedSpaceBetween;
  });

  readonly maxIndex = computed(() => {
    const totalSlides = this.slidesArray().length;
    const slidesPerViewCount = this.currentSlidesPerView();
    return Math.max(0, totalSlides - slidesPerViewCount);
  });

  readonly canGoNext = computed(() => this.currentIndex() < this.maxIndex());
  readonly canGoPrev = computed(() => this.currentIndex() > 0);
  readonly totalSlides = computed(() => this.slidesArray().length);
  readonly totalPages = computed(() => this.maxIndex() + 1);
  readonly paginationDots = computed(() => Array(this.totalPages()).fill(0));
  readonly maxHeightValue = computed(() => {
    const maxH = this.maxHeight();
    if (!maxH) return null;
    return typeof maxH === 'number' ? `${maxH}px` : maxH;
  });
  readonly contentHeightValue = computed(() => {
    const contentH = this.contentHeight();
    if (!contentH) return null;
    return typeof contentH === 'number' ? `${contentH}px` : contentH;
  });
  readonly isRtl = computed(() => (this.dir() ?? '').toLowerCase() === 'rtl');
  readonly prevIconTemplate = computed(() => this.prevIcons?.first?.template ?? null);
  readonly nextIconTemplate = computed(() => this.nextIcons?.first?.template ?? null);
  readonly isMouseDragEnabled = computed(() => this.resolvedSimulateTouch());

  private autoplayInterval?: ReturnType<typeof setInterval>;
  private resizeObserver?: ResizeObserver;
  private windowResizeListener?: () => void;
  private dragStartTime = 0;
  private suppressSyncBroadcast = false;
  private registeredSyncGroup?: string;

  constructor() {
    effect(() => {
      const index = this.currentIndex();
      this.updatePosition();
      this.slideChange.emit(index);
      this.syncSlideChange.emit(index);
      this.broadcastSync(index);
      if (this.announceSlideChanges()) {
        this.liveAnnouncement.set(`Slide ${index + 1} of ${this.totalSlides()}`);
      }
    });

    effect(() => {
      this.currentSlidesPerView();
      this.currentSpaceBetween();
      this.updatePosition();
    });

    effect(() => {
      const cfg = this.config();
      if (cfg.autoplay) {
        this.startAutoplay();
      } else {
        this.stopAutoplay();
      }
    });

    effect(() => {
      if (this.track()) {
        this.swiper.emit(this.swiperRef);
      }
    });
  }

  ngAfterContentInit(): void {
    this.updateSlidesArray();
    this.slides.changes.subscribe(() => this.updateSlidesArray());
    this.registerToSyncGroup();

    if (this.isBrowser) {
      this.updateScreenWidth();
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScreenWidth();
        this.updatePosition();
      });

      const containerEl = this.container().nativeElement;
      if (containerEl) this.resizeObserver.observe(containerEl);

      this.windowResizeListener = () => this.updateScreenWidth();
      window.addEventListener('resize', this.windowResizeListener);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.unregisterFromSyncGroup();
    this.resizeObserver?.disconnect();
    if (this.isBrowser && this.windowResizeListener) {
      window.removeEventListener('resize', this.windowResizeListener);
    }
  }

  private updateSlidesArray(): void {
    this.slidesArray.set(this.slides.map((slide) => slide.template));
  }

  private registerToSyncGroup(): void {
    const group = this.syncGroup();
    if (!group) return;
    if (!BayCarouselComponent.syncGroups.has(group)) {
      BayCarouselComponent.syncGroups.set(group, new Set());
    }
    BayCarouselComponent.syncGroups.get(group)?.add(this);
    this.registeredSyncGroup = group;
  }

  private unregisterFromSyncGroup(): void {
    if (!this.registeredSyncGroup) return;
    const set = BayCarouselComponent.syncGroups.get(this.registeredSyncGroup);
    set?.delete(this);
    if (set && set.size === 0) {
      BayCarouselComponent.syncGroups.delete(this.registeredSyncGroup);
    }
    this.registeredSyncGroup = undefined;
  }

  private broadcastSync(index: number): void {
    if (this.suppressSyncBroadcast) return;
    const group = this.syncGroup();
    if (!group) return;
    const peers = BayCarouselComponent.syncGroups.get(group);
    if (!peers) return;
    for (const peer of peers) {
      if (peer === this) continue;
      peer.receiveSync(index);
    }
  }

  private receiveSync(index: number): void {
    this.suppressSyncBroadcast = true;
    this.slideTo(index);
    this.suppressSyncBroadcast = false;
  }

  private updatePosition(): void {
    const trackEl = this.track()?.nativeElement;
    if (!trackEl) return;

    const containerEl = this.container()?.nativeElement;
    if (!containerEl) return;

    const containerWidth = containerEl.offsetWidth || 0;
    if (containerWidth === 0) return;

    const slidesPerViewCount = this.currentSlidesPerView();
    const gap = this.currentSpaceBetween();

    const firstSlide = trackEl.querySelector('.bay-carousel-slide') as HTMLElement | null;
    let slideWidth = firstSlide ? firstSlide.offsetWidth : (containerWidth - gap * (slidesPerViewCount - 1)) / slidesPerViewCount;

    if (slidesPerViewCount === 1) slideWidth = containerWidth;

    const offset = -(this.currentIndex() * (slideWidth + gap));
    trackEl.style.transform = `translateX(${offset}px)`;
    this.previousTranslate.set(offset);
    this.currentTranslate.set(offset);
  }

  slideNext(speed?: number): void {
    void speed;
    const loopEnabled = this.loop() ?? this.config().loop;
    if (this.canGoNext()) {
      this.currentIndex.update((value) => value + 1);
    } else if (loopEnabled) {
      this.currentIndex.set(0);
    }
  }

  slidePrev(speed?: number): void {
    void speed;
    const loopEnabled = this.loop() ?? this.config().loop;
    if (this.canGoPrev()) {
      this.currentIndex.update((value) => value - 1);
    } else if (loopEnabled) {
      this.currentIndex.set(this.maxIndex());
    }
  }

  slideTo(index: number, speed?: number): void {
    void speed;
    const maxIdx = this.maxIndex();
    this.currentIndex.set(Math.max(0, Math.min(index, maxIdx)));
  }

  goToSlide(index: number): void {
    this.slideTo(index);
  }

  update(): void {
    this.updatePosition();
  }

  onDragStart(event: MouseEvent | TouchEvent): void {
    if (!this.isBrowser) return;

    const isTouch = event instanceof TouchEvent;
    const isMouse = event instanceof MouseEvent;

    if (isTouch && this.allowTouchMove() === false) return;
    if (isMouse && !this.resolvedSimulateTouch()) return;
    if (!isTouch && !isMouse) return;

    this.isDragging.set(true);
    this.startX.set(this.getPositionX(event));
    this.dragStartTime = Date.now();
    if (this.pauseOnInteraction()) {
      this.stopAutoplay();
    }

    const trackEl = this.track()?.nativeElement;
    if (trackEl) trackEl.style.transition = 'none';

    if (isTouch && this.touchStartPreventDefault() !== false) event.preventDefault();
  }

  onDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isBrowser || !this.isDragging()) return;
    if (event instanceof TouchEvent && this.allowTouchMove() === false) return;
    if (event instanceof TouchEvent && this.touchStartPreventDefault() !== false) event.preventDefault();

    const currentX = this.getPositionX(event);
    const diff = currentX - this.startX();
    this.currentTranslate.set(this.previousTranslate() + diff);

    const trackEl = this.track()?.nativeElement;
    if (trackEl) trackEl.style.transform = `translateX(${this.currentTranslate()}px)`;
  }

  onDragEnd(): void {
    if (!this.isBrowser || !this.isDragging()) return;

    this.isDragging.set(false);

    const trackEl = this.track()?.nativeElement;
    if (trackEl) trackEl.style.transition = 'transform 0.3s ease-out';

    const movedBy = this.currentTranslate() - this.previousTranslate();
    const containerWidth = this.container()?.nativeElement.offsetWidth || 0;
    const threshold = this.resolveSwipeThreshold(containerWidth);
    const elapsedMs = Math.max(1, Date.now() - this.dragStartTime);
    const velocity = Math.abs(movedBy) / elapsedMs;
    const loopEnabled = this.loop() ?? this.config().loop;
    const velocityPassed = this.swipeVelocityThreshold() > 0 && velocity >= this.swipeVelocityThreshold();
    const distancePassed = Math.abs(movedBy) >= threshold;
    const shouldSwipe = distancePassed || velocityPassed;
    const swipeNextTriggered = shouldSwipe && (this.isRtl() ? movedBy > 0 : movedBy < 0);
    const swipePrevTriggered = shouldSwipe && (this.isRtl() ? movedBy < 0 : movedBy > 0);

    if (swipeNextTriggered && (this.canGoNext() || !!loopEnabled)) {
      this.swipeGesture.emit({ distance: movedBy, velocity, direction: 'next' });
      this.slideNext();
    } else if (swipePrevTriggered && (this.canGoPrev() || !!loopEnabled)) {
      this.swipeGesture.emit({ distance: movedBy, velocity, direction: 'prev' });
      this.slidePrev();
    } else {
      this.updatePosition();
    }

    if (this.config().autoplay) this.startAutoplay();
  }

  onContainerMouseEnter(): void {
    if (this.pauseOnHover() && this.config().autoplay) {
      this.stopAutoplay();
    }
  }

  onContainerMouseLeave(): void {
    if (this.pauseOnHover() && this.resumeAutoplayOnLeave() && this.config().autoplay) {
      this.startAutoplay();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.keyboardNavigation()) return;
    if (event.key === 'ArrowRight') {
      this.isRtl() ? this.slidePrev() : this.slideNext();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft') {
      this.isRtl() ? this.slideNext() : this.slidePrev();
      event.preventDefault();
    } else if (event.key === 'Home') {
      this.slideTo(0);
      event.preventDefault();
    } else if (event.key === 'End') {
      this.slideTo(this.maxIndex());
      event.preventDefault();
    }
  }

  shouldRenderSlide(index: number): boolean {
    if (!this.visibleOnly()) return true;
    const start = Math.max(0, this.currentIndex() - this.renderBuffer());
    const end = Math.min(this.totalSlides() - 1, this.currentIndex() + this.currentSlidesPerView() + this.renderBuffer() - 1);
    return index >= start && index <= end;
  }

  get swiperRef(): BayCarouselSwiperRef {
    return {
      slideNext: (speed?: number) => this.slideNext(speed),
      slidePrev: (speed?: number) => this.slidePrev(speed),
      slideTo: (index: number, speed?: number) => this.slideTo(index, speed),
      update: () => this.update(),
      activeIndex: this.currentIndex(),
    };
  }

  get activeIndex(): number {
    return this.currentIndex();
  }

  private resolvedSimulateTouch(): boolean {
    const direct = this.simulateTouch();
    if (direct !== undefined) return direct;
    return this.config().simulateTouch ?? false;
  }

  private updateScreenWidth(): void {
    if (this.isBrowser) this.screenWidth.set(window.innerWidth);
  }

  private getPositionX(event: MouseEvent | TouchEvent): number {
    return event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  }

  private resolveSwipeThreshold(containerWidth: number): number {
    const thresholdInput = this.swipeThreshold();
    if (thresholdInput <= 1) {
      return containerWidth * Math.max(0, thresholdInput);
    }
    return thresholdInput;
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    const delay = this.config().autoplayDelay || 3000;
    this.autoplayInterval = setInterval(() => this.slideNext(), delay);
  }

  private stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = undefined;
    }
  }
}
