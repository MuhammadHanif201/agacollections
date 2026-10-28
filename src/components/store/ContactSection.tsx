'use client';

import { useActionState, useEffect, useRef, type ReactNode } from 'react';
import { sendContact, type ContactState } from '@/actions/contact';
import { showResultAlert } from './FlashMessages';

const FIELDS = ['name', 'email', 'subject', 'message'] as const;

/** contact.blade.php: flash box, the contact grid and the message form */
export default function ContactSection({ info }: { info: ReactNode }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: 'idle', seq: 0 });
  const flashRef = useRef<HTMLDivElement>(null);
  const errors = state.status === 'invalid' ? state.errors ?? {} : {};
  const allErrors = FIELDS.flatMap((f) => errors[f] ?? []);
  const values = state.status === 'success' ? {} : state.values ?? {};

  // After a send: the layout's toast (success / error / validation) and scroll to the flash box
  useEffect(() => {
    if (state.seq === 0) return;
    if (state.status === 'success') void showResultAlert('success', state.message ?? '');
    else if (state.status === 'error') void showResultAlert('error', state.message ?? '');
    else if (state.status === 'invalid') void showResultAlert('errors', '', allErrors);
    setTimeout(() => flashRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.seq]);

  const err = (f: string) => errors[f]?.[0];

  return (
    <>
      {(state.status === 'success' || allErrors.length > 0) && (
        <div className="ct-flash" ref={flashRef}>
          <div className="container">
            {state.status === 'success' && (
              <div className="ct-flash-inner">
                <i className="ri-checkbox-circle-line ct-flash-icon"></i>
                <div>
                  <strong>Message Sent</strong><br />
                  <span style={{ color: '#555', fontSize: '0.85rem' }}>{state.message}</span>
                </div>
              </div>
            )}
            {allErrors.length > 0 && (
              <div className="ct-flash-inner ct-flash-error">
                <i className="ri-error-warning-line ct-flash-icon"></i>
                <div>
                  <strong>Please fix the following:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '0.84rem', color: '#555' }}>
                    {allErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="ct-body">
        <div className="container">
          <div className="ct-grid">
            {info}

            <div className="ct-form-panel">
              <div className="ct-form-label">Send a Message</div>
              <div className="ct-form-heading">How can we <em>help you?</em></div>
              <div className="ct-form-divider"></div>

              <form action={action} method="POST" noValidate key={state.seq}>
                <div className="ct-row-2 mb-4">
                  <div>
                    <label className="ct-label" htmlFor="ct_name">Your Name <span className="ct-req">*</span></label>
                    <input type="text" className={`ct-field ${err('name') ? 'is-invalid' : ''}`} name="name" id="ct_name" defaultValue={values.name ?? ''} placeholder="Sara Ahmed" required />
                    {err('name') && <div className="ct-invalid-msg">{err('name')}</div>}
                  </div>
                  <div>
                    <label className="ct-label" htmlFor="ct_email">Email Address <span className="ct-req">*</span></label>
                    <input type="email" className={`ct-field ${err('email') ? 'is-invalid' : ''}`} name="email" id="ct_email" defaultValue={values.email ?? ''} placeholder="you@example.com" required />
                    {err('email') && <div className="ct-invalid-msg">{err('email')}</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="ct-label" htmlFor="ct_subject">Subject <span className="ct-req">*</span></label>
                  <input type="text" className={`ct-field ${err('subject') ? 'is-invalid' : ''}`} name="subject" id="ct_subject" defaultValue={values.subject ?? ''} placeholder="Order inquiry, return, or custom request" />
                  {err('subject') && <div className="ct-invalid-msg">{err('subject')}</div>}
                </div>

                <div className="mb-5">
                  <label className="ct-label" htmlFor="ct_message">Message <span className="ct-req">*</span></label>
                  <textarea className={`ct-field ${err('message') ? 'is-invalid' : ''}`} name="message" id="ct_message" rows={6} placeholder="Write your message here..." required defaultValue={values.message ?? ''}></textarea>
                  {err('message') && <div className="ct-invalid-msg">{err('message')}</div>}
                </div>

                <button type="submit" className="ct-submit" id="ct-submit-btn" disabled={pending}>
                  <span className={`spinner-border spinner-border-sm ${pending ? '' : 'd-none'}`} id="ct-spinner" role="status" aria-hidden="true"></span>
                  <i className={`ri-send-plane-line ${pending ? 'd-none' : ''}`} id="ct-send-icon"></i>
                  {' '}<span id="ct-btn-text">{pending ? 'Sending…' : 'Send Message'}</span>
                </button>
                <p className="ct-submit-note">
                  <i className="ri-lock-line"></i> Your information is kept private and never shared.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
