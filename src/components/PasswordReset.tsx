import { useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronRight, KeyRound, MailCheck } from 'lucide-react';
import { api, ApiError } from '../api';
import { useStore } from '../store';
import { FormField } from './FormField';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const { navigate } = useStore();
  return <div className="form-container fc-account fc-reset py-8">
    <nav className="fc-breadcrumb" aria-label="Breadcrumb"><button onClick={() => navigate({ name: 'account' })}>Sign in</button><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">{title}</span></nav>
    <div className="fc-reset-card surface">{children}</div>
  </div>;
}

/** Step 1: ask for the account email. The server emails a reset link. */
export function ForgotPasswordPage() {
  const { navigate } = useStore();
  const [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '').trim();
    setBusy(true); setError('');
    try { await api('/forgot-password', 'POST', { email }); setSent(true); }
    catch (err) { if (err instanceof ApiError && err.status === 422) setSent(true); else setError(err instanceof Error ? err.message : 'Could not send the request.'); }
    finally { setBusy(false); }
  }
  return <Shell title="Forgot password">
    {sent ? <><MailCheck size={40} aria-hidden="true"/><h1>Check your email</h1><p>If an account exists for that address, we have sent a link to reset your password. The link works for a limited time. Check your spam folder if you do not see it.</p><button className="button-primary mt-4" onClick={() => navigate({ name: 'account' })}>Back to sign in</button></>
    : <form onSubmit={e => void submit(e)} className="space-y-4"><KeyRound size={36} aria-hidden="true"/><h1>Forgot your password?</h1><p>Enter your account email and we will send you a reset link.</p><FormField name="email" label="Email address" type="email" required autoComplete="email"/>{error && <p role="alert" className="text-red-700">{error}</p>}<button className="button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button><button type="button" className="block text-green-700 underline" onClick={() => navigate({ name: 'account' })}>Back to sign in</button></form>}
  </Shell>;
}

/** Step 2: opened from the email link (/reset-password?token=…&email=…). */
export function ResetPasswordPage({ token, email }: { token: string; email: string }) {
  const { navigate } = useStore();
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') ?? ''), confirm = String(f.get('confirm') ?? '');
    const errors: Record<string, string> = {};
    if (password.length < 8) errors.password = 'Use at least 8 characters.';
    if (password !== confirm) errors.confirm = 'The two passwords do not match.';
    setFieldErrors(errors); setError('');
    if (Object.keys(errors).length) return;
    setBusy(true);
    try { await api('/reset-password', 'POST', { token, email, password, password_confirmation: confirm }); setDone(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not reset your password.'); if (err instanceof ApiError) setFieldErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k === 'password_confirmation' ? 'confirm' : k, v.join(' ')]))); }
    finally { setBusy(false); }
  }
  if (!token || !email) return <Shell title="Reset password"><h1>This link is not valid</h1><p>Request a new password reset link and open the newest email.</p><button className="button-primary mt-4" onClick={() => navigate({ name: 'forgot-password' })}>Request a new link</button></Shell>;
  return <Shell title="Reset password">
    {done ? <><CheckCircle2 size={40} aria-hidden="true"/><h1>Password updated</h1><p>You can now sign in with your new password.</p><button className="button-primary mt-4" onClick={() => navigate({ name: 'account' })}>Sign in</button></>
    : <form onSubmit={e => void submit(e)} className="space-y-4"><KeyRound size={36} aria-hidden="true"/><h1>Choose a new password</h1><p>For <strong>{email}</strong></p><FormField name="password" label="New password (8+ characters)" type="password" required minLength={8} maxLength={128} autoComplete="new-password" error={fieldErrors.password}/><FormField name="confirm" label="Confirm new password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" error={fieldErrors.confirm}/>{error && <p role="alert" className="text-red-700">{error}</p>}{error.toLowerCase().includes('token') && <button type="button" className="block text-green-700 underline" onClick={() => navigate({ name: 'forgot-password' })}>Request a new link</button>}<button className="button-primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button></form>}
  </Shell>;
}
