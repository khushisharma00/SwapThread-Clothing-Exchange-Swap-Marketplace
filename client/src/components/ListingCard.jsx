import { Link } from 'react-router-dom';
import ItemImage from './ItemImage';
import { StatusBadge } from './ui';
import { formatValue } from '../utils/format';

export default function ListingCard({ listing, actions, showOwner = true }) {
  return (
    <article className="rw-card h-100 position-relative">
      <div className="rw-card-media">
        <ItemImage src={listing.images?.[0]} alt={listing.title} category={listing.category} />
        <span className="rw-card-status">
          <StatusBadge status={listing.status} />
        </span>
      </div>

      <div className="rw-card-body">
        <h3 className="rw-card-title">
          <Link to={`/listings/${listing.id}`} className="stretched-link text-decoration-none text-reset">
            {listing.title}
          </Link>
        </h3>

        <p className="rw-card-meta mb-2">
          <span className="fw-semibold">{listing.brand}</span> · Size {listing.size}
        </p>

        <div className="d-flex flex-wrap gap-1 mb-3">
          <span className="rw-chip">{listing.conditionLabel}</span>
          <span className="rw-chip">{listing.categoryLabel}</span>
        </div>

        <div className="rw-card-footer mt-auto pt-2">
          <div className="d-flex align-items-baseline gap-2 flex-wrap mb-1">
            <span className="rw-value" title="Estimated swap value — a suggestion for comparison, not a price">
              {formatValue(listing.estimatedValue)}
            </span>
            <span className="rw-value-label">est. swap value</span>
          </div>

          <div className="small text-muted d-flex align-items-center gap-1 overflow-hidden" style={{ minWidth: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="flex-shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-truncate">{listing.location?.city || 'India'}</span>
            {listing.distanceLabel && <span className="opacity-75 flex-shrink-0">({listing.distanceLabel})</span>}
          </div>

          {showOwner && listing.owner?.name && (
            <div className="small text-muted text-truncate mt-1">
              by <span className="fw-medium">{listing.owner.name}</span>
            </div>
          )}
        </div>

        {actions && (
          <div className="rw-card-actions position-relative z-2">
            {actions}
          </div>
        )}
      </div>
    </article>
  );
}
