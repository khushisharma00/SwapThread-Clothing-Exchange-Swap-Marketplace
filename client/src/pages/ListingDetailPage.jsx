import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ItemImage from '../components/ItemImage';
import ProposeSwapModal from '../components/ProposeSwapModal';
import ReportButton from '../components/ReportButton';
import { ConfirmDialog, EmptyState, ErrorAlert, Loader, StatusBadge, UserChip } from '../components/ui';
import { formatDate, formatValue, timeAgo } from '../utils/format';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.get(`/listings/${id}`), [id, user?.id]);
  const [imgIdx, setImgIdx] = useState(0);
  const [proposing, setProposing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [openQa, setOpenQa] = useState(null);

  if (loading) return <div className="container py-5"><Loader label="Loading garment details…" /></div>;
  if (error) {
    return (
      <div className="container py-5">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState icon="🧺" title="This garment isn't available" action={<Link to="/listings" className="btn btn-success">Browse other clothes</Link>}>
            It may have been removed by its owner or already swapped.
          </EmptyState>
        ) : (
          <ErrorAlert error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const { listing, isOwner, myOpenRequest } = data;
  const images = listing.images.length ? listing.images : [null];
  const b = listing.valueBreakdown || {};

  async function handleRemove() {
    try {
      await api.del(`/listings/${listing.id}`);
      notify('Listing removed.');
      navigate('/dashboard');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  let actionButton;
  if (!user) {
    actionButton = (
      <Link to="/login" state={{ from: `/listings/${listing.id}` }} className="btn btn-success btn-lg w-100 justify-content-center">
        Log in to propose a swap
      </Link>
    );
  } else if (isOwner) {
    actionButton = (
      <div className="d-flex gap-2 w-100">
        {listing.status === 'available' && (
          <Link to={`/dashboard/listings/${listing.id}/edit`} className="btn btn-outline-dark flex-fill justify-content-center">
            Edit listing
          </Link>
        )}
        {listing.status === 'available' && (
          <button type="button" className="btn btn-outline-danger flex-fill justify-content-center" onClick={() => setShowDeleteConfirm(true)}>
            Remove
          </button>
        )}
        {listing.status !== 'available' && (
          <div className="alert alert-light border mb-0 w-100 text-center">
            This is your item (currently <strong>{listing.status}</strong>).
          </div>
        )}
      </div>
    );
  } else if (myOpenRequest) {
    actionButton = (
      <Link to={`/chat/${myOpenRequest.id}`} className="btn btn-outline-dark btn-lg w-100 justify-content-center">
        💬 Open negotiation chat
      </Link>
    );
  } else if (listing.status !== 'available') {
    actionButton = (
      <div className="alert alert-warning mb-0 text-center">
        This item is currently <strong>{listing.status}</strong> and cannot be requested.
      </div>
    );
  } else {
    actionButton = (
      <button type="button" className="btn btn-success btn-lg w-100 justify-content-center shadow-sm" onClick={() => setProposing(true)}>
        Propose a swap
      </button>
    );
  }

  return (
    <div className="container py-4 pb-5">
      {/* Breadcrumbs (Hidden on Mobile) */}
      <nav aria-label="breadcrumb" className="d-none d-md-block mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item"><Link to="/listings">Browse</Link></li>
          <li className="breadcrumb-item"><Link to={`/listings?category=${listing.category}`}>{listing.categoryLabel}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{listing.title}</li>
        </ol>
      </nav>

      <div className="row g-4 g-lg-5">
        {/* Left Column: Image Gallery with Dots */}
        <div className="col-12 col-lg-6">
          <div className="position-relative">
            <div className="rw-gallery-main">
              <ItemImage src={images[imgIdx]} alt={`${listing.title} — photo ${imgIdx + 1}`} category={listing.category} />
            </div>

            {/* Dots on mobile */}
            {images.length > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-2 d-md-none" aria-hidden="true">
                {images.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: i === imgIdx ? 'var(--rw-green)' : 'var(--rw-line)',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Desktop Thumbnails */}
            {images.length > 1 && (
              <div className="rw-gallery-thumbs d-none d-md-flex" role="list">
                {images.map((src, i) => (
                  <button
                    key={src || i}
                    type="button"
                    role="listitem"
                    className={`rw-thumb ${i === imgIdx ? 'active' : ''}`}
                    onClick={() => setImgIdx(i)}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <ItemImage src={src} alt="" category={listing.category} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Garment Details & Actions */}
        <div className="col-12 col-lg-6">
          <div className="d-flex gap-2 align-items-center mb-2 flex-wrap">
            <StatusBadge status={listing.status} />
            <span className="small text-muted">Listed {timeAgo(listing.createdAt)} · {listing.views} views</span>
          </div>

          <h1 className="rw-page-title mb-1">{listing.title}</h1>
          <p className="text-muted fs-6 mb-3">
            <span className="fw-semibold">{listing.brand}</span> · {listing.clothingType}
          </p>

          {/* Value Box */}
          <div className="rw-value-box mb-4">
            <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
              <div>
                <div className="rw-value rw-value-lg">{formatValue(listing.estimatedValue)}</div>
                <div className="rw-value-label">Estimated swap value · fair-match benchmark</div>
              </div>
              <span className="badge bg-success-subtle text-success border px-2 py-1">No payment required</span>
            </div>

            <details className="small mt-3 pt-2 border-top border-success-subtle">
              <summary className="fw-semibold">How was this value calculated?</summary>
              <div className="p-2 rw-panel rounded-2 mt-2">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span>Category base ({listing.categoryLabel}):</span>
                  <strong>{formatValue(b.baseValue)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span>Brand tier ({b.brandTierLabel || 'Standard'}):</span>
                  <strong>{b.brandMultiplier}×</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span>Condition ({listing.conditionLabel}):</span>
                  <strong>{b.conditionMultiplier}×</strong>
                </div>
                <div className="d-flex justify-content-between pt-1 fw-bold text-success">
                  <span>Calculated baseline:</span>
                  <span>{formatValue(listing.calculatedValue)}</span>
                </div>
                {listing.calculatedValue !== listing.estimatedValue && (
                  <div className="small text-muted mt-1">
                    * Adjusted by member within fair bounds (max ±25%).
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Spec Grid with Icons */}
          <dl className="rw-specs">
            <div>
              <dt>Garment Type</dt>
              <dd>{listing.clothingType}</dd>
            </div>
            <div>
              <dt>Brand</dt>
              <dd>{listing.brand}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd className="badge bg-secondary-subtle fs-6 p-1">{listing.size}</dd>
            </div>
            <div>
              <dt>Condition</dt>
              <dd>{listing.conditionLabel}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{listing.color || '—'}</dd>
            </div>
            <div>
              <dt>Gender/Fit</dt>
              <dd className="text-capitalize">{listing.audience}</dd>
            </div>
            <div className="col-12" style={{ gridColumn: 'span 2' }}>
              <dt>Location</dt>
              <dd>
                📍 {listing.location.city}
                {listing.distanceLabel ? ` · ${listing.distanceLabel}` : ''}
              </dd>
            </div>
          </dl>

          {/* Description */}
          <div className="mb-4">
            <h2 className="h6 fw-bold text-uppercase text-muted letter-spacing-1 mb-2">Description</h2>
            <p className="rw-description rw-panel p-3 rounded-3 mb-0">
              {listing.description}
            </p>
          </div>

          {/* Garment Q&A & Fit Guidance */}
          <div className="rw-garment-qa mb-4">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div>
                <span className="rw-eyebrow mb-1">Pre-Swap Q&A</span>
                <h3 className="h6 fw-bold mb-0">Garment Q&A & Fit Advice</h3>
              </div>
              <span className="badge bg-success-subtle text-success-emphasis">
                ✓ Verified Swap Guidelines
              </span>
            </div>

            <div className="rw-faq-list" style={{ gap: '0.5rem' }}>
              <div className={`rw-faq-item ${openQa === 'size' ? 'open' : ''}`}>
                <button
                  type="button"
                  className="rw-faq-question py-2 px-3 small"
                  onClick={() => setOpenQa(openQa === 'size' ? null : 'size')}
                  aria-expanded={openQa === 'size'}
                >
                  <span>📏 How does the sizing & fit run for this {listing.clothingType}?</span>
                  <span className="rw-faq-icon" aria-hidden="true" style={{ width: 22, height: 22 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {openQa === 'size' && (
                  <div className="rw-faq-answer small pt-2 pb-3 px-3">
                    This item is tagged size <strong>{listing.size}</strong> ({listing.audience || 'unisex'}). Sizing can vary across brands like {listing.brand}. For a guaranteed fit, you can ask <strong>{listing.owner?.name?.split(' ')[0] || 'the owner'}</strong> in swap chat for exact flat measurements (chest, waist, sleeve, total length).
                  </div>
                )}
              </div>

              <div className={`rw-faq-item ${openQa === 'clean' ? 'open' : ''}`}>
                <button
                  type="button"
                  className="rw-faq-question py-2 px-3 small"
                  onClick={() => setOpenQa(openQa === 'clean' ? null : 'clean')}
                  aria-expanded={openQa === 'clean'}
                >
                  <span>🧼 What is the cleanliness standard for this piece?</span>
                  <span className="rw-faq-icon" aria-hidden="true" style={{ width: 22, height: 22 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {openQa === 'clean' && (
                  <div className="rw-faq-answer small pt-2 pb-3 px-3">
                    All SwapThread community members agree to freshly wash or dry-clean clothes prior to exchange. This garment is rated in <strong>{listing.conditionLabel}</strong> condition.
                  </div>
                )}
              </div>

              <div className={`rw-faq-item ${openQa === 'delivery' ? 'open' : ''}`}>
                <button
                  type="button"
                  className="rw-faq-question py-2 px-3 small"
                  onClick={() => setOpenQa(openQa === 'delivery' ? null : 'delivery')}
                  aria-expanded={openQa === 'delivery'}
                >
                  <span>📍 How will I exchange this garment with the owner?</span>
                  <span className="rw-faq-icon" aria-hidden="true" style={{ width: 22, height: 22 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {openQa === 'delivery' && (
                  <div className="rw-faq-answer small pt-2 pb-3 px-3">
                    The owner is based in <strong>{listing.location.city}</strong>. If you are in the same city, you can meet in a public location. For distance trades, both parties ship via courier (e.g. India Post or Delhivery) and share parcel tracking in chat.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Action Area */}
          <div className="d-none d-md-block my-4">
            {actionButton}
          </div>

          {/* Owner Card */}
          <div className="rw-panel mb-3">
            <div className="small text-muted fw-bold text-uppercase mb-2">Garment Owner</div>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <UserChip user={listing.owner} />
              <div className="text-end">
                <span className="badge bg-success-subtle text-success-emphasis">
                  {listing.owner?.swapsCompleted || 0} swaps completed
                </span>
                <div className="small text-muted mt-1">
                  Member since {listing.owner?.memberSince ? new Date(listing.owner.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}
                </div>
              </div>
            </div>
          </div>

          {user && !isOwner && (
            <div className="text-end mt-2">
              <ReportButton targetType="listing" targetId={listing.id} label="Report this listing" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <aside className="rw-sticky-action-bar" aria-label="Mobile action bar">
        <div>
          <span className="rw-value d-block" style={{ fontSize: '1.25rem' }}>{formatValue(listing.estimatedValue)}</span>
          <span className="rw-value-label d-block">est. swap value</span>
        </div>
        <div style={{ minWidth: '170px' }}>
          {actionButton}
        </div>
      </aside>

      {/* Propose Swap Modal */}
      {proposing && <ProposeSwapModal listing={listing} onClose={() => setProposing(false)} />}

      {/* Remove Listing Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remove listing"
        message="Are you sure you want to remove this garment? Any open swap requests will be closed."
        confirmText="Remove garment"
        isDanger
        onConfirm={handleRemove}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
