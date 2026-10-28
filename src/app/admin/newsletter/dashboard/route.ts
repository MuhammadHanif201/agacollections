import { adminPage, redirect } from '@/lib/admin/http';

export const GET = adminPage(async () => redirect('/admin/newsletter/subscribers'));
