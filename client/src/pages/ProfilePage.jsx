import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';
import ValueComparison from '../components/ValueComparison';
import { Avatar, EmptyState, ErrorAlert, Field, Loader } from '../components/ui';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { cities } = useMeta();
  const notify = useToast();
  const [form, setForm] = useState({
    name: user.name, bio: user.bio || '', phone: user.phone || '', city: user.location.city || '', area: user.location.area || '',
    showArea: !!user.location.showArea, preferredSizes: (user.preferredSizes || []).join(', '),
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
      <h2 className="h5 mb-3">Your profile</h2>
      <ErrorAlert error={error} />
      <Field id="p-name" label="Name" error={errors.name}>
        <input id="p-name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={form.name} maxLength={60} onChange={set('name')} />
      </Field>
      <Field id="p-bio" label="Bio" error={errors.bio} hint="Your style, sizes you look for, how you like to swap.">
        <textarea id="p-bio" className="form-control" rows={3} maxLength={300} value={form.bio} onChange={set('bio')} />
      </Field>
      <div className="row">
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
        <label htmlFor="p-showarea" className="form-check-label">Show my neighbourhood on my public profile</label>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <Field id="p-phone" label="Phone (private)" error={errors.phone} hint="Never shown to other members.">
            <input id="p-phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} maxLength={20} value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <div className="col-sm-6">
          <Field id="p-sizes" label="Sizes I look for" hint="Comma separated, e.g. M, 32, UK 8">
            <input id="p-sizes" className="form-control" maxLength={100} value={form.preferredSizes} onChange={set('preferredSizes')} />
          </Field>
        </div>
      </div>
      <button type="submit" className="btn btn-success" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
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
      <h2 className="h6 mb-3">Change password</h2>
      <ErrorAlert error={error} />
      <div className="row g-2">
        <div className="col-sm-6">
          <label htmlFor="cur-pw" className="form-label small">Current password</label>
          <input id="cur-pw" type="password" className="form-control" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div className="col-sm-6">
          <label htmlFor="new-pw" className="form-label small">New password</label>
          <input id="new-pw" type="password" className="form-control" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn btn-outline-dark btn-sm mt-3" disabled={busy}>Update password</button>
    </form>
  );
}

function Nearby() {
  const { user } = useAuth();
  const [radius, setRadius] = useState('50');
  const { data, loading, error, reload } = useAsync(
    () => (user.location.city ? api.get('/listings/nearby', { radiusKm: radius }) : Promise.resolve(null)),
    [radius, user.location.city]
  );

  if (!user.location.city) {
    return <EmptyState icon="📍" title="Set your city to see nearby swaps">Choose your city in the profile form — we only use city-level location.</EmptyState>;
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <div>
          <h2 className="rw-section-title mb-0">Swaps near {user.location.city}</h2>
          <p className="small text-muted mb-0">{data?.note || 'Distances are approximate (between city centres).'}</p>
        </div>
        <div>
          <label htmlFor="radius" className="form-label small mb-1">Radius</label>
          <select id="radius" className="form-select form-select-sm" value={radius} onChange={(e) => setRadius(e.target.value)}>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="150">150 km</option>
            <option value="500">500 km</option>
            <option value="2500">Whole country</option>
          </select>
        </div>
      </div>
      {loading && <Loader label="Finding nearby swaps…" />}
      <ErrorAlert error={error} onRetry={reload} />
      {data && (
        <>
          <h3 className="h6 mt-3">Suggested fair swaps</h3>
          {data.suggestions.length === 0 ? (
            <p className="small text-muted">No fair-value matches nearby yet. <Link to="/dashboard/listings/new" className="rw-link">List more items</Link> or widen the radius.</p>
          ) : (
            <div className="row g-3 mb-4">
              {data.suggestions.map((s) => (
                <div className="col-md-6" key={s.theirItem.id}>
                  <div className="rw-suggestion">
                    <div className="small text-muted mb-1">Your <strong>{s.yourItem.title}</strong> for</div>
                    <Link to={`/listings/${s.theirItem.id}`} className="fw-semibold rw-link">{s.theirItem.title}</Link>
                    <div className="small text-muted mb-2">{s.theirItem.owner?.name} · {s.theirItem.location.city} · {s.theirItem.distanceLabel}</div>
                    <ValueComparison compact offeredValue={s.yourItem.estimatedValue} requestedValue={s.theirItem.estimatedValue} offeredLabel="Yours" requestedLabel="Theirs" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="h6">Members swapping nearby</h3>
          {data.members.length === 0 ? (
            <p className="small text-muted">No other members within this radius yet.</p>
          ) : (
            <div className="d-flex flex-wrap gap-2 mb-4">
              {data.members.map((m) => (
                <Link key={m.member.id} to={`/users/${m.member.id}`} className="rw-member">
                  <Avatar user={m.member} size={30} />
                  <span><strong>{m.member.name}</strong><small className="d-block text-muted">{m.member.location.city} · {m.itemCount} item{m.itemCount === 1 ? '' : 's'}</small></span>
                </Link>
              ))}
            </div>
          )}

          <h3 className="h6">{data.totalNearby} item{data.totalNearby === 1 ? '' : 's'} within {data.center.radiusKm} km</h3>
          {data.items.length === 0 ? (
            <EmptyState icon="🧭" title="Nothing nearby yet">Try a wider radius or <Link to="/listings">browse everything</Link>.</EmptyState>
          ) : (
            <div className="row g-3">
              {data.items.map((l) => (
                <div className="col-6 col-lg-4" key={l.id}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <Avatar user={user} size={56} />
        <div>
          <h1 className="rw-page-title mb-0">{user.name}</h1>
          <Link to={`/users/${user.id}`} className="rw-link small">View my public profile →</Link>
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
