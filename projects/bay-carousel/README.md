# bay-carousel-ng

`bay-carousel-ng` is a lightweight carousel/slider library for Angular 21+ standalone applications.

[npm package](https://www.npmjs.com/package/bay-carousel-ng)

- Standalone Angular component
- Template-based slide system (`ng-template`)
- 5 display modes (`default`, `navigation`, `pagination`, `fraction`, `breakpoint`)
- Breakpoint-based responsive behavior
- Drag/touch support
- Autoplay and loop
- Programmatic control API (`swiperRef`)
- Built-in SVG icons + custom icon template support

## Contents

- [Installation](#installation)
- [npm Page](#npm-page)
- [Quick Start](#quick-start)
- [Modes](#modes)
- [API Reference](#api-reference)
- [Custom Icon Templates](#custom-icon-templates)
- [Programmatic Control](#programmatic-control)
- [Style Customization](#style-customization)
- [SSR and Browser Behavior](#ssr-and-browser-behavior)
- [Development Build Pack](#development-build-pack)
- [npm Public Publish Guide](#npm-public-publish-guide-maintainer)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm i bay-carousel-ng
```

> `peerDependencies`: `@angular/core` and `@angular/common` (v21+)

## npm Page

- Package URL: [https://www.npmjs.com/package/bay-carousel-ng](https://www.npmjs.com/package/bay-carousel-ng)
- You can check the latest published version with:

```bash
npm view bay-carousel-ng version
```

## Quick Start

### 1) Import components

```ts
import { Component } from '@angular/core';
import { BayCarouselComponent, BayCarouselSlideDirective } from 'bay-carousel-ng';

@Component({
  selector: 'app-example',
  imports: [BayCarouselComponent, BayCarouselSlideDirective],
  templateUrl: './example.component.html',
})
export class ExampleComponent {}
```

### 2) Use in template

```html
<app-bay-carousel>
  <ng-template bayCarouselSlide>
    <div>Slide 1</div>
  </ng-template>
  <ng-template bayCarouselSlide>
    <div>Slide 2</div>
  </ng-template>
  <ng-template bayCarouselSlide>
    <div>Slide 3</div>
  </ng-template>
</app-bay-carousel>
```

## Modes

You can control behavior with the `mode` input.

### `default`
- Renders only the slide area.
- No navigation/pagination UI.

```html
<app-bay-carousel mode="default">...</app-bay-carousel>
```

### `navigation`
- Renders previous/next navigation buttons.
- Uses built-in SVG icons by default.
- Can be overridden with `bayCarouselPrevIcon` and `bayCarouselNextIcon`.

```html
<app-bay-carousel mode="navigation">...</app-bay-carousel>
```

### `pagination`
- Renders pagination dots below.
- Clicking a dot moves to that slide.

```html
<app-bay-carousel mode="pagination">...</app-bay-carousel>
```

### `fraction`
- Displays `activeSlide / totalSlides`.

```html
<app-bay-carousel mode="fraction">...</app-bay-carousel>
```

### `breakpoint`
- Debug-focused mode.
- Shows current screen width and active `slidesPerView`.

```html
<app-bay-carousel mode="breakpoint">...</app-bay-carousel>
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
```

### Inputs

- `config: BayCarouselConfig`  
  Main configuration object.
- `mode: BayCarouselMode`  
  Display mode.
- `slidesPerView?: number`  
  Overrides `config.slidesPerView`.
- `spaceBetween?: number`  
  Overrides `config.spaceBetween`.
- `maxHeight?: number | string`  
  Max height for the carousel (`300` or `'300px'`).
- `simulateTouch?: boolean`  
  Enables mouse drag support (fallback to `config.simulateTouch`).
- `loop?: boolean`  
  Wraps from last to first and vice versa.
- `pagination?: unknown`  
  Backward compatibility input (currently not used in internal logic).
- `allowTouchMove?: boolean`  
  Disables touch drag when set to `false`.
- `touchStartPreventDefault?: boolean`  
  Controls `preventDefault` on touch start.
- `dir?: string`  
  Sets `dir` attribute on container (`ltr` / `rtl`).

### Outputs

- `slideChange: number`  
  Emits when active index changes.
- `swiper: BayCarouselSwiperRef`  
  Emits programmatic control object.

### `config.breakpoints` behavior

- Breakpoint keys are minimum widths in pixels.
- Breakpoints are sorted in ascending order, and the last matching one (`screenWidth >= breakpoint`) wins.
- You only need to define values that should change at each breakpoint.

Example:

```ts
config: BayCarouselConfig = {
  slidesPerView: 1,
  spaceBetween: 16,
  breakpoints: {
    640: { slidesPerView: 2 },
    1024: { slidesPerView: 3, spaceBetween: 24 },
    1440: { slidesPerView: 4, spaceBetween: 28 },
  },
};
```

## Custom Icon Templates

When `mode="navigation"`, you can replace built-in SVG icons with custom templates.

```html
<app-bay-carousel mode="navigation">
  <ng-template bayCarouselPrevIcon>
    <span class="my-icon">PREV</span>
  </ng-template>

  <ng-template bayCarouselNextIcon>
    <span class="my-icon">NEXT</span>
  </ng-template>

  <ng-template bayCarouselSlide>...</ng-template>
  <ng-template bayCarouselSlide>...</ng-template>
</app-bay-carousel>
```

## Programmatic Control

### Using `viewChild` component reference

```ts
import { Component, viewChild } from '@angular/core';
import { BayCarouselComponent } from 'bay-carousel-ng';

@Component({
  selector: 'app-programmatic',
  imports: [BayCarouselComponent],
  templateUrl: './programmatic.component.html',
})
export class ProgrammaticComponent {
  readonly carousel = viewChild.required<BayCarouselComponent>('carousel');

  next(): void {
    this.carousel().swiperRef.slideNext(300);
  }

  prev(): void {
    this.carousel().swiperRef.slidePrev(300);
  }

  goSecond(): void {
    this.carousel().swiperRef.slideTo(1, 300);
  }
}
```

```html
<app-bay-carousel #carousel>...</app-bay-carousel>
```

### Using `swiper` output

```html
<app-bay-carousel (swiper)="setSwiper($event)">...</app-bay-carousel>
```

```ts
import { BayCarouselSwiperRef } from 'bay-carousel-ng';

swiperRef?: BayCarouselSwiperRef;

setSwiper(ref: BayCarouselSwiperRef): void {
  this.swiperRef = ref;
}
```

## Style Customization

The package defines fallback CSS variables. You can override them at app level:

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

## SSR and Browser Behavior

- Uses `isPlatformBrowser` checks for SSR compatibility.
- `window` and `ResizeObserver` are only used in browser runtime.
- Uses a fallback screen width on server-side rendering.

## Development Build Pack

From workspace root:

```bash
npm install
npm run build
```

Library-only build:

```bash
ng build bay-carousel
```

Package dry-run:

```bash
cd dist/bay-carousel
npm pack
```

## npm Public Publish Guide (Maintainer)

Run the following steps from workspace root:

1. Bump version:

```bash
cd projects/bay-carousel
npm version patch
```

2. Build library:

```bash
cd ../..
ng build bay-carousel
```

3. Test package tarball:

```bash
cd dist/bay-carousel
npm pack
```

4. Login to npm:

```bash
npm login
```

5. Publish publicly:

```bash
npm publish --access public
```

Notes:
- Package name must be available on npm (`bay-carousel-ng`).
- Scoped packages (`@scope/bay-carousel-ng`) also require `--access public`.
- Verify `README.md`, `LICENSE`, and repository metadata before publishing.

## Troubleshooting

- `NG0303: Can't bind to ...`  
  Ensure standalone imports are included (`BayCarouselComponent`, `BayCarouselSlideDirective`).
- Navigation/pagination not visible  
  Check `mode` value (`navigation` / `pagination` / `fraction`).
- Drag does not work  
  `allowTouchMove` might be `false`, or `simulateTouch` may be disabled for mouse drag.
- Unexpected slide widths  
  Ensure parent container has a resolved width.
- Programmatic control is undefined  
  Do not call methods before `viewChild` is ready (use after view init lifecycle).
