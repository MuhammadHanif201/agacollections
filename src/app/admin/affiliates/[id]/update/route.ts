import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Affiliate } from '@/models/Affiliate';
import { updateAffiliate } from '@/services/admin/affiliates';

/** AdminAffiliateController::update */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;
    const a = Number.isInteger(id) ? await Affiliate.findById(id).lean() : null;
    if (!a) return notFound(req);
    const errors = await validate(input, { commission_rate: 'nullable|numeric|min:0|max:100', admin_note: 'nullable|string|max:2000' });
    if (Object.keys(errors).length) return validationFailed(req, errors, input);
    const data: Record<string, unknown> = {};
    if ('commission_rate' in input) data.commission_rate = str(input, 'commission_rate') === null ? null : Number(str(input, 'commission_rate'));
    if ('admin_note' in input) data.admin_note = str(input, 'admin_note');
    await updateAffiliate(id, data);
    return back(req, { success: 'Affiliate updated.' });
  },
});
