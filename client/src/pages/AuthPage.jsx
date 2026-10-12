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

function getPasswordStrength(pass) {
  if (!pass) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-danger' };
  if (score === 2) return { score: 50, label: 'Fair', color: 'bg-warning' };
  if (score === 3) return { score: 75, label: 'Good', color: 'bg-info' };
  return { score: 100, label: 'Strong', color: 'bg-success' };
}

export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const { cities } = useMeta();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', city: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const redirectTo = location.state?.from || '/dashboard';

  if (user) return <Navigate to={redirectTo} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = isRegister ? getPasswordStrength(form.password) : null;

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
    <div className="container py-4 py-lg-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-9">
          <div className="card border-0 shadow-lg overflow-hidden rounded-4">
            <div className="row g-0">
              {/* Left Form Panel */}
              <div className="col-12 col-md-7 col-lg-6 p-4 p-sm-5 bg-white">
                <div className="mb-4">
                  <Logo />
                  <h1 className="h3 fw-bold mt-3 mb-1">
                    {isRegister ? 'Join the movement' : 'Welcome back'}
                  </h1>
                  <p className="text-muted small mb-0">
                    {isRegister
                      ? 'Trade pre-owned clothing with eco-conscious members.'
                      : 'Sign in to access your wardrobe, chats, and swaps.'}
                  </p>
                </div>

                <div className="rw-tabs mb-4" role="tablist">
                  <Link
                    to="/login"
                    className={`rw-tab ${!isRegister ? 'active' : ''}`}
                    role="tab"
                    aria-selected={!isRegister}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className={`rw-tab ${isRegister ? 'active' : ''}`}
                    role="tab"
                    aria-selected={isRegister}
                  >
                    Register
                  </Link>
                </div>

                <ErrorAlert error={serverError} />

                <form onSubmit={submit} noValidate>
                  {isRegister && (
                    <Field id="name" label="Full name" error={errors.name} required>
                      <input
                        id="name"
                        className={`form-control ${inv('name')}`}
                        placeholder="e.g. Ananya Sharma"
                        value={form.name}
                        onChange={set('name')}
                        autoComplete="name"
                        maxLength={60}
                        aria-invalid={!!errors.name}
                      />
                    </Field>
                  )}

                  <Field id="email" label="Email address" error={errors.email} required>
                    <input
                      id="email"
                      type="email"
                      className={`form-control ${inv('email')}`}
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set('email')}
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                    />
                  </Field>

                  {isRegister && (
                    <Field
                      id="city"
                      label="Your city"
                      error={errors.city}
                      required
                      hint="Only your city is shown publicly — your address is never shared."
                    >
                      <select
                        id="city"
                        className={`form-select ${inv('city')}`}
                        value={form.city}
                        onChange={set('city')}
                        aria-invalid={!!errors.city}
                      >
                        <option value="">Select your city in India</option>
                        {cities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}, {c.state}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field id="password" label="Password" error={errors.password} required>
                    <div className="input-group">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${inv('password')}`}
                        placeholder={isRegister ? '8+ chars (letters & numbers)' : 'Enter password'}
                        value={form.password}
                        onChange={set('password')}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex="-1"
                      >
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isRegister && form.password && (
                      <div className="mt-2">
                        <div className="progress" style={{ height: 4 }}>
                          <div
                            className={`progress-bar ${strength.color}`}
                            role="progressbar"
                            style={{ width: `${strength.score}%` }}
                          />
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Strength: {strength.label}</small>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Min 8 chars, letter & number</small>
                        </div>
                      </div>
                    )}
                  </Field>

                  {isRegister && (
                    <Field id="confirm" label="Confirm password" error={errors.confirm} required>
                      <input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${inv('confirm')}`}
                        placeholder="Repeat your password"
                        value={form.confirm}
                        onChange={set('confirm')}
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirm}
                      />
                    </Field>
                  )}

                  <button type="submit" className="btn btn-success w-100 btn-lg mt-3" disabled={busy}>
                    {busy ? 'Please wait…' : isRegister ? 'Create free account' : 'Log in to ReWear'}
                  </button>
                </form>

                <p className="text-center small text-muted mt-4 mb-0">
                  {isRegister ? 'Already registered? ' : 'New to ReWear? '}
                  <Link to={isRegister ? '/login' : '/register'} className="rw-link fw-semibold">
                    {isRegister ? 'Sign in here' : 'Create an account'}
                  </Link>
                </p>
              </div>

              {/* Right Desktop Illustration Panel */}
              <div className="d-none d-md-flex col-md-5 col-lg-6 bg-success-subtle p-5 flex-column justify-content-between position-relative" style={{ background: 'linear-gradient(145deg, #e3eee6 0%, #d4e5d8 100%)' }}>
                <div>
                  <span className="badge bg-success text-white mb-3 px-3 py-2 fw-semibold">Sustainable Fashion</span>
                  <h2 className="display-6 fw-bold text-success-emphasis mb-3">
                    Every garment has another chapter.
                  </h2>
                  <p className="text-success-emphasis opacity-85 fs-6 rw-reading-width">
                    ReWear is a direct clothing exchange designed to eradicate textile waste. No virtual currencies, no hidden fees, no payments. Just wardrobes in circulation.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-4 shadow-sm border border-success-subtle mt-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 bg-success-subtle rounded-circle fs-3" aria-hidden="true">🌱</div>
                    <div>
                      <strong className="d-block text-dark">Zero-payment guarantee</strong>
                      <small className="text-muted">Pure item-for-item swapping powered by transparent value estimates.</small>
                    </div>
                  </div>
                </div>

                <div className="small text-success-emphasis opacity-75 mt-4">
                  Over 35+ verified clothing pieces ready to swap today.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
