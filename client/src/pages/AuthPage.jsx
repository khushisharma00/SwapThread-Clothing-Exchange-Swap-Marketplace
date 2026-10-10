import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { ErrorAlert, Field, Logo } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(mode, f) {
  const e = {};
  if (mode === 'register') {
    if (!f.name.trim() || f.name.trim().length < 2) e.name = 'Enter your name (at least 2 characters)';
    if (!f.city) e.city = 'Choose your city so we can show nearby swaps';
  }
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (mode === 'register') {
    if (f.password.length < 8) e.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Include at least one letter and one number';
    if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
  } else if (!f.password) {
    e.password = 'Enter your password';
  }
  return e;
}

export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const { cities } = useMeta();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';
  const redirectTo = location.state?.from || '/dashboard';

  if (user) return <Navigate to={redirectTo} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const v = validate(mode, form);
    setErrors(v);
    setServerError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      if (isRegister) {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, city: form.city });
        notify('Welcome to ReWear! List your first item to start swapping.');
        navigate('/dashboard/listings/new', { replace: true });
      } else {
        await login(form.email.trim(), form.password);
        notify('Welcome back!');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setBusy(false);
    }
  }

  const inv = (k) => (errors[k] ? 'is-invalid' : '');

  return (
    <div className="rw-auth">
      <div className="rw-auth-card">
        <div className="text-center mb-4">
          <Logo />
          <h1 className="h3 mt-3 mb-1">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-muted mb-0">{isRegister ? 'Join the community swapping clothes instead of buying new.' : 'Log in to manage your swaps.'}</p>
        </div>
        <div className="rw-tabs mb-4" role="tablist">
          <Link to="/login" className={`rw-tab ${!isRegister ? 'active' : ''}`} role="tab" aria-selected={!isRegister}>Log in</Link>
          <Link to="/register" className={`rw-tab ${isRegister ? 'active' : ''}`} role="tab" aria-selected={isRegister}>Register</Link>
        </div>
        <ErrorAlert error={serverError} />
        <form onSubmit={submit} noValidate>
          {isRegister && (
            <Field id="name" label="Full name" error={errors.name}>
              <input id="name" className={`form-control ${inv('name')}`} value={form.name} onChange={set('name')} autoComplete="name" maxLength={60} aria-invalid={!!errors.name} />
            </Field>
          )}
          <Field id="email" label="Email" error={errors.email}>
            <input id="email" type="email" className={`form-control ${inv('email')}`} value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
          </Field>
          {isRegister && (
            <Field id="city" label="City" error={errors.city} hint="Only your city is shown publicly — never your address.">
              <select id="city" className={`form-select ${inv('city')}`} value={form.city} onChange={set('city')} aria-invalid={!!errors.city}>
                <option value="">Select your city</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}, {c.state}</option>
                ))}
              </select>
            </Field>
          )}
          <Field id="password" label="Password" error={errors.password} hint={isRegister ? 'At least 8 characters with a letter and a number.' : undefined}>
            <input id="password" type="password" className={`form-control ${inv('password')}`} value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} aria-invalid={!!errors.password} />
          </Field>
          {isRegister && (
            <Field id="confirm" label="Confirm password" error={errors.confirm}>
              <input id="confirm" type="password" className={`form-control ${inv('confirm')}`} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" aria-invalid={!!errors.confirm} />
            </Field>
          )}
          <button type="submit" className="btn btn-success w-100 btn-lg mt-2" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="text-center small text-muted mt-3 mb-0">
          {isRegister ? 'Already a member? ' : 'New to ReWear? '}
          <Link to={isRegister ? '/login' : '/register'} className="rw-link">{isRegister ? 'Log in' : 'Create an account'}</Link>
        </p>
      </div>
    </div>
  );
}
