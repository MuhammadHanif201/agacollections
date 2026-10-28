'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSwal } from './client-utils';

export interface VariantData {
  variants: { id: number; sku: string | null; price: string; image: string; quantity: number | null; options: Record<string, string> }[];
  optionGroups: Record<string, Record<string, boolean>>;
}

type Selected = Record<string, string>;

const eq = (a: unknown, b: unknown) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

/** The "Choose Variant" Bootstrap modal from the footer, opened by card "Add to Cart" buttons. */
export default function VariantModal({
  request,
  onDone,
  onAdd,
}: {
  request: { productId: number; data: VariantData } | null;
  onDone: () => void;
  onAdd: (productId: number, variantId: number) => Promise<boolean>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Selected>({});
  const [hover, setHover] = useState(false);
  const variants = useMemo(() => request?.data.variants ?? [], [request]);
  const groups = request?.data.optionGroups ?? {};
  const groupNames = Object.keys(groups);

  // Show the modal each time a product's options arrive
  useEffect(() => {
    if (!request || !ref.current) return;
    setSelected({});
    const el = ref.current;
    let modal: { show(): void; hide(): void } | null = null;
    const onHidden = () => onDone();
    el.addEventListener('hidden.bs.modal', onHidden);
    import('bootstrap').then((b) => {
      modal = b.Modal.getOrCreateInstance(el);
      modal.show();
    });
    return () => { el.removeEventListener('hidden.bs.modal', onHidden); void modal; };
  }, [request, onDone]);

  // An option stays enabled while some in-stock variant matches it plus the other choices
  const isAvailable = (group: string, value: string, sel: Selected) => {
    const test: Selected = {};
    for (const [k, v] of Object.entries(sel)) if (k.toLowerCase() !== group.toLowerCase()) test[k.toLowerCase()] = v;
    test[group.toLowerCase()] = value;
    return variants.some((v) => (Number(v.quantity) || 0) > 0 && Object.entries(test).every(([k, val]) => eq(v.options[k], val)));
  };

  const choose = (group: string, value: string) => {
    const next: Selected = { ...selected, [group]: value };
    // Deselect choices that the new one rules out
    for (const g of groupNames) {
      if (next[g] !== undefined && !isAvailable(g, next[g], next)) delete next[g];
    }
    setSelected(next);
  };

  const findMatch = (sel: Selected) =>
    variants.find((v) => Object.entries(v.options).every(([k, val]) => sel[k.toLowerCase()] != null && eq(sel[k.toLowerCase()], val)));

  const complete = Object.keys(selected).length === groupNames.length;
  const matched = complete ? findMatch(selected) : undefined;
  const state: 'ok' | 'oos' | 'na' = !complete ? 'ok' : matched ? ((Number(matched.quantity) || 0) <= 0 ? 'oos' : 'ok') : 'na';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    const Swal = await getSwal();
    if (Object.keys(selected).length !== groupNames.length) {
      Swal.fire({ icon: 'warning', title: 'Please select all options' });
      return;
    }
    const m = findMatch(selected);
    if (!m) { Swal.fire({ icon: 'error', title: 'No matching variant found' }); return; }
    if ((Number(m.quantity) || 0) <= 0) { Swal.fire({ icon: 'error', title: 'Out of Stock', text: 'This variant is currently out of stock.' }); return; }
    void onAdd(request.productId, m.id);
    const b = await import('bootstrap');
    if (ref.current) b.Modal.getInstance(ref.current)?.hide();
  };

  return (
    <div className="modal fade" id="variantModal" tabIndex={-1} aria-labelledby="variantModalLabel" aria-hidden="true" ref={ref}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <form id="variantForm" className="w-100" onSubmit={submit}>
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 0, overflow: 'hidden' }}>
            <div className="modal-header border-0 pb-0" style={{ background: 'var(--dc-cream)' }}>
              <h5 className="modal-title" id="variantModalLabel" style={{ fontFamily: "var(--heading-font,'Fraunces',serif)", fontSize: '1rem', color: 'var(--dc-dark)', fontWeight: 300, fontStyle: 'italic' }}>
                <i className="ri-shopping-bag-line me-2" style={{ color: 'var(--dc-dark)' }}></i>
                Choose Variant
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body" style={{ background: 'var(--dc-cream)' }}>
              <div id="variantOptionsContainer">
                {groupNames.map((optionName) => (
                  <div className="mb-3" key={optionName}>
                    <label className="fw-bold text-capitalize">{optionName}:</label>
                    <div className="d-flex flex-wrap gap-2 mt-2" data-option-group={optionName}>
                      {Object.keys(groups[optionName]).map((val) => {
                        const active = selected[optionName] === val;
                        // Before anything is picked every option is selectable, as before
                        const disabled = Object.keys(selected).length > 0 && !isAvailable(optionName, val, selected);
                        return (
                          <button
                            type="button"
                            key={val}
                            className={`btn btn-outline-dark option-btn${active ? ' active' : ''}${disabled ? ' disabled btn-secondary' : ''}`}
                            data-option-name={optionName}
                            data-option-value={val}
                            disabled={disabled}
                            onClick={() => choose(optionName, val)}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer border-0 pt-0" style={{ background: 'var(--dc-cream)' }}>
              <button
                type="submit"
                className={`btn w-100 ${state === 'ok' ? 'btn-dark' : 'disabled btn-secondary'}`}
                style={{ background: hover ? '#fff' : 'var(--dc-dark)', color: hover ? '#161426' : '#fff', borderRadius: 0, letterSpacing: '0.18em', fontSize: '0.72rem', textTransform: 'uppercase', padding: 12, fontFamily: 'var(--body-font)', transition: 'background 0.22s,color 0.22s' }}
                onMouseOver={() => setHover(true)}
                onMouseOut={() => setHover(false)}
              >
                {state === 'ok' && <><i className="fas fa-cart-plus me-2"></i> Add to Cart</>}
                {state === 'oos' && <><i className="fas fa-ban me-2"></i> Out of Stock</>}
                {state === 'na' && <><i className="fas fa-ban me-2"></i> Not Available</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
