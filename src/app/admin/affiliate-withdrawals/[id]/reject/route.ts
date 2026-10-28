import { str } from '@/lib/admin/form';
import { adminAction, back, notFound, validationFailed } from '@/lib/admin/http';
import { validate } from '@/lib/admin/validate';
import { rejectWithdrawal } from '@/services/admin/affiliates';

/** AdminAffiliateController::rejectWithdrawal */
export const POST = adminAction({
  POST: async ({ req, input, params }) => {
    const id = Number(params.id);
    void str; void validate; void validationFailed; void input;

    const r = Number.isInteger(id) ? await rejectWithdrawal(id, str(input, 'admin_note')) : null;
    return r ? back(req, r) : notFound(req);
  },
});
