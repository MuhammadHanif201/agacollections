// Swiper 6.5.4 (the version the storefront CSS was written for) ships no root typings.
declare module 'swiper/bundle' {
  export interface SwiperInstance {
    update(): void;
    destroy(deleteInstance?: boolean, cleanStyles?: boolean): void;
    slideTo(index: number, speed?: number): void;
    slideNext(): void;
    slidePrev(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    activeIndex: number;
    realIndex: number;
  }
  export default class Swiper implements SwiperInstance {
    constructor(el: HTMLElement | string, options?: Record<string, unknown>);
    update(): void;
    destroy(deleteInstance?: boolean, cleanStyles?: boolean): void;
    slideTo(index: number, speed?: number): void;
    slideNext(): void;
    slidePrev(): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
    activeIndex: number;
    realIndex: number;
  }
}
