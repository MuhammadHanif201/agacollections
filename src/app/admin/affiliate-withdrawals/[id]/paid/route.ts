import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { AffiliateWithdrawal } from '@/models/Affiliate';
import { payWithdrawal } from '@/services/admin/affiliates';

/** AdminAffiliateController::markWithdrawalPaid */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;

    const w = Number.isInteger(id) ? await AffiliateWithdrawal.findById(id).lean() : null;
    if (!w) return notFound(req);
    if (!['requested', 'approved'].includes(w.status)) return back(req, { error: 'This withdrawal is already finalised.' });
    const errors = await validate(input, { transaction_ref: 'nullable|string|max:120' });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    return back(req, (await payWithdrawal(id, str(input, 'transaction_ref')))!);
  },
});
