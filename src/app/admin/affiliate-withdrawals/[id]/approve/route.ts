import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { approveWithdrawal } from '@/services/admin/affiliates';

/** AdminAffiliateController::approveWithdrawal */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;

    const r = Number.isInteger(id) ? await approveWithdrawal(id) : null;
    return r ? back(req, r) : notFound(req);
  },
});
