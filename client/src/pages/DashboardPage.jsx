import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';
import SwapCard from '../components/SwapCard';
import { Avatar, EmptyState, ErrorAlert, Loader, StatCard } from '../components/ui';
import { timeAgo } from '../utils/format';

export default function DashboardPage() {
  const notify = useToast();
  const dash = useAsync(() => api.get('/users/me/dashboard'), []);
  const mine = useAsync(() => api.get('/listings/mine'), []);
  const swaps = useAsync(() => api.get('/swaps', { status: 'pending,accepted' }), []);
  const convos = useAsync(() => api.get('/conversations'), []);

  async function removeListing(l) {
    if (!window.confirm(`Remove “${l.title}”? Open swap requests for it will be closed.`)) return;
    try {
      await api.del(`/listings/${l.id}`);
      notify('Listing removed.');
      mine.reload();
      dash.reload();
      swaps.reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  const refreshAll = () => {
    dash.reload();
    mine.reload();
    swaps.reload();
  };

  if (dash.loading && !dash.data) return <div className="container py-5"><Loader label="Loading your dashboard…" /></div>;
  if (dash.error) return <div className="container py-5"><ErrorAlert error={dash.error} onRetry={dash.reload} /></div>;

  const { user, stats } = dash.data;
  const activeSwaps = swaps.data?.items || [];

  return (
    <div className="container py-4">
      <section className="rw-dash-head">
        <div className="d-flex align-items-center gap-3">
          <Avatar user={user} size={64} />
          <div>
            <h1 className="rw-page-title mb-0">Hi, {user.name.split(' ')[0]} 👋</h1>
            <div className="text-muted small">{user.email} · {user.location.city || 'No city set'}{user.location.area ? ` (${user.location.area})` : ''}</div>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/profile" className="btn btn-outline-dark">Edit profile</Link>
          <Link to="/dashboard/listings/new" className="btn btn-success">+ List an item</Link>
        </div>
      </section>

      {!user.location.city && (
        <div className="alert alert-warning">Add your city in <Link to="/profile">your profile</Link> to get nearby swap suggestions.</div>
      )}

      <div className="rw-stats-grid my-4">
        <StatCard label="Active listings" value={stats.availableListings} hint={`${stats.totalListings} total`} />
        <StatCard label="Incoming requests" value={stats.incomingPending} hint="awaiting your reply" tone="amber" />
        <StatCard label="Swaps in progress" value={stats.activeSwaps} hint="accepted, not yet exchanged" tone="charcoal" />
        <StatCard label="Successful swaps" value={stats.completedSwaps} hint={`${stats.itemsGivenNewLife} garments given a new life`} tone="cream" />
      </div>

      <section className="mb-5" aria-labelledby="active-title">
        <div className="d-flex justify-content-between align-items-end mb-2">
          <h2 id="active-title" className="rw-section-title mb-0">Open swap requests</h2>
          <Link to="/swaps" className="rw-link">All swaps & history →</Link>
        </div>
        {swaps.loading && <Loader small />}
        <ErrorAlert error={swaps.error} onRetry={swaps.reload} />
        {!swaps.loading && activeSwaps.length === 0 && <p className="text-muted">No open requests right now.</p>}
        <div className="d-grid gap-3">
          {activeSwaps.slice(0, 3).map((s) => <SwapCard key={s.id} swap={s} onChange={refreshAll} />)}
        </div>
      </section>

      <section className="mb-5" aria-labelledby="mine-title">
        <h2 id="mine-title" className="rw-section-title">Your listings</h2>
        {mine.loading && <Loader small />}
        <ErrorAlert error={mine.error} onRetry={mine.reload} />
        {mine.data && mine.data.items.length === 0 && (
          <EmptyState icon="👚" title="You haven't listed anything yet" action={<Link to="/dashboard/listings/new" className="btn btn-success">List your first item</Link>}>
            Add clothes you no longer wear — they could be someone else&apos;s favourite.
          </EmptyState>
        )}
        <div className="row g-3">
          {(mine.data?.items || []).map((l) => (
            <div className="col-6 col-md-4 col-lg-3" key={l.id}>
              <ListingCard
                listing={l}
                showOwner={false}
                actions={
                  l.status === 'available' ? (
                    <>
                      <Link to={`/dashboard/listings/${l.id}/edit`} className="btn btn-sm btn-outline-dark">Edit</Link>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeListing(l)}>Remove</button>
                    </>
                  ) : (
                    <span className="small text-muted">{l.status === 'reserved' ? 'In an accepted swap' : 'Swapped — kept for history'}</span>
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="convo-title">
        <h2 id="convo-title" className="rw-section-title">Recent conversations</h2>
        {convos.loading && <Loader small />}
        {convos.data && convos.data.items.length === 0 && <p className="text-muted">Conversations appear when you send or receive a swap request.</p>}
        <div className="list-group">
          {(convos.data?.items || []).slice(0, 5).map((c) => (
            <Link key={c.swapId} to={`/chat/${c.swapId}`} className="list-group-item list-group-item-action d-flex gap-3 align-items-center">
              <Avatar user={c.otherUser} size={32} />
              <span className="flex-grow-1 min-w-0">
                <strong>{c.otherUser?.name}</strong> <small className="text-muted">· {c.offeredTitle} ⇄ {c.requestedTitle}</small>
                <small className="d-block text-truncate text-muted">{c.lastMessagePreview}</small>
              </span>
              <small className="text-muted text-nowrap">{timeAgo(c.lastMessageAt)}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
