import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import ReportButton from '../components/ReportButton';
import { Avatar, EmptyState, ErrorAlert, SkeletonGrid } from '../components/ui';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get(`/users/${id}`), [id]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="rw-panel mb-4 p-4 d-flex align-items-center gap-3">
          <div className="rw-skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
          <div className="flex-grow-1">
            <div className="rw-skeleton mb-2" style={{ width: '40%', height: 28 }} />
            <div className="rw-skeleton mb-2" style={{ width: '25%', height: 16 }} />
            <div className="rw-skeleton" style={{ width: '60%', height: 16 }} />
          </div>
        </div>
        <SkeletonGrid count={8} columns="col-6 col-md-4 col-lg-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState
            icon="🙈"
            title="Member not found"
            action={<Link to="/listings" className="btn btn-success">Browse clothes</Link>}
          >
            This profile doesn&apos;t exist or is no longer active.
          </EmptyState>
        ) : (
          <ErrorAlert error={error} onRetry={reload} />
        )}
      </div>
    );
  }

  const { user, listings } = data;
  const isMe = me?.id === user.id;

  return (
    <div className="container py-4">
      {/* Member Header Card */}
      <section className="rw-profile-head mb-3">
        <Avatar user={user} size={84} />
        <div className="flex-grow-1">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <h1 className="rw-page-title mb-0">{user.name}</h1>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {user.swapsCompleted} Swap{user.swapsCompleted === 1 ? '' : 's'} Done
            </span>
          </div>
          <div className="text-muted small">
            📍 {[user.location.area, user.location.city].filter(Boolean).join(', ') || 'Location not shared'}
          </div>
          <div className="small text-muted mt-1">
            Member since {new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
          {user.bio ? (
            <p className="mt-2 mb-0 small" style={{ maxWidth: '650px', lineHeight: 1.5 }}>
              &ldquo;{user.bio}&rdquo;
            </p>
          ) : null}
        </div>
        <div className="d-flex flex-column align-items-sm-end gap-2">
          {isMe ? (
            <Link to="/profile" className="btn btn-outline-dark btn-sm">Edit my profile</Link>
          ) : (
            me && <ReportButton targetType="user" targetId={user.id} label="Report member" />
          )}
        </div>
      </section>

      {/* Privacy Guarantee Note */}
      <div className="rw-privacy-note mb-4">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted flex-shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          <strong>Community Privacy:</strong> For member safety, SwapThread never shows email addresses, phone numbers, or exact addresses. Logistics are coordinated in the swap chat.
        </span>
      </div>

      {/* Wardrobe Listings */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="rw-section-title mb-0">Available Wardrobe</h2>
        <span className="badge bg-light text-muted border px-2 py-1">
          {listings.length} item{listings.length === 1 ? '' : 's'}
        </span>
      </div>

      {listings.length === 0 ? (
        <div className="rw-panel">
          <EmptyState icon="🧺" title="No items available right now">
            This member doesn&apos;t have any active listings right now. Check back soon!
          </EmptyState>
        </div>
      ) : (
        <div className="row g-3">
          {listings.map((l) => (
            <div className="col-6 col-md-4 col-lg-3" key={l.id}>
              <ListingCard listing={l} showOwner={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
