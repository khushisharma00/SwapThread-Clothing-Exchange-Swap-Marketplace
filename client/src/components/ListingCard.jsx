import { Link } from 'react-router-dom';
import ItemImage from './ItemImage';
import { StatusBadge } from './ui';
import { formatValue } from '../utils/format';

export default function ListingCard({ listing, actions, showOwner = true }) {
  return (
    <article className="rw-card h-100">
      <Link to={`/listings/${listing.id}`} className="rw-card-media" aria-label={`View ${listing.title}`}>
        <ItemImage src={listing.images?.[0]} alt={listing.title} category={listing.category} />
        <span className="rw-card-status">
          <StatusBadge status={listing.status} />
        </span>
      </Link>
      <div className="rw-card-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="rw-card-title">
            <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
          </h3>
        </div>
        <p className="rw-card-meta">
          {listing.brand} · Size {listing.size}
        </p>
        <div className="d-flex flex-wrap gap-1 mb-2">
          <span className="rw-chip">{listing.conditionLabel}</span>
          <span className="rw-chip">{listing.categoryLabel}</span>
        </div>
        <div className="rw-card-footer">
          <div className="d-flex align-items-baseline gap-2 flex-wrap">
            <span className="rw-value" title="Estimated swap value — a suggestion for comparison, not a price">
              {formatValue(listing.estimatedValue)}
            </span>
            <span className="rw-value-label">est. swap value</span>
          </div>
          <div className="small text-muted text-truncate mt-1">
            📍 {listing.location?.city}
            {listing.distanceLabel ? ` · ${listing.distanceLabel}` : ''}
          </div>
          {showOwner && listing.owner?.name && <div className="small text-muted text-truncate">by {listing.owner.name}</div>}
        </div>
        {actions && <div className="rw-card-actions">{actions}</div>}
      </div>
    </article>
  );
}
