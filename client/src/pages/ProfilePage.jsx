import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';
import ValueComparison from '../components/ValueComparison';
import { Avatar, EmptyState, ErrorAlert, Field, SkeletonGrid } from '../components/ui';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { cities } = useMeta();
  const notify = useToast();
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio || '',
    phone: user.phone || '',
    city: user.location.city || '',
    area: user.location.area || '',
    showArea: !!user.location.showArea,
    preferredSizes: (user.preferredSizes || []).join(', '),
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Name must be at least 2 characters';
    if (form.phone && !/^[+\d\s()-]{0,20}$/.test(form.phone)) v.phone = 'Use digits, spaces, +, - and brackets only';
    if (form.bio.length > 300) v.bio = 'Bio must be 300 characters or fewer';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (!payload.city) delete payload.city;
      const res = await api.patch('/users/me', payload);
      setUser(res.user);
      notify('Profile saved.');
    } catch (err) {
      setError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="rw-panel">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h5 mb-0">Edit Profile Details</h2>
        <span className="badge bg-light text-muted border">Personal</span>
      </div>
      <ErrorAlert error={error} />
      <Field id="p-name" label="Name" error={errors.name}>
        <input id="p-name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} maxLength={60} onChange={set('name')} />
      </Field>
      <Field id="p-bio" label="Bio" error={errors.bio} hint="Your style, sizes you look for, how you like to swap.">
        <textarea id="p-bio" className="form-control" rows={3} maxLength={300} value={form.bio} onChange={set('bio')} placeholder="Tell the community about your wardrobe style and what trades you love..." />
      </Field>
      <div className="row g-2">
        <div className="col-sm-6">
          <Field id="p-city" label="City" error={errors.city} hint="Shown publicly. Used for nearby matching.">
            <select id="p-city" className="form-select" value={form.city} onChange={set('city')}>
              <option value="">Select…</option>
              {cities.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
            </select>
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="p-area" label="Neighbourhood (optional)" error={errors.area}>
            <input id="p-area" className="form-control" maxLength={60} value={form.area} onChange={set('area')} placeholder="e.g. Indiranagar" />
          </Field>
        </div>
      </div>
      <div className="form-check mb-3">
        <input id="p-showarea" type="checkbox" className="form-check-input" checked={form.showArea} onChange={set('showArea')} />
        <label htmlFor="p-showarea" className="form-check-label small">Show my neighbourhood on my public profile</label>
      </div>
      <div className="row g-2">
        <div className="col-sm-6">
          <Field id="p-phone" label="Phone (private)" error={errors.phone} hint="Never shown to other members.">
            <input id="p-phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} maxLength={20} value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="p-sizes" label="Sizes I look for" hint="Comma separated, e.g. M, 32, UK 8">
            <input id="p-sizes" className="form-control" maxLength={100} value={form.preferredSizes} onChange={set('preferredSizes')} placeholder="M, L, 32" />
          </Field>
        </div>
      </div>
      <button type="submit" className="btn btn-success w-100 mt-2" disabled={busy}>
        {busy ? (
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        ) : null}
        {busy ? 'Saving changes…' : 'Save profile'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const notify = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
      setError('New password needs 8+ characters with a letter and a number.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.patch('/users/me/password', form);
      setForm({ currentPassword: '', newPassword: '' });
      notify('Password updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rw-panel mt-4" noValidate>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h6 mb-0">Change Password</h2>
        <span className="badge bg-light text-muted border">Security</span>
      </div>
      <ErrorAlert error={error} />
      <div className="row g-2">
        <div className="col-sm-6">
          <label htmlFor="cur-pw" className="form-label small fw-semibold">Current password</label>
          <input id="cur-pw" type="password" className="form-control" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div className="col-sm-6">
          <label htmlFor="new-pw" className="form-label small fw-semibold">New password</label>
          <input id="new-pw" type="password" className="form-control" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn btn-outline-dark btn-sm mt-3 w-100" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

const RADIUS_OPTIONS = [
  { value: '25', label: '25 km' },
  { value: '50', label: '50 km' },
  { value: '150', label: '150 km' },
  { value: '500', label: '500 km' },
  { value: '2500', label: 'Nationwide' },
];

function Nearby() {
  const { user } = useAuth();
  const [radius, setRadius] = useState('50');
  const { data, loading, error, reload } = useAsync(
    () => (user.location.city ? api.get('/listings/nearby', { radiusKm: radius }) : Promise.resolve(null)),
    [radius, user.location.city]
  );

  if (!user.location.city) {
    return (
      <div className="rw-panel">
        <EmptyState icon="📍" title="Set your city to see nearby swaps">
          Choose your city in the profile form on the left — we only use city-level location to find swaps.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="rw-panel">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
          <div>
            <h2 className="rw-section-title mb-1">Swaps near {user.location.city}</h2>
            <p className="small text-muted mb-0">{data?.note || 'Distances are approximate (between city centres).'}</p>
          </div>
          {/* Segmented radius buttons */}
          <div className="w-100 w-sm-auto" style={{ maxWidth: '100%', minWidth: 0 }}>
            <div className="rw-segmented" role="radiogroup" aria-label="Search radius">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={radius === opt.value}
                  className={`rw-segmented-btn ${radius === opt.value ? 'active' : ''}`}
                  onClick={() => setRadius(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rw-privacy-note mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <strong>Private & Secure:</strong> Exact addresses and contact info are never revealed. Exchanges are arranged via chat once both parties agree.
          </div>
        </div>

        <ErrorAlert error={error} onRetry={reload} />

        {loading ? (
          <SkeletonGrid count={4} columns="col-6 col-md-6" />
        ) : data ? (
          <>
            {/* Suggested Fair Swaps */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="h6 mb-0 fw-bold">Suggested Fair Swaps</h3>
                <span className="small text-muted">{data.suggestions.length} matched</span>
              </div>
              {data.suggestions.length === 0 ? (
                <div className="p-3 bg-light rounded text-center small text-muted">
                  No fair-value matches nearby yet. <Link to="/dashboard/listings/new" className="rw-link fw-semibold">List more items</Link> or widen the radius.
                </div>
              ) : (
                <div className="row g-3">
                  {data.suggestions.map((s) => (
                    <div className="col-md-6" key={s.theirItem.id}>
                      <div className="rw-suggestion">
                        <div className="small text-muted mb-1">
                          Your <span className="fw-semibold text-dark">{s.yourItem.title}</span> for:
                        </div>
                        <Link to={`/listings/${s.theirItem.id}`} className="fw-bold rw-link text-truncate mb-1">
                          {s.theirItem.title}
                        </Link>
                        <div className="small text-muted mb-2">
                          {s.theirItem.owner?.name} · {s.theirItem.location.city} · {s.theirItem.distanceLabel}
                        </div>
                        <div className="mt-auto pt-2 border-top">
                          <ValueComparison
                            compact
                            offeredValue={s.yourItem.estimatedValue}
                            requestedValue={s.theirItem.estimatedValue}
                            offeredLabel="Yours"
                            requestedLabel="Theirs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Members Swapping Nearby (Horizontally scrollable avatar chips) */}
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="h6 mb-0 fw-bold">Members Swapping Nearby</h3>
                <span className="small text-muted">{data.members.length} members</span>
              </div>
              {data.members.length === 0 ? (
                <p className="small text-muted mb-0">No other members within this radius yet.</p>
              ) : (
                <div className="rw-member-scroller pt-1">
                  {data.members.map((m) => (
                    <Link key={m.member.id} to={`/users/${m.member.id}`} className="rw-member" title={m.member.name}>
                      <Avatar user={m.member} size={32} />
                      <div className="text-start">
                        <span className="d-block fw-semibold text-truncate" style={{ maxWidth: '120px' }}>{m.member.name}</span>
                        <small className="d-block text-muted" style={{ fontSize: '0.72rem' }}>
                          {m.member.location.city} · {m.itemCount} item{m.itemCount === 1 ? '' : 's'}
                        </small>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* All Nearby Items */}
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="h6 mb-0 fw-bold">
                  {data.totalNearby} item{data.totalNearby === 1 ? '' : 's'} within {data.center.radiusKm} km
                </h3>
              </div>
              {data.items.length === 0 ? (
                <EmptyState icon="🧭" title="Nothing nearby yet">
                  Try widening the radius above or <Link to="/listings" className="rw-link">browse the entire marketplace</Link>.
                </EmptyState>
              ) : (
                <div className="row g-3">
                  {data.items.map((l) => (
                    <div className="col-6 col-sm-6" key={l.id}>
                      <ListingCard listing={l} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="container py-4">
      {/* Profile Header Card */}
      <div className="rw-profile-head mb-4">
        <Avatar user={user} size={72} />
        <div className="flex-grow-1">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <h1 className="rw-page-title mb-0">{user.name}</h1>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              Verified Member
            </span>
          </div>
          <div className="text-muted small">
            📍 {[user.location.area, user.location.city].filter(Boolean).join(', ') || 'City not set'}
            {user.location.state ? `, ${user.location.state}` : ''}
          </div>
          {user.bio ? <p className="small text-muted mt-2 mb-0">{user.bio}</p> : null}
        </div>
        <div className="d-flex flex-column align-items-sm-end gap-2">
          <Link to={`/users/${user.id}`} className="btn btn-outline-dark btn-sm">
            View Public Profile →
          </Link>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <ProfileForm />
          <PasswordForm />
        </div>
        <div className="col-lg-7">
          <Nearby />
        </div>
      </div>
    </div>
  );
}
