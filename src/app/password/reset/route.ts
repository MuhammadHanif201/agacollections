import { redirect } from '@/lib/admin/http';

// Route::redirect('password/reset', '/admin/forgot-password')
export const GET = () => redirect('/admin/forgot-password');
