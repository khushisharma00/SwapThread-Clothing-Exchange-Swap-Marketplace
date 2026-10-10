import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import SwapCard from '../components/SwapCard';
import ListingCard from '../components/ListingCard';
import ValueComparison from '../components/ValueComparison';
import { EmptyState, ErrorAlert, Loader } from '../components/ui';

const TABS = [
  { key: 'incoming', label: 'Incoming' },
  { key: 'outgoing', label: 'Outgoing' },
  { key: 'history', label: 'History' },
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
    reload(); // other requests may have been auto-closed
    sugg.reload();
  }

  return (
    <div className="container py-4">
      <h1 className="rw-page-title">Swap requests</h1>
      <p className="text-muted">Accept, decline and track every exchange. Values shown are estimates to help you judge fairness.</p>

      <div className="rw-tabs rw-tabs-inline mb-3" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={`rw-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setParams({ tab: t.key }, { replace: true })}>
            {t.label} <span className="rw-count">{lists[t.key].length}</span>
          </button>
        ))}
      </div>

      {loading && <Loader label="Loading swaps…" />}
      <ErrorAlert error={error} onRetry={reload} />
      {!loading && !error && lists[tab].length === 0 && (
        <EmptyState icon={tab === 'history' ? '🗂️' : '📭'} title={tab === 'incoming' ? 'No incoming requests' : tab === 'outgoing' ? 'No outgoing requests' : 'No past swaps yet'} action={<Link to="/listings" className="btn btn-success">Browse clothes</Link>}>
          {tab === 'incoming' ? 'When someone offers a swap for one of your items, it shows up here.' : 'Find something you like and propose a swap.'}
        </EmptyState>
      )}
      <div className="d-grid gap-3">
        {lists[tab].map((s) => <SwapCard key={s.id} swap={s} onChange={onChange} />)}
      </div>

      <section className="mt-5" aria-labelledby="sugg-title">
        <h2 id="sugg-title" className="rw-section-title">Fair swaps for you</h2>
        <p className="text-muted small">Items whose estimated value is close to one of yours, nearest first.</p>
        {sugg.loading && <Loader small />}
        <ErrorAlert error={sugg.error} onRetry={sugg.reload} />
        {sugg.data && sugg.data.items.length === 0 && (
          <EmptyState icon="🌱" title="No suggestions yet">{sugg.data.reason || 'List more items to unlock suggestions.'}</EmptyState>
        )}
        <div className="row g-3">
          {(sugg.data?.items || []).slice(0, 6).map((s) => (
            <div className="col-md-6 col-lg-4" key={s.theirItem.id}>
              <ListingCard listing={s.theirItem} />
              <div className="rw-panel mt-2 p-2">
                <ValueComparison compact offeredValue={s.yourItem.estimatedValue} requestedValue={s.theirItem.estimatedValue} offeredLabel={s.yourItem.title.slice(0, 14)} requestedLabel="Theirs" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
