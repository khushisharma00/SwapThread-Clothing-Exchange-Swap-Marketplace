import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, assetUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMeta } from '../context/MetaContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useAsync';
import { ErrorAlert, Field, Loader } from '../components/ui';
import { formatValue } from '../utils/format';

const EMPTY = {
  title: '',
  description: '',
  category: '',
  clothingType: '',
  audience: 'unisex',
  brand: '',
  size: '',
  condition: '',
  color: '',
  city: '',
  requestedValue: '',
};

const MAX_IMAGES = 4;
const MAX_BYTES = 2 * 1024 * 1024;

function validate(f) {
  const e = {};
  if (f.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
  if (f.description.trim().length < 10) e.description = 'Describe the item in at least 10 characters (fit, flaws, fabric…)';
  if (!f.category) e.category = 'Choose a category';
  if (f.clothingType.trim().length < 2) e.clothingType = 'Specify clothing type (e.g. “Denim jacket” or “Kurta”)';
  if (!f.brand.trim()) e.brand = 'Enter the brand (or “Unbranded”)';
  if (!f.size) e.size = 'Choose a size';
  if (!f.condition) e.condition = 'Choose the condition';
  if (!f.city) e.city = 'Choose the city where the item is located';
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
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/listings/${id}`)
      .then(({ listing, isOwner }) => {
        if (!isOwner) throw new Error('You can only edit your own listings.');
        if (listing.status !== 'available') throw new Error(`This item is ${listing.status} and can no longer be edited.`);
        setForm({
          title: listing.title,
          description: listing.description,
          category: listing.category,
          clothingType: listing.clothingType,
          audience: listing.audience,
          brand: listing.brand,
          size: listing.size,
          condition: listing.condition,
          color: listing.color || '',
          city: listing.location.city,
          requestedValue: String(listing.estimatedValue),
        });
        setImages(listing.imageIds.map((imgId, i) => ({ id: imgId, url: listing.images[i] })));
      })
      .catch((err) => setServerError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // Live value estimate
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

  async function handleFiles(files) {
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      return setErrors((x) => ({ ...x, images: `You can upload up to ${MAX_IMAGES} photos.` }));
    }
    const bad = files.find((f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > MAX_BYTES);
    if (bad) {
      return setErrors((x) => ({ ...x, images: `“${bad.name}” must be a JPEG, PNG or WebP under 2 MB.` }));
    }
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
      const firstErrorId = Object.keys(v)[0];
      document.getElementById(firstErrorId)?.focus();
      return;
    }
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      clothingType: form.clothingType.trim(),
      brand: form.brand.trim(),
      color: form.color.trim(),
      requestedValue: form.requestedValue === '' ? undefined : Number(form.requestedValue),
      images: images.map((i) => i.id),
    };
    setSaving(true);
    try {
      const res = isEdit ? await api.patch(`/listings/${id}`, payload) : await api.post('/listings', payload);
      notify(isEdit ? 'Listing updated.' : 'Your item is live in the exchange! 🎉');
      navigate(`/listings/${res.listing.id}`);
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container py-5"><Loader label="Loading listing data…" /></div>;

  const est = estimate?.value;
  const reqVal = Number(form.requestedValue);
  const effective = est
    ? form.requestedValue === '' || !Number.isFinite(reqVal)
      ? est
      : Math.min(estimate.maxValue, Math.max(estimate.minValue, reqVal))
    : null;

  const errorKeys = Object.keys(errors).filter((k) => errors[k]);

  return (
    <div className="container py-4" style={{ maxWidth: 1040 }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Link to="/dashboard" className="rw-link small">← Back to dashboard</Link>
        <span className="small text-muted">Step-by-step listing guide</span>
      </div>

      <h1 className="rw-page-title mb-1">{isEdit ? 'Edit garment listing' : 'List an item for exchange'}</h1>
      <p className="text-muted mb-4">
        Clear photos and accurate condition descriptions create trustworthy, faster swap matches.
      </p>

      {/* Validation Error Summary */}
      {errorKeys.length > 0 && (
        <div className="alert alert-danger rounded-3 mb-4" role="alert">
          <strong className="d-block mb-1">Please fix the following issues:</strong>
          <ul className="mb-0 ps-3 small">
            {errorKeys.map((k) => (
              <li key={k}>{errors[k]}</li>
            ))}
          </ul>
        </div>
      )}

      <ErrorAlert error={serverError} />

      <form onSubmit={submit} noValidate className="row g-4">
        {/* Left Form: Details, Specs, Description */}
        <div className="col-12 col-lg-7">
          {/* Section 1: Photos */}
          <div className="rw-form-section">
            <h2 className="rw-form-section-title">
              <span>📸</span> 1. Garment Photos ({images.length}/{MAX_IMAGES})
            </h2>

            <div
              className={`rw-upload-grid mb-2 ${isDragging ? 'border-success' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(Array.from(e.dataTransfer.files));
              }}
            >
              {images.map((img, i) => (
                <div key={img.id} className="rw-upload-item">
                  <img src={assetUrl(img.url)} alt={`Upload ${i + 1}`} />
                  <div className="rw-upload-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-light p-1 shadow-sm"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      aria-label="Move photo earlier"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-light p-1 shadow-sm text-danger"
                      onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))}
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                  {i === 0 && <span className="rw-badge rw-badge-green rw-upload-cover">Cover Photo</span>}
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <label className="rw-upload-add">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                    className="visually-hidden"
                    disabled={uploading}
                  />
                  <span className="fs-4 d-block mb-1">📷</span>
                  <span className="fw-semibold">{uploading ? 'Uploading…' : '+ Add photos'}</span>
                  <small>Drag photos or tap to browse</small>
                </label>
              )}
            </div>

            {errors.images && <div className="invalid-feedback d-block">{errors.images}</div>}
            <small className="text-muted d-block mt-2">
              Add up to 4 photos. The first image is used as the cover. Max 2 MB each.
            </small>
          </div>

          {/* Section 2: Details */}
          <div className="rw-form-section">
            <h2 className="rw-form-section-title">
              <span>🏷️</span> 2. Garment Details
            </h2>

            <Field id="title" label="Listing Title" error={errors.title} required>
              <input
                id="title"
                className={`form-control ${inv('title')}`}
                maxLength={80}
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Fabindia Pure Cotton Block-Print Kurta"
              />
            </Field>

            <div className="row g-3">
              <div className="col-12 col-sm-6">
                <Field id="category" label="Category" error={errors.category} required>
                  <select
                    id="category"
                    className={`form-select ${inv('category')}`}
                    value={form.category}
                    onChange={set('category')}
                  >
                    <option value="">Select category…</option>
                    {meta.categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="clothingType" label="Clothing Type" error={errors.clothingType} required>
                  <input
                    id="clothingType"
                    className={`form-control ${inv('clothingType')}`}
                    maxLength={40}
                    value={form.clothingType}
                    onChange={set('clothingType')}
                    placeholder="e.g. Kurta, Blazer, Ankle Boots"
                  />
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="brand" label="Brand" error={errors.brand} required>
                  <input
                    id="brand"
                    className={`form-control ${inv('brand')}`}
                    maxLength={40}
                    value={form.brand}
                    onChange={set('brand')}
                    placeholder="e.g. Zara, Levi's, H&M"
                    list="brand-suggestions"
                  />
                  <datalist id="brand-suggestions">
                    {meta.brandTiers.flatMap((t) => t.examples).map((b) => (
                      <option key={b} value={b.replace(/\b\w/g, (m) => m.toUpperCase())} />
                    ))}
                  </datalist>
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="size" label="Size" error={errors.size} required>
                  <select id="size" className={`form-select ${inv('size')}`} value={form.size} onChange={set('size')}>
                    <option value="">Select size…</option>
                    {meta.sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="condition" label="Condition" error={errors.condition} required>
                  <select id="condition" className={`form-select ${inv('condition')}`} value={form.condition} onChange={set('condition')}>
                    <option value="">Select condition…</option>
                    {meta.conditions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="color" label="Color (optional)">
                  <input
                    id="color"
                    className="form-control"
                    maxLength={30}
                    value={form.color}
                    onChange={set('color')}
                    placeholder="e.g. Mustard Yellow, Navy Blue"
                  />
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="audience" label="Made For / Gender">
                  <select id="audience" className="form-select" value={form.audience} onChange={set('audience')}>
                    {meta.audiences.map((a) => (
                      <option key={a} value={a} className="text-capitalize">
                        {a[0].toUpperCase() + a.slice(1)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-12 col-sm-6">
                <Field id="city" label="Item Location (City)" error={errors.city} required hint="Exact address is never shared publicly.">
                  <select id="city" className={`form-select ${inv('city')}`} value={form.city} onChange={set('city')}>
                    <option value="">Select city in India…</option>
                    {meta.cities.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}, {c.state}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <Field id="description" label="Description & Notes" error={errors.description} required>
              <textarea
                id="description"
                className={`form-control ${inv('description')}`}
                rows={4}
                maxLength={1000}
                value={form.description}
                onChange={set('description')}
                placeholder="Mention fit, fabric, flaws, or why you are letting it go…"
              />
              <div className="form-text text-end">{form.description.length}/1000</div>
            </Field>
          </div>
        </div>

        {/* Right Form: Live Estimate Card & Submit Button */}
        <div className="col-12 col-lg-5">
          <div className="rw-form-section rw-value-panel sticky-top" style={{ top: '80px' }}>
            <h2 className="rw-form-section-title">
              <span>⚖️</span> 3. Estimated Swap Value
            </h2>

            {!est && (
              <div className="p-3 bg-white rounded-3 border text-center text-muted">
                <span className="fs-3 d-block mb-1">👕</span>
                Select Category, Brand, and Condition to generate the fair benchmark.
              </div>
            )}

            {est && (
              <div>
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <div className="rw-value rw-value-lg">{formatValue(effective)}</div>
                  <span className="badge bg-white text-success border">100% Cash-free</span>
                </div>

                <div className="small text-muted p-3 bg-white rounded-3 border mb-3">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span>Base value:</span>
                    <strong>{formatValue(estimate.breakdown.baseValue)}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span>Brand ({estimate.breakdown.brandTierLabel}):</span>
                    <strong>{estimate.breakdown.brandMultiplier}×</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span>Condition:</span>
                    <strong>{estimate.breakdown.conditionMultiplier}×</strong>
                  </div>
                  <div className="d-flex justify-content-between pt-1 fw-bold text-success">
                    <span>Baseline:</span>
                    <span>{formatValue(est)}</span>
                  </div>
                </div>

                <label htmlFor="requestedValue" className="form-label small fw-bold">
                  Fine-tune estimate (±25% range)
                </label>
                <input
                  id="requestedValue"
                  type="range"
                  className="form-range"
                  min={estimate.minValue}
                  max={estimate.maxValue}
                  step={10}
                  value={Number.isFinite(effective) ? effective : est}
                  onChange={set('requestedValue')}
                />
                <div className="d-flex justify-content-between small text-muted mb-2">
                  <span>Min: {formatValue(estimate.minValue)}</span>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none"
                    onClick={() => setForm((f) => ({ ...f, requestedValue: '' }))}
                  >
                    Reset to calculated
                  </button>
                  <span>Max: {formatValue(estimate.maxValue)}</span>
                </div>

                <p className="rw-fineprint mb-0 mt-3">
                  This value is a comparison benchmark to ensure fair trades. It is never used for transactions or payments.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-success btn-lg w-100 mt-4 shadow-sm"
              disabled={saving || uploading}
            >
              {saving ? 'Saving listing…' : isEdit ? 'Save changes' : 'Publish to exchange'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
