import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Affiliate } from '@/models/Affiliate';
import { rejectAffiliate } from '@/services/admin/affiliates';

/** AdminAffiliateController::reject */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;
    const a = Number.isInteger(id) ? await Affiliate.findById(id).lean() : null;
    if (!a) return notFound(req);
    await rejectAffiliate(id, str(input, 'admin_note'));
    return back(req, { success: 'Affiliate rejected.' });
  },
});
