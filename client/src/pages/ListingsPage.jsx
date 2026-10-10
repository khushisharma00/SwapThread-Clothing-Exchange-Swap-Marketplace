import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync, useDebounce } from '../hooks/useAsync';
import { useMeta } from '../context/MetaContext';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { EmptyState, ErrorAlert, Loader, Pagination } from '../components/ui';

const FILTER_KEYS = ['q', 'category', 'size', 'condition', 'city', 'radiusKm', 'sort', 'includeUnavailable', 'page'];

export default function ListingsPage() {
  const meta = useMeta();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounce(search);
  const [showFilters, setShowFilters] = useState(false);

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  useEffect(() => {
    if ((params.get('q') || '') !== debounced) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = { ...filters, limit: 12 };
  const radiusNeedsCity = filters.radiusKm && !filters.city && !user?.location?.city;
  const { data, loading, error, reload } = useAsync(
    () => (radiusNeedsCity ? Promise.resolve({ items: [], total: 0, totalPages: 1, page: 1 }) : api.get('/listings', query)),
    [params.toString(), radiusNeedsCity]
  );

  const activeCount = ['category', 'size', 'condition', 'city', 'radiusKm', 'includeUnavailable'].filter((k) => filters[k]).length;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="rw-page-title">Browse clothes</h1>
          <p className="text-muted mb-0">{data ? `${data.total} item${data.total === 1 ? '' : 's'} ready to swap` : 'Discover pre-loved pieces'}</p>
        </div>
        <Link to="/dashboard/listings/new" className="btn btn-success">+ List an item</Link>
      </div>

      <div className="rw-toolbar">
        <div className="rw-search">
          <label htmlFor="search" className="visually-hidden">Search clothes</label>
          <input id="search" type="search" className="form-control" placeholder="Search by name, brand, colour…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <label htmlFor="sort" className="visually-hidden">Sort</label>
          <select id="sort" className="form-select" value={filters.sort || 'newest'} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="value_desc">Value: high to low</option>
            <option value="value_asc">Value: low to high</option>
            <option value="distance">Nearest first</option>
          </select>
          <button type="button" className="btn btn-outline-dark d-lg-none" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <aside className={`col-lg-3 ${showFilters ? '' : 'd-none d-lg-block'}`} aria-label="Filters">
          <div className="rw-panel">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h2 className="h6 mb-0">Filters</h2>
              {activeCount > 0 && (
                <button type="button" className="btn btn-link btn-sm p-0" onClick={() => { setSearch(''); setParams(new URLSearchParams(), { replace: true }); }}>
                  Clear all
                </button>
              )}
            </div>
            <label htmlFor="f-cat" className="form-label small fw-semibold">Category</label>
            <select id="f-cat" className="form-select form-select-sm mb-3" value={filters.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {meta.categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <label htmlFor="f-size" className="form-label small fw-semibold">Size</label>
            <select id="f-size" className="form-select form-select-sm mb-3" value={filters.size} onChange={(e) => update({ size: e.target.value })}>
              <option value="">Any size</option>
              {meta.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label htmlFor="f-cond" className="form-label small fw-semibold">Condition</label>
            <select id="f-cond" className="form-select form-select-sm mb-3" value={filters.condition} onChange={(e) => update({ condition: e.target.value })}>
              <option value="">Any condition</option>
              {meta.conditions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <label htmlFor="f-city" className="form-label small fw-semibold">City</label>
            <select id="f-city" className="form-select form-select-sm mb-3" value={filters.city} onChange={(e) => update({ city: e.target.value })}>
              <option value="">{user?.location?.city ? `Any (you: ${user.location.city})` : 'Any city'}</option>
              {meta.cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <label htmlFor="f-radius" className="form-label small fw-semibold">Distance</label>
            <select id="f-radius" className="form-select form-select-sm mb-2" value={filters.radiusKm} onChange={(e) => update({ radiusKm: e.target.value })}>
              <option value="">Exact city / anywhere</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="150">Within 150 km</option>
              <option value="500">Within 500 km</option>
            </select>
            <p className="form-text mt-0 mb-3">Distance is measured from {filters.city || user?.location?.city || 'the selected city'} (city centres only).</p>
            <div className="form-check">
              <input id="f-unavail" type="checkbox" className="form-check-input" checked={filters.includeUnavailable === 'true'} onChange={(e) => update({ includeUnavailable: e.target.checked ? 'true' : '' })} />
              <label htmlFor="f-unavail" className="form-check-label small">Show reserved &amp; swapped items</label>
            </div>
          </div>
        </aside>

        <section className="col-lg-9" aria-live="polite">
          {radiusNeedsCity && <div className="alert alert-warning">Choose a city (or log in and set your city) to search by distance.</div>}
          {loading && <Loader label="Finding clothes…" />}
          <ErrorAlert error={error} onRetry={reload} />
          {!loading && !error && data?.items.length === 0 && !radiusNeedsCity && (
            <EmptyState icon="🔍" title="No matches yet" action={<button type="button" className="btn btn-outline-dark" onClick={() => { setSearch(''); setParams(new URLSearchParams(), { replace: true }); }}>Clear filters</button>}>
              Try a different search, a wider distance, or another size.
            </EmptyState>
          )}
          <div className="row g-3">
            {(data?.items || []).map((l) => (
              <div className="col-6 col-md-4" key={l.id}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => update({ page: String(p) })} />}
        </section>
      </div>
    </div>
  );
}
