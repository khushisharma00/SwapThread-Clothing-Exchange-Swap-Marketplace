import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import ReportButton from '../components/ReportButton';
import { Avatar, EmptyState, ErrorAlert, Loader } from '../components/ui';

export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get(`/users/${id}`), [id]);

  if (loading) return <div className="container py-5"><Loader /></div>;
  if (error) {
    return (
      <div className="container py-5">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState icon="🙈" title="Member not found" action={<Link to="/listings" className="btn btn-success">Browse clothes</Link>}>This profile doesn&apos;t exist or is no longer active.</EmptyState>
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
      <section className="rw-profile-head">
        <Avatar user={user} size={84} />
        <div className="flex-grow-1">
          <h1 className="rw-page-title mb-1">{user.name}</h1>
          <div className="text-muted">📍 {[user.location.area, user.location.city].filter(Boolean).join(', ') || 'Location not shared'}</div>
          <div className="small text-muted mt-1">
            Member since {new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {user.swapsCompleted} completed swap{user.swapsCompleted === 1 ? '' : 's'}
          </div>
          {user.bio && <p className="mt-2 mb-0">{user.bio}</p>}
        </div>
        <div>
          {isMe ? <Link to="/profile" className="btn btn-outline-dark">Edit profile</Link> : me && <ReportButton targetType="user" targetId={user.id} label="Report member" />}
        </div>
      </section>
      <p className="small text-muted mt-2">For privacy, ReWear never shows email addresses, phone numbers or exact addresses. Arrange details in the swap chat.</p>

      <h2 className="rw-section-title mt-4">Available to swap ({listings.length})</h2>
      {listings.length === 0 ? (
        <EmptyState icon="🧺" title="No items available right now" />
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
