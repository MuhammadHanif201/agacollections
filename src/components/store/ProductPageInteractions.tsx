'use client';

import { useEffect } from 'react';
import { getSwal } from './client-utils';
import { useStore } from './StoreProvider';

interface VariantInfo {
  id: string;
  sku: string;
  price: string;
  sale_price: string;
  image: string;
  options: Record<string, string>;
}

/**
 * productDetail.blade.php scripts on the server-rendered markup: gallery and lightbox,
 * size chart, quantity, size picker (availability, price, SKU, WhatsApp text), sticky
 * buy bar, copy link, review form, mobile swiper and the Pixel ViewContent event.
 */
export default function ProductPageInteractions({
  productId,
  productQuantity,
  images,
  pixel,
}: {
  productId: number;
  productQuantity: number;
  images: string[];
  pixel: { id: string; name: string; value: string };
}) {
  const { addToCart } = useStore();

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(el: Element | Document | Window | null | undefined, ev: K | string, fn: (e: Event) => void, opts?: AddEventListenerOptions) => {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      cleanups.push(() => el.removeEventListener(ev, fn, opts));
    };
    const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
    const $$ = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));

    if (window.fbq) window.fbq('track', 'ViewContent', { content_ids: [pixel.id], content_name: pixel.name, content_type: 'product', value: Number(pixel.value), currency: 'PKR' });

    // ── Desktop gallery ──
    const IMGS = images;
    let current = 0;
    const mainImg = $<HTMLImageElement>('#main-preview-image');
    const counter = $('#pd-counter-cur');
    const thumbs = $$<HTMLElement>('.pd-thumb');
    const show = (i: number, src?: string) => {
      if (!IMGS.length) return;
      current = (i + IMGS.length) % IMGS.length;
      const url = src || IMGS[current];
      if (mainImg && mainImg.getAttribute('src') !== url) {
        mainImg.classList.add('is-swapping');
        const pre = new Image();
        pre.onload = pre.onerror = () => { mainImg.src = url; mainImg.classList.remove('is-swapping'); };
        pre.src = url;
      }
      thumbs.forEach((t) => t.classList.toggle('active', Number(t.dataset.index) === current));
      if (counter) counter.textContent = String(current + 1);
    };
    const setImage = (src: string) => { const idx = IMGS.indexOf(src); show(idx >= 0 ? idx : current, src); };
    thumbs.forEach((t) => on(t, 'click', () => show(Number(t.dataset.index))));
    $$<HTMLElement>('.pd-nav').forEach((b) => on(b, 'click', (e) => { e.stopPropagation(); show(current + Number(b.dataset.dir)); }));

    // ── Lightbox ──
    const lb = $('#pd-lightbox');
    const lbImg = $<HTMLImageElement>('#pd-lb-img');
    const lbCur = $('#pd-lb-cur');
    let lbIndex = 0;
    const lbShow = (i: number) => { lbIndex = (i + IMGS.length) % IMGS.length; if (lbImg) lbImg.src = IMGS[lbIndex]; if (lbCur) lbCur.textContent = String(lbIndex + 1); };
    const lbOpen = (i: number) => { lbShow(i); lb?.classList.add('is-open'); document.body.style.overflow = 'hidden'; lb?.querySelector<HTMLElement>('.pd-lb-close')?.focus(); };
    const lbClose = () => { lb?.classList.remove('is-open'); document.body.style.overflow = ''; };
    const stage = $('#pd-stage');
    on(stage, 'click', () => lbOpen(current));
    on(stage, 'keydown', (e) => { const k = (e as KeyboardEvent).key; if (k === 'Enter' || k === ' ') { e.preventDefault(); lbOpen(current); } });
    $$<HTMLImageElement>('.pd-mobile-swiper img').forEach((im) => on(im, 'click', () => lbOpen(Number(im.dataset.index) || 0)));
    on(lb?.querySelector('.pd-lb-close'), 'click', lbClose);
    on(lb, 'click', (e) => { if (e.target === lb) lbClose(); });
    on(lb?.querySelector('.pd-lb-prev'), 'click', () => lbShow(lbIndex - 1));
    on(lb?.querySelector('.pd-lb-next'), 'click', () => lbShow(lbIndex + 1));
    const sc = $('#sizeChartModal');
    on(document, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (lb?.classList.contains('is-open')) {
        if (k === 'Escape') lbClose();
        if (k === 'ArrowLeft') lbShow(lbIndex - 1);
        if (k === 'ArrowRight') lbShow(lbIndex + 1);
      }
      if (sc && sc.classList.contains('is-open') && k === 'Escape') sc.classList.remove('is-open');
    });

    // ── Size chart ──
    $$('[data-open-sizechart]').forEach((b) => on(b, 'click', () => sc?.classList.add('is-open')));
    on(sc, 'click', (e) => { if (e.target === sc) sc?.classList.remove('is-open'); });
    on(sc?.querySelector('.pd-sc-close'), 'click', () => sc?.classList.remove('is-open'));

    // ── Quantity ──
    const qty = $<HTMLInputElement>('#product-qty');
    $$<HTMLElement>('[data-qty]').forEach((b) => on(b, 'click', () => {
      if (!qty) return;
      const v = (parseInt(qty.value, 10) || 1) + Number(b.dataset.qty);
      qty.value = String(Math.max(1, Math.min(99, v)));
    }));
    on(qty, 'change', () => { if (qty) qty.value = String(Math.max(1, Math.min(99, parseInt(qty.value, 10) || 1))); });

    // ── Reviews: open the form (button, or a link ending in #write-review) ──
    const revForm = $<HTMLElement>('#pd-rev-form');
    const openReviewForm = () => {
      if (!revForm) return;
      revForm.hidden = false;
      $('#reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => { revForm.scrollIntoView({ behavior: 'smooth', block: 'center' }); $<HTMLInputElement>('#review-name')?.focus({ preventScroll: true }); }, 450);
    };
    $$('[data-open-review]').forEach((b) => on(b, 'click', (e) => { e.preventDefault(); openReviewForm(); }));
    if (location.hash === '#write-review') setTimeout(openReviewForm, 300);

    // ── Copy link ──
    const copyBtn = $<HTMLButtonElement>('#pd-copy-link');
    on(copyBtn, 'click', () => {
      if (!copyBtn) return;
      const url = copyBtn.dataset.url ?? location.href;
      const done = () => { copyBtn.innerHTML = '<i class="ri-check-line"></i>'; setTimeout(() => { copyBtn.innerHTML = '<i class="ri-link"></i>'; }, 1600); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, done);
      else {
        const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        t.remove(); done();
      }
    });

    // ── Mobile sticky bar: only while the main Add to Cart is off screen ──
    const sticky = $('#pd-sticky');
    const buy = $('#pd-buy');
    if (sticky && buy) {
      let ticking = false;
      const sync = () => {
        ticking = false;
        const footer = document.querySelector('footer');
        const buyGone = buy.getBoundingClientRect().bottom < 0;
        const footerIn = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
        const vis = buyGone && !footerIn && window.innerWidth < 768;
        sticky.classList.toggle('is-visible', vis);
        sticky.setAttribute('aria-hidden', vis ? 'false' : 'true');
        document.body.classList.toggle('pd-sticky-on', vis);
      };
      const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(sync); } };
      on(window, 'scroll', request, { passive: true });
      on(window, 'resize', request, { passive: true });
      sync();
      cleanups.push(() => document.body.classList.remove('pd-sticky-on'));
    }

    // ── Review form submit ──
    const form = $<HTMLFormElement>('#review-form');
    on(form, 'submit', async (e) => {
      e.preventDefault();
      if (!form) return;
      const rating = form.querySelector<HTMLInputElement>('input[name="rating"]:checked');
      const ratingError = $('#rating-error')!;
      const serverError = $('#review-server-error')!;
      const submitBtn = $<HTMLButtonElement>('#review-submit-btn')!;
      ratingError.style.display = 'none';
      serverError.style.display = 'none';
      if (!rating) { ratingError.style.display = 'block'; return; }
      const name = ($<HTMLInputElement>('#review-name')?.value ?? '').trim();
      const email = ($<HTMLInputElement>('#review-email')?.value ?? '').trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
        serverError.textContent = 'Please enter your name and a valid email.';
        serverError.style.display = 'block';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting…';
      try {
        const res = await fetch(`/product/${productId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ name, email, rating: rating.value, comment: ($<HTMLTextAreaElement>('#review-comment')?.value ?? '').trim() }),
        });
        const data = (await res.json()) as { success?: boolean; message?: string; errors?: Record<string, string[]> };
        if (res.ok && data.success) {
          form.style.display = 'none';
          $('#review-success-msg')!.style.display = 'block';
        } else {
          let msg = data.message || 'Something went wrong. Please try again.';
          if (data.errors) msg = Object.values(data.errors).flat().join(' ');
          throw new Error(msg);
        }
      } catch (err) {
        serverError.textContent = err instanceof Error && err.message ? err.message : 'Network error. Please try again.';
        serverError.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="ri-send-plane-line"></i> Submit review';
      }
    });

    // ── Mobile gallery swiper ──
    let mobileSwiper: { destroy: (a?: boolean, b?: boolean) => void } | null = null;
    const msEl = $('.pd-mobile-swiper');
    if (msEl) {
      import('swiper/bundle').then(({ default: Swiper }) => {
        mobileSwiper = new Swiper(msEl, { slidesPerView: 1, spaceBetween: 0, loop: false, grabCursor: true, watchOverflow: true, pagination: { el: '.pd-mobile-pagination', clickable: true } });
      });
      cleanups.push(() => mobileSwiper?.destroy(true, true));
    }

    // ── Size picker ──
    const scope = $('#pd-options');
    const atcs = $$<HTMLButtonElement>('.js-pd-atc');
    const stock = $<HTMLElement>('#pd-stock-note');
    const variantEls = $$<HTMLElement>('.variant-data');
    const selectedInput = $<HTMLInputElement>('#selected-variant-id');
    const selected: Record<string, string> = {};
    const fmt = (n: string | number) => Math.round(parseFloat(String(n))).toLocaleString('en-US');
    const optionsOf = (el: HTMLElement) => JSON.parse(el.dataset.options || '{}') as Record<string, string>;
    const buys = $$<HTMLButtonElement>('.js-pd-buynow');
    const setAtc = (ok: boolean) => {
      atcs.forEach((b) => {
        b.classList.toggle('disabled', !ok);
        b.setAttribute('aria-disabled', ok ? 'false' : 'true');
        b.innerHTML = ok ? '<i class="ri-shopping-bag-line"></i> Add to Cart' : '<i class="ri-close-circle-line"></i> Sold out';
      });
      // Buy it now only while the chosen size can be bought
      buys.forEach((b) => { b.hidden = !ok; });
    };

    const updateDisplay = (v: VariantInfo) => {
      if (v.image) setImage(v.image);
      const price = parseFloat(v.price);
      const old = parseFloat(v.sale_price);
      let html = '<span class="pd-price-now">PKR ' + fmt(price) + '</span>';
      let stickyHtml = 'PKR ' + fmt(price);
      if (old && old > price) {
        const pct = Math.round(100 - (price / old) * 100);
        html += '<span class="pd-price-was">PKR ' + fmt(old) + '</span><span class="pd-price-off">' + pct + '% off</span>';
        stickyHtml += '<s>PKR ' + fmt(old) + '</s>';
      }
      const priceEl = $('#product-price'); if (priceEl) priceEl.innerHTML = html;
      const sp = $('#pd-sticky-price'); if (sp) sp.innerHTML = stickyHtml;
      if (v.sku) { const s = $('#product-sku'); if (s) s.textContent = v.sku; }
      if (selectedInput) selectedInput.value = v.id;
      for (const k of Object.keys(v.options)) {
        const t = document.getElementById(`variant-${k}-text`);
        if (t) t.textContent = String(v.options[k]).toUpperCase();
      }
      const el = variantEls.find((x) => x.dataset.variantId === v.id);
      const q = parseInt(el?.dataset.quantity ?? '0', 10) || 0;
      setAtc(q > 0);
      if (stock) {
        if (q > 0 && q <= 5) { stock.textContent = `Only ${q} left in this size`; stock.hidden = false; } else stock.hidden = true;
      }
    };

    const findVariant = (): VariantInfo | null => {
      for (const el of variantEls) {
        const o = optionsOf(el);
        if (Object.keys(selected).every((k) => String(o[k]).toLowerCase() === String(selected[k]).toLowerCase())) {
          return { id: el.dataset.variantId ?? '', sku: el.dataset.sku ?? '', price: el.dataset.price ?? '', sale_price: el.dataset.salePrice ?? '', image: el.dataset.image ?? '', options: o };
        }
      }
      return null;
    };

    const refreshAvailability = () => {
      scope?.querySelectorAll<HTMLElement>('[data-option-group]').forEach((groupEl) => {
        const group = String(groupEl.dataset.optionGroup).toLowerCase();
        groupEl.querySelectorAll<HTMLButtonElement>('.option-btn').forEach((b) => {
          const test: Record<string, string> = {};
          Object.keys(selected).forEach((k) => { if (k !== group) test[k] = selected[k]; });
          test[group] = b.dataset.optionValue ?? '';
          const has = variantEls.some((el) => {
            if ((parseInt(el.dataset.quantity ?? '0', 10) || 0) <= 0) return false;
            const o = optionsOf(el);
            return Object.keys(test).every((k) => String(o[k] ?? '').toLowerCase() === String(test[k]).toLowerCase());
          });
          b.disabled = !has;
          b.classList.toggle('disabled', !has);
          if (!has && b.classList.contains('btn-primary')) { b.classList.remove('btn-primary'); delete selected[group]; }
        });
      });
    };

    on(scope, 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.option-btn');
      if (!b || !scope?.contains(b)) return;
      const name = String(b.dataset.optionName).toLowerCase();
      scope.querySelectorAll<HTMLElement>(`[data-option-group="${name}"] .option-btn`).forEach((x) => { x.classList.remove('btn-primary'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('btn-primary');
      b.setAttribute('aria-pressed', 'true');
      selected[name] = b.dataset.optionValue ?? '';
      refreshAvailability();
      const v = findVariant();
      if (v) updateDisplay(v); else if (selectedInput) selectedInput.value = '';
    });

    // The shopper picks the size; only a group with a single value in stock is chosen for them
    const groups = scope ? Array.from(scope.querySelectorAll<HTMLElement>('[data-option-group]')) : [];
    if (selectedInput) selectedInput.value = '';
    if (variantEls.length) {
      refreshAvailability();
      groups.forEach((groupEl) => {
        const open = groupEl.querySelectorAll<HTMLButtonElement>('.option-btn:not(:disabled)');
        if (open.length === 1) {
          selected[String(groupEl.dataset.optionGroup).toLowerCase()] = open[0].dataset.optionValue ?? '';
          open[0].classList.add('btn-primary');
          open[0].setAttribute('aria-pressed', 'true');
        }
      });
      const anyInStock = variantEls.some((el) => (parseInt(el.dataset.quantity ?? '0', 10) || 0) > 0);
      const v0 = groups.every((g) => selected[String(g.dataset.optionGroup).toLowerCase()] !== undefined) ? findVariant() : null;
      if (v0) updateDisplay(v0); else setAtc(anyInStock);
    } else {
      setAtc(productQuantity > 0);
    }

    // ── Add to Cart (main button and the sticky bar) with the chosen size and quantity ──
    const addChosen = async (): Promise<boolean> => {
      const variantId = selectedInput?.value ? Number(selectedInput.value) : null;
      if (variantEls.length && !variantId) {
        const missing = groups.filter((g) => selected[String(g.dataset.optionGroup).toLowerCase()] === undefined).map((g) => String(g.dataset.optionGroup).toLowerCase());
        scope?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        void getSwal().then((Swal) => Swal.fire({ icon: 'info', title: `Please choose a ${missing[0] ?? 'size'}`, timer: 2200, showConfirmButton: false, toast: true, position: 'top-end' }));
        return false;
      }
      const quantity = parseInt(qty?.value ?? '1', 10) || 1;
      return addToCart(productId, variantId, quantity);
    };
    atcs.forEach((b) => on(b, 'click', (e) => { e.preventDefault(); void addChosen(); }));

    // ── Buy it now: the same, then straight to checkout ──
    buys.forEach((b) => on(b, 'click', (e) => {
      e.preventDefault();
      if (b.hidden || b.disabled) return;
      b.disabled = true;
      void addChosen().then((added) => {
        if (added) window.location.assign('/checkout');
        else b.disabled = false;
      });
    }));

    return () => cleanups.forEach((c) => c());
  }, [productId, productQuantity, images, pixel.id, pixel.name, pixel.value, addToCart]);

  return null;
}
