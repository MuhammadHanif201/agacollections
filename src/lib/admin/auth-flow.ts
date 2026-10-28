import 'server-only';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { verifyPassword } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendMail } from '@/lib/mail';
import { throttle } from '@/lib/request';
import { adminPasswordResetHtml, adminPasswordResetText } from '@/emails/templates';
import { CI } from '@/models/Customer';
import { AdminPasswordResetToken, User } from '@/models/User';
import { getCurrentAdmin, loginAdmin, logoutAdmin } from './auth';
import { str, bool, type FormInput } from './form';
import { back, flash, pullIntended, putErrors, redirect, tooMany, validationFailed } from './http';
import { renderAuth } from './layout';
import { validate } from './validate';
import loginView from '@/admin-views/auth/login';
import forgotView from '@/admin-views/auth/forgot-password';
import resetView from '@/admin-views/auth/reset-password';

const AUTH_SECTIONS = { bodyClass: 'zq-auth-body', mainClass: 'min-vh-100 d-flex' };
const RESET_MINUTES = 60;

/** PHP's FILTER_VALIDATE_EMAIL, close enough for telling an email from a username */
const looksLikeEmail = (v: string) =>
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/.test(v) && !v.includes('..');

export const showLogin = (req: Request, routeName: string) => renderAuth(req, routeName, loginView, { title: 'Admin Login', ...AUTH_SECTIONS });
export const showForgot = (req: Request) => renderAuth(req, 'admin.password.request', forgotView, { title: 'Forgot Password', ...AUTH_SECTIONS });
export const showReset = (req: Request, token: string) =>
  renderAuth(req, 'admin.password.reset', resetView, { title: 'Reset Password', ...AUTH_SECTIONS }, { token, email: new URL(req.url).searchParams.get('email') ?? '' });

/** AdminAuthController::login */
export async function adminLogin(req: Request, input: FormInput) {
  if (!(await throttle('admin-login', 5))) return tooMany(req);
  const errors = await validate(input, { login: 'required|string', password: 'required|string' }, {
    messages: { 'login.required': 'Please enter your email or username.', 'password.required': 'Please enter your password.' },
  });
  if (Object.keys(errors).length) return validationFailed(req, errors, input);

  const login = (str(input, 'login') ?? '').trim();
  const field = looksLikeEmail(login) ? 'email' : 'username';
  // MySQL compared these case-insensitively (utf8mb4_unicode_ci)
  const user = await User.findOne({ [field]: login }).collation(CI).lean();
  if (!user || !(await verifyPassword(str(input, 'password') ?? '', user.password))) {
    await putErrors({ login: ['Incorrect email/username or password.'] }, { login: str(input, 'login') });
    return back(req);
  }
  await loginAdmin(user._id, bool(input, 'remember'));
  // forceFill(['last_login_at' => now()])->saveQuietly(): no audit row, timestamps still touched
  const now = new Date();
  await User.updateOne({ _id: user._id }, { $set: { last_login_at: now, updated_at: now } });
  return redirect(await pullIntended('/admin/home'));
}

/** Auth\LoginController (Auth::routes): the default email + password login */
export async function defaultLogin(req: Request, input: FormInput) {
  if (await getCurrentAdmin()) return redirect('/home');
  if (!(await throttle('login', 5))) {
    await putErrors({ email: ['Too many login attempts. Please try again in 60 seconds.'] }, { email: str(input, 'email') });
    return back(req);
  }
  const errors = await validate(input, { email: 'required|string', password: 'required|string' });
  if (Object.keys(errors).length) return validationFailed(req, errors, input);
  const user = await User.findOne({ email: str(input, 'email') }).collation(CI).lean();
  if (!user || !(await verifyPassword(str(input, 'password') ?? '', user.password))) {
    await putErrors({ email: ['These credentials do not match our records.'] }, { email: str(input, 'email'), remember: str(input, 'remember') });
    return back(req);
  }
  await loginAdmin(user._id, bool(input, 'remember'));
  return redirect(await pullIntended('/home'));
}

export async function adminLogout(to: string) {
  const admin = await getCurrentAdmin();
  await logoutAdmin(admin?._id ?? null);
  return redirect(to);
}

/** AdminAuthController::sendResetLink (Password::broker()->sendResetLink) */
export async function sendResetLink(req: Request, input: FormInput) {
  if (!(await throttle('admin-forgot', 3))) return tooMany(req);
  const errors = await validate(input, { email: 'required|email' }, {
    messages: { 'email.required': 'Please enter your email address.', 'email.email': 'Please enter a valid email address.' },
  });
  if (Object.keys(errors).length) return validationFailed(req, errors, input);

  const user = await User.findOne({ email: str(input, 'email') }).collation(CI).lean();
  let sent = false;
  if (user) {
    const existing = await AdminPasswordResetToken.findById(user.email).lean();
    // The broker's throttle: one link per 60 seconds
    if (!existing || Date.now() - existing.created_at.getTime() >= 60_000) {
      const token = randomBytes(32).toString('hex');
      await AdminPasswordResetToken.updateOne({ _id: user.email }, { $set: { token: await bcrypt.hash(token, 12), created_at: new Date() } }, { upsert: true });
      const origin = new URL(req.url).origin;
      const resetUrl = `${env.appUrl || origin}/admin/reset-password/${token}?email=${encodeURIComponent(user.email)}`;
      await sendMail({
        to: user.email,
        subject: 'Reset Password Notification',
        html: adminPasswordResetHtml(env.appName, env.appUrl || origin, resetUrl),
        text: adminPasswordResetText(env.appName, resetUrl),
      });
      sent = true;
    }
  }
  return back(req, { success: sent ? 'Password reset link sent! Check your inbox.' : 'If that email is registered, a reset link has been sent.' });
}

/** AdminAuthController::resetPassword (Password::broker()->reset) */
export async function resetPassword(req: Request, input: FormInput) {
  const errors = await validate(input, {
    token: 'required',
    email: 'required|email',
    password: 'required|min:8|confirmed',
    password_confirmation: 'required',
  }, { messages: { 'password.min': 'Password must be at least 8 characters.', 'password.confirmed': 'Passwords do not match.' } });
  if (Object.keys(errors).length) return validationFailed(req, errors, input);

  const email = str(input, 'email') ?? '';
  const user = await User.findOne({ email }).collation(CI).lean();
  const fail = async (message: string) => {
    await putErrors({ email: [message] }, { email });
    return back(req);
  };
  if (!user) return fail("We can't find a user with that email address.");
  const row = await AdminPasswordResetToken.findById(user.email).lean();
  const valid = row && Date.now() - row.created_at.getTime() < RESET_MINUTES * 60_000 && (await bcrypt.compare(str(input, 'token') ?? '', row.token));
  if (!valid) return fail('This password reset token is invalid.');

  await User.updateOne({ _id: user._id }, {
    $set: { password: await bcrypt.hash(str(input, 'password') ?? '', 12), remember_token: randomBytes(30).toString('base64url'), updated_at: new Date() },
  });
  await AdminPasswordResetToken.deleteOne({ _id: user.email });
  await flash({ success: 'Password reset successfully. Please sign in.' });
  return redirect('/admin/login');
}
