import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { Affiliate } from '@/models/Affiliate';
import { approveAffiliate } from '@/services/admin/affiliates';

/** AdminAffiliateController::approve */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;
    const a = Number.isInteger(id) ? await Affiliate.findById(id).lean() : null;
    if (!a) return notFound(req);
    return back(req, await approveAffiliate(a));
  },
});
