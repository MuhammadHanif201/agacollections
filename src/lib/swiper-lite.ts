// Swiper 6 core plus only the two modules the store uses: Navigation (card arrows) and Pagination (the phone gallery
// dots). 'swiper/bundle' brought every module (autoplay, effects, zoom, virtual...) into the script each card loads.
type SwiperCtor = new (el: HTMLElement, options?: Record<string, unknown>) => {
  destroy: (deleteInstance?: boolean, cleanStyles?: boolean) => void;
};

let ready: Promise<SwiperCtor> | null = null;

export function loadSwiper(): Promise<SwiperCtor> {
  ready ??= import('swiper').then((m) => {
    const lib = m as unknown as { default: SwiperCtor & { use: (mods: unknown[]) => void }; Navigation: unknown; Pagination: unknown };
    lib.default.use([lib.Navigation, lib.Pagination]);
    return lib.default;
  });
  return ready;
}
