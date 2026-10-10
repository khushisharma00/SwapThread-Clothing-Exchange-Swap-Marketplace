import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ItemImage from '../components/ItemImage';
import ProposeSwapModal from '../components/ProposeSwapModal';
import ReportButton from '../components/ReportButton';
import { EmptyState, ErrorAlert, Loader, StatusBadge, UserChip } from '../components/ui';
import { formatValue, timeAgo } from '../utils/format';

export default function ListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.get(`/listings/${id}`), [id, user?.id]);
  const [imgIdx, setImgIdx] = useState(0);
  const [proposing, setProposing] = useState(false);

  if (loading) return <div className="container py-5"><Loader /></div>;
  if (error) {
    return (
      <div className="container py-5">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState icon="🧺" title="This item isn't available" action={<Link to="/listings" className="btn btn-success">Browse other clothes</Link>}>
            It may have been removed by its owner or swapped already.
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

  async function remove() {
    if (!window.confirm('Remove this listing? Open swap requests for it will be closed.')) return;
    try {
      await api.del(`/listings/${listing.id}`);
      notify('Listing removed.');
      navigate('/dashboard');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  let action;
  if (!user) {
    action = <Link to="/login" state={{ from: `/listings/${listing.id}` }} className="btn btn-success btn-lg w-100">Log in to propose a swap</Link>;
  } else if (isOwner) {
    action = (
      <div className="d-flex gap-2">
        {listing.status === 'available' && <Link to={`/dashboard/listings/${listing.id}/edit`} className="btn btn-outline-dark flex-fill">Edit listing</Link>}
        {listing.status === 'available' && <button type="button" className="btn btn-outline-danger flex-fill" onClick={remove}>Remove</button>}
        {listing.status !== 'available' && <div className="alert alert-light mb-0 w-100">This is your item. It is currently <strong>{listing.status}</strong>.</div>}
      </div>
    );
  } else if (myOpenRequest) {
    action = <Link to={`/chat/${myOpenRequest.id}`} className="btn btn-outline-dark btn-lg w-100">You already requested this · open chat</Link>;
  } else if (listing.status !== 'available') {
    action = <div className="alert alert-warning mb-0">This item is <strong>{listing.status}</strong> and can&apos;t be requested right now.</div>;
  } else {
    action = <button type="button" className="btn btn-success btn-lg w-100" onClick={() => setProposing(true)}>Propose a swap</button>;
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link to="/listings">Browse</Link></li>
          <li className="breadcrumb-item"><Link to={`/listings?category=${listing.category}`}>{listing.categoryLabel}</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{listing.title}</li>
        </ol>
      </nav>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="rw-gallery-main">
            <ItemImage src={images[imgIdx]} alt={`${listing.title} — photo ${imgIdx + 1}`} category={listing.category} />
          </div>
          {images.length > 1 && (
            <div className="rw-gallery-thumbs" role="list">
              {images.map((src, i) => (
                <button key={src || i} type="button" role="listitem" className={`rw-thumb ${i === imgIdx ? 'active' : ''}`} onClick={() => setImgIdx(i)} aria-label={`Show photo ${i + 1}`}>
                  <ItemImage src={src} alt="" category={listing.category} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="col-lg-6">
          <div className="d-flex gap-2 align-items-center mb-2">
            <StatusBadge status={listing.status} />
            <span className="small text-muted">Listed {timeAgo(listing.createdAt)} · {listing.views} views</span>
          </div>
          <h1 className="rw-page-title">{listing.title}</h1>
          <p className="text-muted">{listing.brand} · {listing.clothingType}</p>

          <div className="rw-value-box">
            <div>
              <div className="rw-value rw-value-lg">{formatValue(listing.estimatedValue)}</div>
              <div className="rw-value-label">Estimated swap value — a guide for fair swaps, not a price</div>
            </div>
            <details className="small mt-2">
              <summary>How was this estimated?</summary>
              <p className="mb-0 mt-2">
                {listing.categoryLabel} base {formatValue(b.baseValue)} × {b.brandTierLabel || 'Standard'} brand ({b.brandMultiplier}×) × {listing.conditionLabel} ({b.conditionMultiplier}×) = {formatValue(listing.calculatedValue)}
                {listing.calculatedValue !== listing.estimatedValue && ' — adjusted by the owner (max ±25%).'}
              </p>
            </details>
          </div>

          <dl className="rw-specs">
            <div><dt>Type</dt><dd>{listing.clothingType}</dd></div>
            <div><dt>Brand</dt><dd>{listing.brand}</dd></div>
            <div><dt>Size</dt><dd>{listing.size}</dd></div>
            <div><dt>Condition</dt><dd>{listing.conditionLabel}</dd></div>
            <div><dt>Colour</dt><dd>{listing.color || '—'}</dd></div>
            <div><dt>For</dt><dd className="text-capitalize">{listing.audience}</dd></div>
            <div><dt>Location</dt><dd>{listing.location.city}{listing.distanceLabel ? ` · ${listing.distanceLabel}` : ''}</dd></div>
          </dl>

          <h2 className="h6 mt-4">Description</h2>
          <p className="rw-description">{listing.description}</p>

          <div className="my-4">{action}</div>

          <div className="rw-panel">
            <div className="small text-muted mb-2">Listed by</div>
            <UserChip user={listing.owner} />
            <div className="small text-muted mt-2">{listing.owner?.swapsCompleted || 0} completed swaps · Exact address is never shared</div>
          </div>
          {user && !isOwner && <div className="text-end mt-2"><ReportButton targetType="listing" targetId={listing.id} label="Report this listing" /></div>}
        </div>
      </div>
      {proposing && <ProposeSwapModal listing={listing} onClose={() => setProposing(false)} />}
    </div>
  );
}
