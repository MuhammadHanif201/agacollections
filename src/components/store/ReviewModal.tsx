'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STEPS = 5;
const MAX_PHOTOS = 5;
const MIN_REVIEW = 10;
const AGE_GROUPS = ['Below 18', '18-34', '35-54', '55+'];
const GENDERS = ['Male', 'Female'];
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

interface Photo { file: Blob; url: string }

/** Shrink a photo in the browser (max 1600px JPEG) so uploads stay small on mobile data */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

/**
 * Step-by-step "Write a review" popup: rating, photos, review text, quick questions,
 * name and email. Opens from any [data-open-review] element (and #write-review).
 */
export default function ReviewModal({
  productId,
  productName,
  productImage,
  defaultName = '',
  defaultEmail = '',
}: {
  productId: number;
  productName: string;
  productImage: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1..5, 6 = thank you
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState<'yes' | 'no' | ''>('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setStep(1); setRating(0); setHover(0); setTitle(''); setComment(''); setRecommend(''); setAge(''); setGender('');
    setName(defaultName); setEmail(defaultEmail); setError(''); setConfirmLeave(false);
    setPhotos((ps) => { ps.forEach((p) => URL.revokeObjectURL(p.url)); return []; });
  }, [defaultName, defaultEmail]);

  // Open from the "Write a review" links and buttons
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.('[data-open-review]');
      if (!t) return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener('click', onClick);
    const t = location.hash === '#write-review' ? setTimeout(() => setOpen(true), 0) : undefined;
    return () => { document.removeEventListener('click', onClick); clearTimeout(t); };
  }, []);

  // Lock the page behind the popup
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /** Move to another step: clear the old message and start at the top */
  const go = (n: number) => { setError(''); setStep(n); requestAnimationFrame(() => bodyRef.current?.scrollTo({ top: 0 })); };

  const dirty = step <= STEPS && (rating > 0 || photos.length > 0 || comment.trim() !== '' || title.trim() !== '');
  const close = useCallback(() => {
    if (dirty) { setConfirmLeave(true); return; }
    setOpen(false);
    reset();
  }, [dirty, reset]);
  const leave = () => { setOpen(false); reset(); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmLeave) setConfirmLeave(false);
      else close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, confirmLeave, close]);

  const addFiles = async (list: FileList | File[] | null) => {
    if (!list) return;
    const imgs = [...list].filter((f) => f.type.startsWith('image/'));
    const room = MAX_PHOTOS - photos.length;
    if (imgs.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    else if (imgs.length < [...list].length) setError('Only photos can be added (JPG, PNG or WebP).');
    else setError('');
    const picked = imgs.slice(0, Math.max(0, room));
    const made = await Promise.all(picked.map(async (f) => { const b = await shrink(f); return { file: b, url: URL.createObjectURL(b) }; }));
    setPhotos((ps) => [...ps, ...made].slice(0, MAX_PHOTOS));
  };
  const removePhoto = (i: number) => setPhotos((ps) => { URL.revokeObjectURL(ps[i].url); return ps.filter((_, j) => j !== i); });

  const emailOk = /^\S+@\S+\.\S+$/.test(email.trim());
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    const fd = new FormData();
    fd.append('rating', String(rating));
    fd.append('title', title.trim());
    fd.append('comment', comment.trim());
    fd.append('recommend', recommend);
    if (age) fd.append('age_group', age);
    if (gender) fd.append('gender', gender);
    fd.append('name', name.trim());
    fd.append('email', email.trim());
    photos.forEach((p, i) => fd.append('photos[]', p.file, `photo-${i + 1}.jpg`));
    try {
      const res = await fetch(`/product/${productId}/review`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; errors?: Record<string, string[]> };
      if (res.ok && data.success) { go(6); return; }
      if (res.status === 413) throw new Error('Your photos are too large. Please remove one and try again.');
      throw new Error(data.message || 'Something went wrong. Please try again.');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const shown = hover || rating;
  let footer: React.ReactNode = null;
  if (step === 1) {
    footer = <button type="button" className="zq-rm-btn" disabled={!rating} onClick={() => go(2)}>Continue</button>;
  } else if (step === 2) {
    footer = photos.length
      ? <button type="button" className="zq-rm-btn" onClick={() => go(3)}>Continue</button>
      : <button type="button" className="zq-rm-btn is-ghost" onClick={() => go(3)}>Skip</button>;
  } else if (step === 3) {
    const left = MIN_REVIEW - comment.trim().length;
    footer = <button type="button" className="zq-rm-btn" disabled={left > 0} onClick={() => go(4)}>{left > 0 ? `Write at least ${MIN_REVIEW} characters` : 'Continue'}</button>;
  } else if (step === 4) {
    footer = <button type="button" className="zq-rm-btn" disabled={!recommend} onClick={() => go(5)}>Continue</button>;
  } else if (step === 5) {
    const label = !name.trim() ? 'Add your name to submit' : !emailOk ? 'Add your email to submit' : busy ? 'Submitting…' : 'Submit review';
    footer = (
      <>
        <button type="button" className="zq-rm-btn" disabled={!name.trim() || !emailOk || busy} onClick={submit}>{label}</button>
        <p className="zq-rm-legal">By submitting, you agree to our <a href="/terms" target="_blank" rel="noopener">Terms</a> and <a href="/policy/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
      </>
    );
  } else {
    footer = <button type="button" className="zq-rm-btn" onClick={leave}>Done</button>;
  }

  const pill = (value: string, current: string, set: (v: string) => void, optional = false) => (
    <button key={value} type="button" className={`zq-rm-pill ${current === value ? 'is-on' : ''}`} aria-pressed={current === value}
      onClick={() => set(optional && current === value ? '' : value)}>{value}</button>
  );

  // Rendered on <body> so no page container or sticky header can sit above it
  return createPortal(
    <div className="zq-rm" role="dialog" aria-modal="true" aria-label={`Write a review for ${productName}`} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="zq-rm-card">
        <div className="zq-rm-head">
          {step > 1 && step <= STEPS
            ? <button type="button" className="zq-rm-icon" aria-label="Back" onClick={() => go(step - 1)}><i className="ri-arrow-left-s-line"></i></button>
            : <span className="zq-rm-icon is-blank" aria-hidden="true"></span>}
          <div className="zq-rm-progress" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => <span key={i} className={i < Math.min(step, STEPS) ? 'is-done' : ''}></span>)}
          </div>
          <button type="button" className="zq-rm-icon" aria-label="Close" onClick={close}><i className="ri-close-line"></i></button>
        </div>

        <div className="zq-rm-body" ref={bodyRef}>
          {step === 1 && (
            <div className="zq-rm-center">
              {productImage && <img className="zq-rm-product" src={productImage} alt="" width={132} height={132} />}
              <h3 className="zq-rm-title">How would you rate {productName}?</h3>
              <p className="zq-rm-sub">{shown ? RATING_WORDS[shown] : 'Tap a star to rate'}</p>
              <div className="zq-rm-stars" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" role="radio" aria-checked={rating === s} aria-label={`${s} star${s > 1 ? 's' : ''}`}
                    className={s <= shown ? 'is-on' : ''} onMouseEnter={() => setHover(s)} onClick={() => setRating(s)}>
                    <i className="ri-star-fill"></i>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="zq-rm-center">
              <h3 className="zq-rm-title">Add photos</h3>
              <p className="zq-rm-sub">Shoppers trust reviews with photos the most.</p>
              <div
                className={`zq-rm-drop ${drag ? 'is-drag' : ''}`}
                role="button" tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); void addFiles(e.dataTransfer.files); }}
              >
                <i className="ri-camera-line"></i>
                <strong>Add photos</strong>
                <span>Choose files or drag them here</span>
                <small>Up to {MAX_PHOTOS} photos · JPG, PNG or WebP</small>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { void addFiles(e.target.files); e.target.value = ''; }} />
              {photos.length > 0 && (
                <div className="zq-rm-thumbs">
                  {photos.map((p, i) => (
                    <div className="zq-rm-thumb" key={p.url}>
                      <img src={p.url} alt={`Photo ${i + 1}`} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(i)}><i className="ri-close-line"></i></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="zq-rm-title is-center">What stood out, good or bad?</h3>
              <p className="zq-rm-sub is-center"><i className="ri-lightbulb-line"></i> Helpful reviews mention fit, fabric, quality and value.</p>
              <label className="zq-rm-label" htmlFor="zq-rm-title">Review title</label>
              <input id="zq-rm-title" className="zq-rm-input" placeholder="Sum it up in a sentence" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              <label className="zq-rm-label" htmlFor="zq-rm-comment">Your review <span className="req">*</span></label>
              <textarea id="zq-rm-comment" className="zq-rm-input zq-rm-textarea" placeholder="What did you like? What could be better?" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="zq-rm-title is-center">A few quick questions</h3>
              <div className="zq-rm-q">
                <div className="zq-rm-label">Would you recommend this product? <span className="req">*</span></div>
                <div className="zq-rm-pills">
                  {pill('Yes', recommend === 'yes' ? 'Yes' : recommend === 'no' ? 'No' : '', () => setRecommend('yes'))}
                  {pill('No', recommend === 'yes' ? 'Yes' : recommend === 'no' ? 'No' : '', () => setRecommend('no'))}
                </div>
              </div>
              <div className="zq-rm-q">
                <div className="zq-rm-label">Age Group <span className="opt">Optional</span></div>
                <div className="zq-rm-pills">{AGE_GROUPS.map((a) => pill(a, age, setAge, true))}</div>
              </div>
              <div className="zq-rm-q">
                <div className="zq-rm-label">Gender <span className="opt">Optional</span></div>
                <div className="zq-rm-pills">{GENDERS.map((g) => pill(g, gender, setGender, true))}</div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h3 className="zq-rm-title is-center">Almost done</h3>
              <p className="zq-rm-sub is-center">Your name shows on your review. Your email stays private.</p>
              <label className="zq-rm-label" htmlFor="zq-rm-name">Name <span className="req">*</span></label>
              <input id="zq-rm-name" className="zq-rm-input" placeholder="Ali" maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!name} />
              <label className="zq-rm-label" htmlFor="zq-rm-email">Email <span className="req">*</span></label>
              <input id="zq-rm-email" type="email" className="zq-rm-input" placeholder="ali@example.com" maxLength={150} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="zq-rm-note">Email is private. Used to confirm your review.</p>
            </div>
          )}

          {step === 6 && (
            <div className="zq-rm-center zq-rm-done">
              <i className="ri-checkbox-circle-fill"></i>
              <h3 className="zq-rm-title">Thank you!</h3>
              <p className="zq-rm-sub">Your review has been submitted and will appear after approval.</p>
            </div>
          )}

          {error && <p className="zq-rm-error" role="alert">{error}</p>}
        </div>

        <div className="zq-rm-foot">{footer}</div>

        {confirmLeave && (
          <div className="zq-rm-confirm" role="alertdialog" aria-modal="true" aria-label="Leave without posting?">
            <div className="zq-rm-confirm-box">
              <h4>Leave without posting?</h4>
              <p>Your review isn&apos;t saved yet.</p>
              <button type="button" className="zq-rm-btn" onClick={() => setConfirmLeave(false)} autoFocus>Keep writing</button>
              <button type="button" className="zq-rm-btn is-ghost" onClick={leave}>Leave</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
