# bay-carousel-ng

`bay-carousel-ng` is a standalone Angular carousel/slider library for Angular 21+ applications.

- 5 modes: `default`, `navigation`, `pagination`, `fraction`, `breakpoint`
- Responsive breakpoints
- Touch/mouse drag
- Autoplay + loop
- Keyboard and accessibility controls
- Sync carousel support (main + thumbs)
- Performance mode for large lists (`visibleOnly`, `renderBuffer`)
- Programmatic API (`swiperRef`)
- Built-in SVG icons with custom icon templates

[npm package](https://www.npmjs.com/package/bay-carousel-ng)

## Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Modes](#modes)
- [API Reference](#api-reference)
- [Breaking Change Policy](#breaking-change-policy)
- [Accessibility and Keyboard](#accessibility-and-keyboard)
- [Accessibility Checklist](#accessibility-checklist)
- [Autoplay Options](#autoplay-options)
- [Swipe Tuning](#swipe-tuning)
- [Sync Carousel](#sync-carousel-main--thumbs)
- [Performance Mode](#performance-mode)
- [Programmatic Control](#programmatic-control)
- [Custom Navigation Icons](#custom-navigation-icons)
- [Style Customization](#style-customization)
- [Release Process](#release-process)
- [SSR Notes](#ssr-notes)
- [Build and Publish](#build-and-publish)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm i bay-carousel-ng
```

Peer dependencies:
- `@angular/core` (v21+)
- `@angular/common` (v21+)

## Quick Start

```ts
import { Component } from '@angular/core';
import { BayCarouselComponent, BayCarouselSlideDirective } from 'bay-carousel-ng';

@Component({
  selector: 'app-example',
  imports: [BayCarouselComponent, BayCarouselSlideDirective],
  template: `
    <app-bay-carousel [config]="config" mode="navigation">
      <ng-template bayCarouselSlide>Slide 1</ng-template>
      <ng-template bayCarouselSlide>Slide 2</ng-template>
      <ng-template bayCarouselSlide>Slide 3</ng-template>
    </app-bay-carousel>
  `,
})
export class ExampleComponent {
  config = {
    slidesPerView: 1,
    spaceBetween: 16,
    breakpoints: {
      768: { slidesPerView: 2, spaceBetween: 20 },
      1200: { slidesPerView: 3, spaceBetween: 24 },
    },
  };
}
```

## Modes

Use `mode` input:

- `default`: slide track only
- `navigation`: previous/next arrows
- `pagination`: clickable pagination dots (page-based)
- `fraction`: `current / total` display
- `breakpoint`: debug info (`slidesPerView`, screen width)

```html
<app-bay-carousel mode="pagination">...</app-bay-carousel>
```

## API Reference

### Types

```ts
type BayCarouselMode = 'navigation' | 'pagination' | 'fraction' | 'breakpoint' | 'default';

interface BayCarouselConfig {
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

interface BayCarouselSwiperRef {
  slideNext(speed?: number): void;
  slidePrev(speed?: number): void;
  slideTo(index: number, speed?: number): void;
  update(): void;
  activeIndex: number;
}

interface BayCarouselSwipeEvent {
  distance: number;
  velocity: number;
  direction: 'next' | 'prev';
}
```

### Inputs

- `config: BayCarouselConfig` main carousel config
- `mode: BayCarouselMode` mode selection
- `slidesPerView?: number` direct override of config
- `spaceBetween?: number` direct override of config
- `maxHeight?: number | string` max carousel height
- `contentHeight?: number | string` fixed slide content height
- `simulateTouch?: boolean` enable mouse drag simulation (default: `false`)
- `loop?: boolean` loop behavior on edges
- `allowTouchMove?: boolean` disable touch drag if false
- `touchStartPreventDefault?: boolean` touch preventDefault control
- `dir?: string` `ltr` / `rtl`

Autoplay and interaction:
- `pauseOnHover?: boolean`
- `pauseOnInteraction?: boolean`
- `resumeAutoplayOnLeave?: boolean`

Accessibility:
- `keyboardNavigation?: boolean`
- `ariaLabel?: string`
- `announceSlideChanges?: boolean`

Swipe tuning:
- `swipeThreshold?: number` threshold (`<= 1` ratio, `> 1` px)
- `swipeVelocityThreshold?: number`

Sync:
- `syncGroup?: string`
- `syncRole?: 'main' | 'thumbs'`

Performance:
- `visibleOnly?: boolean`
- `renderBuffer?: number`

Legacy compatibility:
- `pagination?: unknown` (reserved/backward-compat input)

### Outputs

- `slideChange: number`
- `swiper: BayCarouselSwiperRef`
- `syncSlideChange: number`
- `swipeGesture: BayCarouselSwipeEvent`

### Breakpoint Behavior

- Breakpoints are minimum widths.
- Matching breakpoints are resolved in ascending order.
- Last matching breakpoint wins.

## Breaking Change Policy

`bay-carousel-ng` follows Semantic Versioning for public API changes.

Public API contract (v1 scope):
- Inputs: `mode`, `config`, `slidesPerView`, `spaceBetween`, `simulateTouch`, `loop`, `syncGroup`, `syncRole`, `swipeThreshold`, `keyboardNavigation`
- Outputs: `slideChange`, `swiper`, `syncSlideChange`, `swipeGesture`
- Behavior contract: loop edges, breakpoint resolution, sync broadcast, keyboard key map

Versioning rules:
- `PATCH`: bug fixes and internal refactors with no public API or behavior-contract change
- `MINOR`: backward-compatible new inputs/outputs/options
- `MAJOR`: removed/renamed/retargeted inputs/outputs, changed default semantics, or keyboard/swipe/sync behavior that breaks existing integrations

Deprecation policy:
1. Mark deprecated API in docs with replacement guidance.
2. Keep deprecated API for at least one minor cycle whenever feasible.
3. Remove only in next major with explicit Migration Notes.

Examples:
- Non-breaking: adding optional `config.newOption?` with default-off behavior.
- Breaking: changing `mode='navigation'` semantics, renaming `syncGroup`, or remapping `ArrowLeft/ArrowRight` behavior.

## Accessibility and Keyboard

Keyboard support:
- `ArrowLeft`, `ArrowRight`
- `Home` (go first page)
- `End` (go last page)

```html
<app-bay-carousel
  [keyboardNavigation]="true"
  [ariaLabel]="'Featured content carousel'"
  [announceSlideChanges]="true"
>
  ...
</app-bay-carousel>
```

## Accessibility Checklist

Use this checklist before release:

- [ ] `ariaLabel` is meaningful for the carousel context.
- [ ] `announceSlideChanges` is enabled when slide changes must be announced to screen readers.
- [ ] Prev/next buttons have clear labels (`Previous slide`, `Next slide`) or equivalent localized labels.
- [ ] Focus order is logical: container -> controls -> interactive slide content.
- [ ] Keyboard navigation is validated (`ArrowLeft`, `ArrowRight`, `Home`, `End`).
- [ ] `keyboardNavigation=false` is used only when an alternative keyboard path is provided.
- [ ] `dir='rtl'` behavior is verified for arrow keys and swipe directions.

## Autoplay Options

```html
<app-bay-carousel
  [config]="{ autoplay: true, autoplayDelay: 2500, loop: true }"
  [pauseOnHover]="true"
  [pauseOnInteraction]="true"
  [resumeAutoplayOnLeave]="true"
>
  ...
</app-bay-carousel>
```

## Swipe Tuning

```html
<app-bay-carousel
  [swipeThreshold]="0.15"
  [swipeVelocityThreshold]="0.35"
  (swipeGesture)="onSwipe($event)"
>
  ...
</app-bay-carousel>
```

## Sync Carousel (Main + Thumbs)

```html
<app-bay-carousel mode="navigation" syncGroup="galleryA" syncRole="main">
  ...
</app-bay-carousel>

<app-bay-carousel mode="default" syncGroup="galleryA" syncRole="thumbs" [contentHeight]="90">
  ...
</app-bay-carousel>
```

## Performance Mode

Use for large lists:

```html
<app-bay-carousel [visibleOnly]="true" [renderBuffer]="2" [contentHeight]="130">
  ...
</app-bay-carousel>
```

## Programmatic Control

```ts
import { Component, viewChild } from '@angular/core';
import { BayCarouselComponent } from 'bay-carousel-ng';

@Component({
  selector: 'app-programmatic',
  imports: [BayCarouselComponent],
  template: `<app-bay-carousel #carousel>...</app-bay-carousel>`,
})
export class ProgrammaticComponent {
  readonly carousel = viewChild.required<BayCarouselComponent>('carousel');

  next(): void {
    this.carousel().swiperRef.slideNext();
  }

  prev(): void {
    this.carousel().swiperRef.slidePrev();
  }

  goTo(index: number): void {
    this.carousel().swiperRef.slideTo(index);
  }
}
```

## Custom Navigation Icons

```html
<app-bay-carousel mode="navigation">
  <ng-template bayCarouselPrevIcon>
    <span>PREV</span>
  </ng-template>

  <ng-template bayCarouselNextIcon>
    <span>NEXT</span>
  </ng-template>

  <ng-template bayCarouselSlide>...</ng-template>
</app-bay-carousel>
```

## Style Customization

```scss
app-bay-carousel {
  --bay-carousel-primary-color: #8b00ff;
  --bay-carousel-primary-color-hover: #6d28d9;
  --bay-carousel-border-color: #cecece;
  --bay-carousel-text-color: #252525;
  --bay-carousel-empty-color: #929292;
  --bay-carousel-medium-radius: 8px;
  --bay-carousel-hover-box-shadow: 0 4px 4px 0 #00000040;
}
```

Light preset:

```scss
app-bay-carousel.theme-light {
  --bay-carousel-primary-color: #5b21b6;
  --bay-carousel-primary-color-hover: #4c1d95;
  --bay-carousel-border-color: #d4d4d8;
  --bay-carousel-text-color: #18181b;
  --bay-carousel-empty-color: #a1a1aa;
  --bay-carousel-medium-radius: 10px;
  --bay-carousel-hover-box-shadow: 0 6px 20px 0 #0000001f;
}
```

Dark preset:

```scss
app-bay-carousel.theme-dark {
  --bay-carousel-primary-color: #a78bfa;
  --bay-carousel-primary-color-hover: #8b5cf6;
  --bay-carousel-border-color: #3f3f46;
  --bay-carousel-text-color: #f4f4f5;
  --bay-carousel-empty-color: #71717a;
  --bay-carousel-medium-radius: 10px;
  --bay-carousel-hover-box-shadow: 0 8px 24px 0 #00000066;
}
```

## Release Process

For each release:
- Update [`CHANGELOG.md`](./CHANGELOG.md) with `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`.
- Include a `Migration Notes` subsection for consumer-facing upgrade actions.
- Follow the step-by-step workflow in [`RELEASING.md`](./RELEASING.md).

## SSR Notes

- Uses browser guards (`isPlatformBrowser`) for window-dependent logic.
- `ResizeObserver` and window listeners are browser-only.

## Build and Publish

From workspace root:

```bash
npm install
npm run build
```

Library-only build:

```bash
ng build bay-carousel
```

Pack test:

```bash
cd dist/bay-carousel
npm pack
```

Publish:

```bash
npm publish --access public
```

## Troubleshooting

- **Bindings not recognized (`NG0303`)**  
  Ensure imports include `BayCarouselComponent` and `BayCarouselSlideDirective`.
- **No arrows or pagination**  
  Check `mode`.
- **Swipe feels unresponsive**  
  Check `allowTouchMove`, `simulateTouch`, `swipeThreshold`, `swipeVelocityThreshold`.
- **Unexpected layout widths**  
  Ensure parent container has a resolved width.
- **Programmatic API undefined**  
  Access `viewChild` after view init lifecycle.
