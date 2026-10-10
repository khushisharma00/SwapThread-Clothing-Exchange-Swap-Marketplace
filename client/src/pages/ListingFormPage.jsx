import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useAsync';
import { ErrorAlert, Field, Loader } from '../components/ui';
import { formatValue } from '../utils/format';

const EMPTY = { title: '', description: '', category: '', clothingType: '', audience: 'unisex', brand: '', size: '', condition: '', color: '', city: '', requestedValue: '' };
const MAX_IMAGES = 4;
const MAX_BYTES = 2 * 1024 * 1024;

function validate(f) {
  const e = {};
  if (f.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
  if (f.description.trim().length < 10) e.description = 'Describe the item in at least 10 characters (fit, flaws, fabric…)';
  if (!f.category) e.category = 'Choose a category';
  if (f.clothingType.trim().length < 2) e.clothingType = 'E.g. “Denim jacket” or “Kurta”';
  if (!f.brand.trim()) e.brand = 'Enter the brand (or “Unbranded”)';
  if (!f.size) e.size = 'Choose a size';
  if (!f.condition) e.condition = 'Choose the condition';
  if (!f.city) e.city = 'Choose the city where the item is';
  return e;
}

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const meta = useMeta();
  const notify = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY, city: user?.location?.city || '' });
  const [images, setImages] = useState([]); // [{id, url}]
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimate, setEstimate] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/listings/${id}`)
      .then(({ listing, isOwner }) => {
        if (!isOwner) throw new Error('You can only edit your own listings.');
        if (listing.status !== 'available') throw new Error(`This item is ${listing.status} and can no longer be edited.`);
        setForm({
          title: listing.title, description: listing.description, category: listing.category, clothingType: listing.clothingType,
          audience: listing.audience, brand: listing.brand, size: listing.size, condition: listing.condition, color: listing.color || '',
          city: listing.location.city, requestedValue: String(listing.estimatedValue),
        });
        setImages(listing.imageIds.map((imgId, i) => ({ id: imgId, url: listing.images[i] })));
      })
      .catch((err) => setServerError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Live value estimate (server-side calculator)
  const estKey = useDebounce(`${form.category}|${form.brand}|${form.condition}`, 300);
  useEffect(() => {
    const [category, brand, condition] = estKey.split('|');
    if (!category || !condition) {
      setEstimate(null);
      return;
    }
    api.post('/listings/estimate', { category, brand, condition }).then(setEstimate).catch(() => setEstimate(null));
  }, [estKey]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const inv = (k) => (errors[k] ? 'is-invalid' : '');

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) return setErrors((x) => ({ ...x, images: `You can add up to ${MAX_IMAGES} photos.` }));
    const bad = files.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > MAX_BYTES);
    if (bad) return setErrors((x) => ({ ...x, images: `“${bad.name}” must be a JPEG, PNG or WebP under 2 MB.` }));
    setErrors((x) => ({ ...x, images: undefined }));
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      const res = await api.upload('/images', fd);
      setImages((prev) => [...prev, ...res.images]);
    } catch (err) {
      setErrors((x) => ({ ...x, images: err.message }));
    } finally {
      setUploading(false);
    }
  }

  function moveImage(i, dir) {
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setServerError(null);
    if (Object.keys(v).length) {
      document.getElementById(Object.keys(v)[0])?.focus();
      return;
    }
    const payload = {
      ...form,
      title: form.title.trim(), description: form.description.trim(), clothingType: form.clothingType.trim(), brand: form.brand.trim(), color: form.color.trim(),
      requestedValue: form.requestedValue === '' ? undefined : Number(form.requestedValue),
      images: images.map((i) => i.id),
    };
    setSaving(true);
    try {
      const res = isEdit ? await api.patch(`/listings/${id}`, payload) : await api.post('/listings', payload);
      notify(isEdit ? 'Listing updated.' : 'Your item is live! 🎉');
      navigate(`/listings/${res.listing.id}`);
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container py-5"><Loader /></div>;

  const est = estimate?.value;
  const reqVal = Number(form.requestedValue);
  const effective = est ? (form.requestedValue === '' || !Number.isFinite(reqVal) ? est : Math.min(estimate.maxValue, Math.max(estimate.minValue, reqVal))) : null;

  return (
    <div className="container py-4" style={{ maxWidth: 960 }}>
      <Link to="/dashboard" className="rw-link small">← Back to dashboard</Link>
      <h1 className="rw-page-title mt-2">{isEdit ? 'Edit listing' : 'List an item for swapping'}</h1>
      <p className="text-muted">Clear photos and honest condition notes lead to faster, fairer swaps.</p>
      <ErrorAlert error={serverError} />
      <form onSubmit={submit} noValidate className="row g-4">
        <div className="col-lg-7">
          <div className="rw-panel">
            <Field id="title" label="Title" error={errors.title}>
              <input id="title" className={`form-control ${inv('title')}`} maxLength={80} value={form.title} onChange={set('title')} placeholder="e.g. Levi's 511 Slim Jeans" />
            </Field>
            <div className="row">
              <div className="col-sm-6">
                <Field id="category" label="Category" error={errors.category}>
                  <select id="category" className={`form-select ${inv('category')}`} value={form.category} onChange={set('category')}>
                    <option value="">Select…</option>
                    {meta.categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="clothingType" label="Clothing type" error={errors.clothingType}>
                  <input id="clothingType" className={`form-control ${inv('clothingType')}`} maxLength={40} value={form.clothingType} onChange={set('clothingType')} placeholder="e.g. Denim jacket" />
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="brand" label="Brand" error={errors.brand}>
                  <input id="brand" className={`form-control ${inv('brand')}`} maxLength={40} value={form.brand} onChange={set('brand')} placeholder="e.g. Zara" list="brand-suggestions" />
                  <datalist id="brand-suggestions">
                    {meta.brandTiers.flatMap((t) => t.examples).map((b) => <option key={b} value={b.replace(/\b\w/g, (m) => m.toUpperCase())} />)}
                  </datalist>
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="size" label="Size" error={errors.size}>
                  <select id="size" className={`form-select ${inv('size')}`} value={form.size} onChange={set('size')}>
                    <option value="">Select…</option>
                    {meta.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="condition" label="Condition" error={errors.condition}>
                  <select id="condition" className={`form-select ${inv('condition')}`} value={form.condition} onChange={set('condition')}>
                    <option value="">Select…</option>
                    {meta.conditions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="color" label="Colour (optional)" error={errors.color}>
                  <input id="color" className="form-control" maxLength={30} value={form.color} onChange={set('color')} placeholder="e.g. Navy" />
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="audience" label="Made for">
                  <select id="audience" className="form-select" value={form.audience} onChange={set('audience')}>
                    {meta.audiences.map((a) => <option key={a} value={a} className="text-capitalize">{a[0].toUpperCase() + a.slice(1)}</option>)}
                  </select>
                </Field>
              </div>
              <div className="col-sm-6">
                <Field id="city" label="Item location (city)" error={errors.city} hint="Only the city is shown publicly.">
                  <select id="city" className={`form-select ${inv('city')}`} value={form.city} onChange={set('city')}>
                    <option value="">Select…</option>
                    {meta.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
              </div>
            </div>
            <Field id="description" label="Description" error={errors.description}>
              <textarea id="description" className={`form-control ${inv('description')}`} rows={4} maxLength={1000} value={form.description} onChange={set('description')} placeholder="Fit, fabric, how often worn, any flaws…" />
              <div className="form-text text-end">{form.description.length}/1000</div>
            </Field>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="rw-panel mb-4">
            <h2 className="h6">Photos <span className="text-muted fw-normal">({images.length}/{MAX_IMAGES})</span></h2>
            <div className="rw-upload-grid">
              {images.map((img, i) => (
                <div key={img.id} className="rw-upload-item">
                  <img src={assetUrl(img.url)} alt={`Upload ${i + 1}`} />
                  <div className="rw-upload-actions">
                    <button type="button" className="btn btn-sm btn-light" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move left">←</button>
                    <button type="button" className="btn btn-sm btn-light" onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))} aria-label="Remove photo">✕</button>
                  </div>
                  {i === 0 && <span className="rw-badge rw-badge-green rw-upload-cover">Cover</span>}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="rw-upload-add">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} className="visually-hidden" disabled={uploading} />
                  <span>{uploading ? 'Uploading…' : '+ Add photos'}</span>
                  <small>JPEG/PNG/WebP · max 2 MB</small>
                </label>
              )}
            </div>
            {errors.images && <div className="invalid-feedback d-block">{errors.images}</div>}
          </div>

          <div className="rw-panel rw-value-panel">
            <h2 className="h6">Estimated swap value</h2>
            {!est && <p className="small text-muted mb-0">Choose a category, brand and condition to see the estimate.</p>}
            {est && (
              <>
                <div className="rw-value rw-value-lg">{formatValue(effective)}</div>
                <p className="small text-muted">
                  Calculated: {formatValue(est)} = base {formatValue(estimate.breakdown.baseValue)} × {estimate.breakdown.brandTierLabel} brand {estimate.breakdown.brandMultiplier}× × condition {estimate.breakdown.conditionMultiplier}×
                </p>
                <label htmlFor="requestedValue" className="form-label small fw-semibold">Fine-tune (±25%)</label>
                <input id="requestedValue" type="range" className="form-range" min={estimate.minValue} max={estimate.maxValue} step={10} value={Number.isFinite(effective) ? effective : est} onChange={set('requestedValue')} />
                <div className="d-flex justify-content-between small text-muted"><span>{formatValue(estimate.minValue)}</span><button type="button" className="btn btn-link btn-sm p-0" onClick={() => setForm((f) => ({ ...f, requestedValue: '' }))}>Reset</button><span>{formatValue(estimate.maxValue)}</span></div>
                <p className="rw-fineprint mt-2 mb-0">This is an estimate for comparing swaps — not a price. ReWear never handles money.</p>
              </>
            )}
          </div>

          <button type="submit" className="btn btn-success btn-lg w-100 mt-4" disabled={saving || uploading}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
