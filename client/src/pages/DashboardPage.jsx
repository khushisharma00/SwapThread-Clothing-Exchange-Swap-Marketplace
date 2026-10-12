import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import ListingCard from '../components/ListingCard';
import SwapCard from '../components/SwapCard';
import { Avatar, ConfirmDialog, EmptyState, ErrorAlert, Loader, StatCard } from '../components/ui';
import { timeAgo } from '../utils/format';

export default function DashboardPage() {
  const notify = useToast();
  const dash = useAsync(() => api.get('/users/me/dashboard'), []);
  const mine = useAsync(() => api.get('/listings/mine'), []);
  const swaps = useAsync(() => api.get('/swaps', { status: 'pending,accepted' }), []);
  const convos = useAsync(() => api.get('/conversations'), []);

  const [listingToRemove, setListingToRemove] = useState(null);

  async function removeListing() {
    if (!listingToRemove) return;
    try {
      await api.del(`/listings/${listingToRemove.id}`);
      notify('Listing removed.');
      mine.reload();
      dash.reload();
      swaps.reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setListingToRemove(null);
    }
  }

  const refreshAll = () => {
    dash.reload();
    mine.reload();
    swaps.reload();
  };

  if (dash.loading && !dash.data) {
    return (
      <div className="container py-5">
        <Loader label="Loading your dashboard…" />
      </div>
    );
  }
  if (dash.error) {
    return (
      <div className="container py-5">
        <ErrorAlert error={dash.error} onRetry={dash.reload} />
      </div>
    );
  }

  const { user, stats } = dash.data;
  const activeSwaps = swaps.data?.items || [];

  return (
    <div className="container py-4">
      {/* Header Profile Summary */}
      <section className="rw-dash-head mb-4 p-4 bg-white rounded-4 border shadow-sm">
        <div className="d-flex align-items-center gap-3 min-w-0">
          <Avatar user={user} size={64} />
          <div className="min-w-0">
            <h1 className="h3 fw-bold mb-1 text-truncate">Hi, {user.name.split(' ')[0]} 👋</h1>
            <div className="text-muted small d-flex align-items-center gap-1 text-truncate">
              <span>📍 {user.location.city || 'Location not set'}</span>
              {user.location.area && <span>({user.location.area})</span>}
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap w-100 w-sm-auto mt-3 mt-sm-0">
          <Link to="/dashboard/listings/new" className="btn btn-success flex-fill flex-sm-grow-0">
            + List an item
          </Link>
          <Link to="/profile" className="btn btn-outline-dark flex-fill flex-sm-grow-0">
            Edit profile
          </Link>
        </div>
      </section>

      {!user.location.city && (
        <div className="alert alert-warning mb-4">
          Add your city in <Link to="/profile" className="fw-semibold">your profile</Link> to discover nearby clothing swaps.
        </div>
      )}

      {/* 2x2 on Mobile, 4 in row on Desktop */}
      <div className="rw-stats-grid mb-5">
        <StatCard
          label="Active listings"
          value={stats.availableListings}
          hint={`${stats.totalListings} total listed`}
          icon={<span className="fs-4">👗</span>}
        />
        <StatCard
          label="Incoming requests"
          value={stats.incomingPending}
          hint="awaiting your reply"
          tone="amber"
          icon={<span className="fs-4">📥</span>}
        />
        <StatCard
          label="Swaps in progress"
          value={stats.activeSwaps}
          hint="accepted, exchange pending"
          tone="charcoal"
          icon={<span className="fs-4">🤝</span>}
        />
        <StatCard
          label="Successful swaps"
          value={stats.completedSwaps}
          hint={`${stats.itemsGivenNewLife} garments given a new life`}
          tone="cream"
          icon={<span className="fs-4">🌱</span>}
        />
      </div>

      {/* Open Swap Requests */}
      <section className="mb-5" aria-labelledby="active-title">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <div>
            <h2 id="active-title" className="h4 fw-bold mb-0">Open swap requests</h2>
            <p className="text-muted small mb-0">Proposals waiting for acceptance or exchange confirmation.</p>
          </div>
          <Link to="/swaps" className="rw-link small">All swaps &amp; history →</Link>
        </div>

        {swaps.loading && <Loader small label="Checking swap requests…" />}
        <ErrorAlert error={swaps.error} onRetry={swaps.reload} />

        {!swaps.loading && activeSwaps.length === 0 && (
          <div className="p-4 bg-white rounded-4 border text-center text-muted">
            No pending swap requests right now.
          </div>
        )}

        <div className="d-grid gap-3">
          {activeSwaps.slice(0, 3).map((s) => (
            <SwapCard key={s.id} swap={s} onChange={refreshAll} />
          ))}
        </div>
      </section>

      {/* Your Listings Grid */}
      <section className="mb-5" aria-labelledby="mine-title">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <div>
            <h2 id="mine-title" className="h4 fw-bold mb-0">Your wardrobe listings</h2>
            <p className="text-muted small mb-0">Manage and edit your active clothes.</p>
          </div>
          <Link to="/dashboard/listings/new" className="btn btn-outline-dark btn-sm">
            + Add garment
          </Link>
        </div>

        {mine.loading && <Loader small label="Loading your listings…" />}
        <ErrorAlert error={mine.error} onRetry={mine.reload} />

        {mine.data && mine.data.items.length === 0 && (
          <EmptyState
            icon="👚"
            title="You haven't listed anything yet"
            action={
              <Link to="/dashboard/listings/new" className="btn btn-success mt-2">
                List your first item
              </Link>
            }
          >
            Add clothes you no longer wear — they could be someone else&apos;s favourite piece!
          </EmptyState>
        )}

        <div className="row g-3 g-md-4">
          {(mine.data?.items || []).map((l) => (
            <div className="col-6 col-md-4 col-lg-3" key={l.id}>
              <ListingCard
                listing={l}
                showOwner={false}
                actions={
                  l.status === 'available' ? (
                    <div className="d-flex gap-1 w-100">
                      <Link to={`/dashboard/listings/${l.id}/edit`} className="btn btn-sm btn-outline-dark flex-fill">
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger flex-fill"
                        onClick={() => setListingToRemove(l)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <span className="small text-muted d-block text-truncate">
                      {l.status === 'reserved' ? 'In active swap' : 'Swapped'}
                    </span>
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Recent Conversations */}
      <section aria-labelledby="convo-title">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 id="convo-title" className="h4 fw-bold mb-0">Recent conversations</h2>
          <Link to="/chat" className="rw-link small">Open chat inbox →</Link>
        </div>

        {convos.loading && <Loader small />}
        {convos.data && convos.data.items.length === 0 && (
          <div className="p-4 bg-white rounded-4 border text-center text-muted">
            Conversations will appear here when you send or receive swap requests.
          </div>
        )}

        <div className="list-group rounded-4 shadow-sm border overflow-hidden">
          {(convos.data?.items || []).slice(0, 5).map((c) => (
            <Link
              key={c.swapId}
              to={`/chat/${c.swapId}`}
              className="list-group-item list-group-item-action p-3 d-flex gap-3 align-items-center"
            >
              <Avatar user={c.otherUser} size={40} />
              <div className="flex-grow-1 min-w-0">
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <strong className="text-dark text-truncate">{c.otherUser?.name}</strong>
                  <small className="text-muted text-nowrap">{timeAgo(c.lastMessageAt)}</small>
                </div>
                <small className="text-muted d-block text-truncate">
                  {c.offeredTitle} ⇄ {c.requestedTitle}
                </small>
                <small className="text-secondary d-block text-truncate">
                  {c.lastMessagePreview || 'Conversation open'}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Remove Listing Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!listingToRemove}
        title="Remove listing"
        message={`Are you sure you want to remove “${listingToRemove?.title}”? Open swap requests for this item will be cancelled.`}
        confirmText="Remove listing"
        isDanger
        onConfirm={removeListing}
        onCancel={() => setListingToRemove(null)}
      />
    </div>
  );
}
