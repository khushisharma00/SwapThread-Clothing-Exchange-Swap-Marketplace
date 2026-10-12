import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import SwapCard from '../components/SwapCard';
import ListingCard from '../components/ListingCard';
import ValueComparison from '../components/ValueComparison';
import { EmptyState, ErrorAlert, Loader, SkeletonCard } from '../components/ui';

const TABS = [
  { key: 'incoming', label: 'Incoming Requests' },
  { key: 'outgoing', label: 'Outgoing Requests' },
  { key: 'history', label: 'Completed & Closed' },
];

export default function SwapsPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'incoming';
  const { data, loading, error, reload, setData } = useAsync(() => api.get('/swaps', { box: 'all' }), []);
  const sugg = useAsync(() => api.get('/swaps/suggestions'), []);
  const [, force] = useState(0);

  const all = data?.items || [];
  const open = (s) => ['pending', 'accepted'].includes(s.status);
  const lists = {
    incoming: all.filter((s) => s.direction === 'incoming' && open(s)),
    outgoing: all.filter((s) => s.direction === 'outgoing' && open(s)),
    history: all.filter((s) => !open(s)),
  };

  function onChange(updated) {
    setData({ items: all.map((s) => (s.id === updated.id ? updated : s)) });
    force((n) => n + 1);
    reload();
    sugg.reload();
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-baseline gap-2 mb-3">
        <div>
          <h1 className="rw-page-title mb-1">Swap exchange center</h1>
          <p className="text-muted mb-0">
            Accept, negotiate, and confirm your trades. All transactions are 100% money-free.
          </p>
        </div>
        <Link to="/listings" className="btn btn-outline-dark btn-sm">
          Browse clothes to swap →
        </Link>
      </div>

      {/* Horizontally Scrollable Tabs with Count Badges */}
      <div className="overflow-auto pb-2 mb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="rw-tabs" style={{ display: 'inline-flex', flexWrap: 'nowrap', minWidth: '100%' }} role="tablist">
          {TABS.map((t) => {
            const count = lists[t.key]?.length || 0;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`rw-tab flex-fill text-nowrap px-3 py-2 ${tab === t.key ? 'active' : ''}`}
                onClick={() => setParams({ tab: t.key }, { replace: true })}
              >
                <span>{t.label}</span>
                <span className={`badge ms-2 ${tab === t.key ? 'bg-success text-white' : 'bg-light text-dark border'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <ErrorAlert error={error} onRetry={reload} />

      {loading && (
        <div className="d-flex flex-column gap-3">
          <div className="p-4 bg-white border rounded-4"><Loader label="Loading your swap records…" /></div>
        </div>
      )}

      {!loading && !error && lists[tab].length === 0 && (
        <EmptyState
          icon={tab === 'history' ? '🗂️' : '📭'}
          title={tab === 'incoming' ? 'No incoming requests yet' : tab === 'outgoing' ? 'No outgoing requests yet' : 'No past swaps on record'}
          action={
            <Link to="/listings" className="btn btn-success mt-2">
              Explore available clothes
            </Link>
          }
        >
          {tab === 'incoming'
            ? 'When someone wants to swap with one of your listed items, their proposal appears here.'
            : tab === 'outgoing'
            ? 'Browse the collection and propose a swap for pieces you love.'
            : 'Completed, declined, and cancelled exchanges will be archived here.'}
        </EmptyState>
      )}

      {/* Swaps List */}
      <div className="d-grid gap-3">
        {lists[tab].map((s) => (
          <SwapCard key={s.id} swap={s} onChange={onChange} />
        ))}
      </div>

      {/* Suggested Fair Matches Section */}
      <section className="mt-5 pt-4 border-top" aria-labelledby="sugg-title">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <div>
            <h2 id="sugg-title" className="h4 fw-bold mb-1">Suggested fair swaps for you</h2>
            <p className="text-muted small mb-0">Garments close in value to your available wardrobe items, nearest first.</p>
          </div>
          <Link to="/listings" className="rw-link small">View all →</Link>
        </div>

        {sugg.loading && (
          <div className="row g-3">
            {[1, 2, 3].map((n) => (
              <div className="col-12 col-md-4" key={n}><SkeletonCard /></div>
            ))}
          </div>
        )}

        <ErrorAlert error={sugg.error} onRetry={sugg.reload} />

        {sugg.data && sugg.data.items.length === 0 && (
          <div className="p-4 bg-light rounded-4 text-center border">
            <span className="fs-3 d-block mb-2" aria-hidden="true">🌱</span>
            <p className="text-muted mb-0">{sugg.data.reason || 'List more items to unlock automated fair-match suggestions.'}</p>
          </div>
        )}

        <div className="row g-3 g-md-4">
          {(sugg.data?.items || []).slice(0, 6).map((s) => (
            <div className="col-12 col-md-6 col-lg-4" key={s.theirItem.id}>
              <div className="card h-100 border rounded-4 p-2 shadow-sm bg-white">
                <ListingCard listing={s.theirItem} />
                <div className="p-2 mt-2 bg-light rounded-3 border">
                  <div className="small fw-semibold text-muted mb-1">Swap comparison with yours:</div>
                  <ValueComparison
                    compact
                    offeredValue={s.yourItem.estimatedValue}
                    requestedValue={s.theirItem.estimatedValue}
                    offeredLabel={s.yourItem.title.slice(0, 14)}
                    requestedLabel="Theirs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
