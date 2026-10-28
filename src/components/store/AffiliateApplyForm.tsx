'use client';

import { useState } from 'react';

/** The application form; the bank name row shows only for bank transfers */
export default function AffiliateApplyForm({ values, errors }: { values: Record<string, string>; errors: string[] }) {
  const [method, setMethod] = useState(values.payment_method || 'jazzcash');
  return (
    <form method="POST" action="/affiliate/apply/submit">
      <div className="aff-row">
        <div className="aff-field">
          <label>Full Name <span className="req">*</span></label>
          <input type="text" name="full_name" defaultValue={values.full_name} required maxLength={120} />
        </div>
        <div className="aff-field">
          <label>Phone <span className="req">*</span></label>
          <input type="tel" name="phone" defaultValue={values.phone} required maxLength={30} />
        </div>
      </div>

      <div className="aff-field">
        <label>Email</label>
        <input type="email" name="email" defaultValue={values.email} maxLength={160} />
      </div>

      <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--dc-border)' }} />

      <div className="aff-field">
        <label>Payout Method <span className="req">*</span></label>
        <select name="payment_method" id="payment_method" required value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="jazzcash">JazzCash</option>
          <option value="easypaisa">EasyPaisa</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      <div className="aff-row">
        <div className="aff-field">
          <label>Account Number / Mobile <span className="req">*</span></label>
          <input type="text" name="payment_account_number" defaultValue={values.payment_account_number} required maxLength={60} />
        </div>
        <div className="aff-field">
          <label>Account Holder Name <span className="req">*</span></label>
          <input type="text" name="payment_account_name" defaultValue={values.payment_account_name} required maxLength={120} />
        </div>
      </div>

      <div className={`aff-row bank-row${method === 'bank' ? ' is-visible' : ''}`} id="bankRow">
        <div className="aff-field" style={{ gridColumn: '1 / -1' }}>
          <label>Bank Name</label>
          <input type="text" name="bank_name" defaultValue={values.bank_name} maxLength={120} placeholder="e.g. HBL, Meezan, UBL" />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="aff-flash aff-flash-error">
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <button type="submit" className="aff-submit">Submit Application</button>
    </form>
  );
}
