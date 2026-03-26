# bay-carousel

`bay-carousel`, Angular 21+ standalone projelerde kullanilmak uzere hazirlanmis hafif bir carousel/slider kutuphanesidir.

- Standalone Angular component
- Template tabanli slide sistemi (`ng-template`)
- 5 farkli gorunum modu (`default`, `navigation`, `pagination`, `fraction`, `breakpoint`)
- Breakpoint tabanli responsive davranis
- Drag/touch desteği
- Autoplay ve loop
- Programatik kontrol API'si (`swiperRef`)
- Varsayilan gomulu SVG ikonlar + custom icon template desteği

## Icerik

- [Kurulum](#kurulum)
- [Hizli Baslangic](#hizli-baslangic)
- [Kullanim Modlari](#kullanim-modlari)
- [API Referansi](#api-referansi)
- [Custom Icon Template](#custom-icon-template)
- [Programatik Kontrol](#programatik-kontrol)
- [Stil Ozellestirme](#stil-ozellestirme)
- [SSR ve Tarayici Davranisi](#ssr-ve-tarayici-davranisi)
- [Gelistirme Build Pack](#gelistirme-build-pack)
- [npm Public Publish Rehberi](#npm-public-publish-rehberi)
- [Troubleshooting](#troubleshooting)

## Kurulum

```bash
npm i bay-carousel
```

> `peerDependencies`: `@angular/core` ve `@angular/common` (v21+)

## Hizli Baslangic

### 1) Component import et

```ts
import { Component } from '@angular/core';
import { BayCarouselComponent, BayCarouselSlideDirective } from 'bay-carousel';

@Component({
  selector: 'app-example',
  imports: [BayCarouselComponent, BayCarouselSlideDirective],
  templateUrl: './example.component.html',
})
export class ExampleComponent {}
```

### 2) Template kullanimi

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

## Kullanim Modlari

`mode` input'u ile davranis secilir.

### `default`
- Sadece slide alani calisir.
- Nav/pagination UI render edilmez.

```html
<app-bay-carousel mode="default">...</app-bay-carousel>
```

### `navigation`
- Sol/sag ok butonlari render edilir.
- Default olarak gomulu SVG ikon kullanir.
- `bayCarouselPrevIcon` ve `bayCarouselNextIcon` ile override edilebilir.

```html
<app-bay-carousel mode="navigation">...</app-bay-carousel>
```

### `pagination`
- Altta dot pagination render edilir.
- Dot'a tiklandiginda ilgili slide'a gider.

```html
<app-bay-carousel mode="pagination">...</app-bay-carousel>
```

### `fraction`
- `aktifSlide / toplamSlide` formatinda bilgi gosterir.

```html
<app-bay-carousel mode="fraction">...</app-bay-carousel>
```

### `breakpoint`
- Debug odakli moddur.
- Ekran genisligi ve aktif `slidesPerView` bilgisini gosterir.

```html
<app-bay-carousel mode="breakpoint">...</app-bay-carousel>
```

## API Referansi

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
  Ana konfigrasyon nesnesi.
- `mode: BayCarouselMode`  
  Gorunum modu.
- `slidesPerView?: number`  
  `config.slidesPerView` uzerine override eder.
- `spaceBetween?: number`  
  `config.spaceBetween` uzerine override eder.
- `maxHeight?: number | string`  
  Carousel yukseklik limiti (`300` veya `'300px'`).
- `simulateTouch?: boolean`  
  Mouse drag desteği (`config.simulateTouch` fallback).
- `loop?: boolean`  
  Son/ilk slaytta donguye sarar.
- `pagination?: unknown`  
  Geriye uyumluluk alani (su an ic mantikta kullanilmaz).
- `allowTouchMove?: boolean`  
  `false` oldugunda touch drag kapatilir.
- `touchStartPreventDefault?: boolean`  
  Touch start'ta `preventDefault` kontrolu.
- `dir?: string`  
  Container'a `dir` attr yazmak icin (`ltr` / `rtl`).

### Outputs

- `slideChange: number`  
  Aktif index degistiginde tetiklenir.
- `swiper: BayCarouselSwiperRef`  
  Programatik kontrol object'i emit eder.

### `config.breakpoints` davranisi

- Breakpoint key'leri piksel cinsinden minimum genisliktir.
- Sistem ascending siralar, sonra `screenWidth >= breakpoint` olan en son uygun degeri uygular.
- Her breakpoint'te sadece degisecek alanlari yazmaniz yeterlidir.

Ornek:

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

## Custom Icon Template

`mode="navigation"` iken default SVG yerine custom template verebilirsiniz.

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

## Programatik Kontrol

### `viewChild` ile component referansi

```ts
import { Component, viewChild } from '@angular/core';
import { BayCarouselComponent } from 'bay-carousel';

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

### `swiper` output ile referans yakalama

```html
<app-bay-carousel (swiper)="setSwiper($event)">...</app-bay-carousel>
```

```ts
import { BayCarouselSwiperRef } from 'bay-carousel';

swiperRef?: BayCarouselSwiperRef;

setSwiper(ref: BayCarouselSwiperRef): void {
  this.swiperRef = ref;
}
```

## Stil Ozellestirme

Paket icinde fallback CSS variable tanimlari vardir. Proje seviyesinde override edebilirsiniz:

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

## SSR ve Tarayici Davranisi

- Paket SSR uyumlu olacak sekilde `isPlatformBrowser` kontrolu kullanir.
- `window` ve `ResizeObserver` yalnizca browser ortaminda aktif olur.
- SSR tarafinda varsayilan ekran genisligi fallback degeri olarak ele alinir.

## Gelistirme Build Pack

Workspace root'unda:

```bash
npm install
npm run build
```

Sadece library build:

```bash
ng build bay-carousel
```

Paket dry-run:

```bash
cd dist/bay-carousel
npm pack
```

## npm Public Publish Rehberi

Asagidaki adimlar workspace root'u icindir:

1. Surumu guncelle:

```bash
cd projects/bay-carousel
npm version patch
```

2. Library build al:

```bash
cd ../..
ng build bay-carousel
```

3. Dist paketini test et:

```bash
cd dist/bay-carousel
npm pack
```

4. npm hesabi ile login ol:

```bash
npm login
```

5. Public publish yap:

```bash
npm publish --access public
```

Notlar:
- Paket adi npm'de musait olmali (`bay-carousel`).
- Scoped package kullanirsaniz (`@scope/bay-carousel`) yine `--access public` gereklidir.
- `README.md`, `LICENSE`, `repository` bilgileri publish oncesi kontrol edilmelidir.

## Troubleshooting

- `NG0303: Can't bind to ...`  
  Gerekli standalone importlari yaptiginizi kontrol edin (`BayCarouselComponent`, `BayCarouselSlideDirective`).
- Dot veya nav gorunmuyor  
  `mode` degerini kontrol edin (`navigation` / `pagination` / `fraction`).
- Kaydirma calismiyor  
  `allowTouchMove` false olabilir veya `simulateTouch` mouse icin kapali olabilir.
- Beklenmedik slide genisligi  
  Parent container'in gercek width aldigindan emin olun.
- Programatik kontrol undefined  
  `viewChild` referansi olusmadan method cagirmayin (`AfterViewInit` sonrasi cagrin).
