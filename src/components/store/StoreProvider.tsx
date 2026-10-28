'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getSwal, postJson } from './client-utils';
import VariantModal, { type VariantData } from './VariantModal';

export { getSwal, postJson };

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    bootstrap?: typeof import('bootstrap');
  }
}

interface StoreCtx {
  cartCount: number;
  isLoggedIn: boolean;
  inWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  addToCart: (productId: number, variantId: number | null, quantity: number) => Promise<boolean>;
  addFromCard: (productId: number, hasVariants: boolean) => void;
  refreshCartCount: () => Promise<void>;
  openSearch: () => void;
  closeSearch: () => void;
  searchOpen: boolean;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore must be used inside <StoreProvider>');
  return c;
}

export default function StoreProvider({
  children,
  initialCartCount,
  initialWishlist,
  isLoggedIn,
}: {
  children: ReactNode;
  initialCartCount: number;
  initialWishlist: number[];
  isLoggedIn: boolean;
}) {
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [wishlist, setWishlist] = useState(() => new Set(initialWishlist));
  const [searchOpen, setSearchOpen] = useState(false);
  const [variantData, setVariantData] = useState<{ productId: number; data: VariantData } | null>(null);
  const variantSeq = useRef(0);

  // Bootstrap's own JS (modals, collapses, dropdowns) for the original data-bs-* markup
  useEffect(() => {
    import('bootstrap').then((b) => { window.bootstrap = b; });
  }, []);

  const refreshCartCount = useCallback(async () => {
    try {
      const res = await fetch('/cart/count', { credentials: 'same-origin', cache: 'no-store' });
      const json = (await res.json()) as { count?: number };
      setCartCount(Number(json.count) || 0);
    } catch {
      console.error('Failed to fetch cart count.');
    }
  }, []);

  const addToCart = useCallback(async (productId: number, variantId: number | null, quantity: number) => {
    const Swal = await getSwal();
    try {
      const { ok, data } = await postJson<{ status?: string; message?: string; value?: number }>('/cart/add', {
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      if (ok && data.status === 'success') {
        await refreshCartCount();
        Swal.fire({ title: 'Added to Cart!', text: 'Your item has been successfully added.', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        if (window.fbq) {
          const atc: Record<string, unknown> = {
            content_ids: [String(productId)],
            content_type: 'product',
            currency: 'PKR',
            contents: [{ id: String(productId), quantity: Number(quantity) || 1 }],
          };
          const v = Number(data.value);
          if (!Number.isNaN(v) && v > 0) atc.value = v;
          window.fbq('track', 'AddToCart', atc);
        }
        return true;
      }
      if (ok) {
        Swal.fire('Error', data.message || 'Could not add to cart.', 'error');
      } else {
        Swal.fire('Error', data.message || 'Could not add to cart. Please try again.', 'error');
      }
    } catch {
      Swal.fire('Error', 'Could not add to cart. Please try again.', 'error');
    }
    return false;
  }, [refreshCartCount]);

  const addFromCard = useCallback((productId: number, hasVariants: boolean) => {
    if (!hasVariants) {
      void addToCart(productId, null, 1);
      return;
    }
    const seq = ++variantSeq.current;
    fetch(`/get-product-variants/${productId}`, { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load variants');
        return res.json() as Promise<VariantData>;
      })
      .then((data) => {
        if (seq === variantSeq.current) setVariantData({ productId, data });
      })
      .catch(async () => {
        const Swal = await getSwal();
        Swal.fire({ icon: 'error', title: 'Could not load options', text: 'Please try again or refresh the page.', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false });
      });
  }, [addToCart]);

  const toggleWishlist = useCallback(async (productId: number) => {
    const Swal = await getSwal();
    // A filled heart removes the product again
    const removing = wishlist.has(productId);
    const setHeart = (on: boolean) =>
      setWishlist((prev) => {
        const next = new Set(prev);
        if (on) next.add(productId); else next.delete(productId);
        return next;
      });
    try {
      const { ok, status, data } = await postJson<{ status?: string; message?: string; error?: string }>(
        removing ? '/customer/wishlist/remove' : '/customer/wishlist/add',
        { product_id: productId },
      );
      if (ok) {
        if (data.status === 'removed') {
          setHeart(false);
          Swal.fire({ title: 'Removed', text: data.message, icon: 'success', timer: 1300, showConfirmButton: false });
          return;
        }
        if (data.status === 'added' || data.status === 'exists') setHeart(true);
        if (data.status === 'added') {
          Swal.fire({ title: 'Success', text: data.message || 'Product added to your wishlist.', icon: 'success', timer: 1500, showConfirmButton: false });
        } else if (data.status === 'exists') {
          Swal.fire({ title: 'Already in wishlist', text: data.message || 'This product is already in your wishlist.', icon: 'info', timer: 1500, showConfirmButton: false });
        } else {
          Swal.fire({ title: 'Success', text: data.message || 'Action completed successfully.', icon: 'success' });
        }
        return;
      }
      if (status === 401) {
        const r = await Swal.fire({ title: 'Login Required', text: 'Please login to add items to your wishlist.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Login', cancelButtonText: 'Cancel' });
        if (r.isConfirmed) window.location.href = '/customer/login';
      } else {
        Swal.fire('Error', data.error || 'Something went wrong', 'error');
      }
    } catch {
      Swal.fire('Error', 'Something went wrong', 'error');
    }
  }, [wishlist]);

  const value = useMemo<StoreCtx>(() => ({
    cartCount,
    isLoggedIn,
    inWishlist: (id) => wishlist.has(id),
    toggleWishlist,
    addToCart,
    addFromCard,
    refreshCartCount,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
    searchOpen,
  }), [cartCount, isLoggedIn, wishlist, toggleWishlist, addToCart, addFromCard, refreshCartCount, searchOpen]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <VariantModal
        request={variantData}
        onDone={() => setVariantData(null)}
        onAdd={(productId, variantId) => addToCart(productId, variantId, 1)}
      />
    </Ctx.Provider>
  );
}
