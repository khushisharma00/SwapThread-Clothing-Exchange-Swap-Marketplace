import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync, useDebounce } from '../hooks/useAsync';
import { useMeta } from '../context/MetaContext';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import SponsoredCard from '../components/SponsoredCard';
import { EmptyState, ErrorAlert, Modal, Pagination, SkeletonGrid } from '../components/ui';

const FILTER_KEYS = ['q', 'category', 'size', 'condition', 'city', 'radiusKm', 'sort', 'includeUnavailable', 'page'];

export default function ListingsPage() {
  const meta = useMeta();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const debounced = useDebounce(search);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  }

  function removeFilter(key) {
    if (key === 'q') setSearch('');
    update({ [key]: '' });
  }

  function clearAllFilters() {
    setSearch('');
    setParams(new URLSearchParams(), { replace: true });
    setShowFiltersModal(false);
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

  const activeFilters = [
    filters.q && { key: 'q', label: `Search: “${filters.q}”` },
    filters.category && {
      key: 'category',
      label: `Category: ${meta.categories.find((c) => c.value === filters.category)?.label || filters.category}`,
    },
    filters.size && { key: 'size', label: `Size: ${filters.size}` },
    filters.condition && {
      key: 'condition',
      label: `Condition: ${meta.conditions.find((c) => c.value === filters.condition)?.label || filters.condition}`,
    },
    filters.city && { key: 'city', label: `City: ${filters.city}` },
    filters.radiusKm && { key: 'radiusKm', label: `Within ${filters.radiusKm} km` },
    filters.includeUnavailable === 'true' && { key: 'includeUnavailable', label: 'Including swapped' },
  ].filter(Boolean);

  const filterFormContent = (
    <div className="d-flex flex-column gap-3">
      <div>
        <label htmlFor="f-cat" className="form-label small fw-bold">Category</label>
        <select
          id="f-cat"
          className="form-select form-select-sm"
          value={filters.category}
          onChange={(e) => update({ category: e.target.value })}
        >
          <option value="">All clothing categories</option>
          {meta.categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-size" className="form-label small fw-bold">Size</label>
        <select
          id="f-size"
          className="form-select form-select-sm"
          value={filters.size}
          onChange={(e) => update({ size: e.target.value })}
        >
          <option value="">Any size</option>
          {meta.sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-cond" className="form-label small fw-bold">Condition</label>
        <select
          id="f-cond"
          className="form-select form-select-sm"
          value={filters.condition}
          onChange={(e) => update({ condition: e.target.value })}
        >
          <option value="">Any condition</option>
          {meta.conditions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-city" className="form-label small fw-bold">City in India</label>
        <select
          id="f-city"
          className="form-select form-select-sm"
          value={filters.city}
          onChange={(e) => update({ city: e.target.value })}
        >
          <option value="">{user?.location?.city ? `Any city (You: ${user.location.city})` : 'Any city in India'}</option>
          {meta.cities.map((c) => (
            <option key={c.name} value={c.name}>{c.name}, {c.state}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-radius" className="form-label small fw-bold">Distance Radius</label>
        <select
          id="f-radius"
          className="form-select form-select-sm"
          value={filters.radiusKm}
          onChange={(e) => update({ radiusKm: e.target.value })}
        >
          <option value="">Anywhere in India</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
          <option value="150">Within 150 km</option>
          <option value="500">Within 500 km</option>
        </select>
        <p className="form-text mt-1 mb-0" style={{ fontSize: '0.75rem' }}>
          Calculated from city centroid for member privacy.
        </p>
      </div>

      <div className="form-check pt-2">
        <input
          id="f-unavail"
          type="checkbox"
          className="form-check-input"
          checked={filters.includeUnavailable === 'true'}
          onChange={(e) => update({ includeUnavailable: e.target.checked ? 'true' : '' })}
        />
        <label htmlFor="f-unavail" className="form-check-label small">
          Show reserved &amp; swapped items
        </label>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h1 className="rw-page-title mb-1">Browse clothing</h1>
          <p className="text-muted mb-0">
            {data ? `${data.total} piece${data.total === 1 ? '' : 's'} available to swap` : 'Discover pre-loved pieces'}
          </p>
        </div>
        <Link to="/dashboard/listings/new" className="btn btn-success">
          + List an item
        </Link>
      </div>

      {/* Sticky Mobile Search Toolbar */}
      <div className="rw-search-bar-sticky">
        <div className="d-flex gap-2 align-items-center">
          <div className="flex-grow-1 position-relative">
            <label htmlFor="search" className="visually-hidden">Search clothes</label>
            <input
              id="search"
              type="search"
              className="form-control"
              placeholder="Search by name, brand, color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-link btn-sm position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none me-2"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="d-flex gap-2 flex-shrink-0">
            <label htmlFor="sort" className="visually-hidden">Sort order</label>
            <select
              id="sort"
              className="form-select"
              style={{ width: 'auto', minWidth: '130px' }}
              value={filters.sort || 'newest'}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Newest first</option>
              <option value="value_desc">Value: High to low</option>
              <option value="value_asc">Value: Low to high</option>
              <option value="distance">Nearest first</option>
            </select>

            <button
              type="button"
              className="btn btn-outline-dark d-lg-none d-flex align-items-center gap-1"
              onClick={() => setShowFiltersModal(true)}
              aria-label="Open filter options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="badge bg-success rounded-pill ms-1">{activeFilters.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Removable Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="rw-filter-chips align-items-center pt-2">
            {activeFilters.map((f) => (
              <span key={f.key} className="rw-chip-active">
                {f.label}
                <button
                  type="button"
                  className="rw-chip-remove"
                  onClick={() => removeFilter(f.key)}
                  aria-label={`Remove filter ${f.label}`}
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 text-muted small text-decoration-none ms-1"
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Desktop Sidebar Filters */}
        <aside className="d-none d-lg-block col-lg-3" aria-label="Catalog filters">
          <div className="rw-panel sticky-top" style={{ top: '80px' }}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h2 className="h6 mb-0 fw-bold">Refine selection</h2>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  onClick={clearAllFilters}
                >
                  Reset all
                </button>
              )}
            </div>
            {filterFormContent}
          </div>
        </aside>

        {/* Mobile Bottom Sheet Filters Modal */}
        {showFiltersModal && (
          <Modal
            title="Filter clothing"
            onClose={() => setShowFiltersModal(false)}
            footer={
              <div className="d-flex w-100 justify-content-between gap-2">
                <button type="button" className="btn btn-outline-dark" onClick={clearAllFilters}>
                  Clear all
                </button>
                <button
                  type="button"
                  className="btn btn-success flex-grow-1"
                  onClick={() => setShowFiltersModal(false)}
                >
                  Apply filters ({activeFilters.length})
                </button>
              </div>
            }
          >
            {filterFormContent}
          </Modal>
        )}

        {/* Main Listings Grid */}
        <section className="col-12 col-lg-9" aria-live="polite">
          {radiusNeedsCity && (
            <div className="alert alert-warning mb-4">
              Select a city (or update your profile city) to browse by distance.
            </div>
          )}

          <ErrorAlert error={error} onRetry={reload} />

          {loading && <SkeletonGrid count={9} />}

          {!loading && !error && data?.items.length === 0 && !radiusNeedsCity && (
            <EmptyState
              icon="🔍"
              title="No garments matched your filters"
              action={
                <button type="button" className="btn btn-outline-dark mt-2" onClick={clearAllFilters}>
                  Reset all filters
                </button>
              }
            >
              Try widening your distance, selecting additional categories, or clearing your search term.
            </EmptyState>
          )}

          {!loading && data && data.items.length > 0 && (
            <div className="row g-3 g-md-4">
              {data.items.slice(0, 3).map((l) => (
                <div className="col-6 col-md-4" key={l.id}>
                  <ListingCard listing={l} />
                </div>
              ))}
              <div className="col-6 col-md-4" key="sponsored-grid-card">
                <SponsoredCard />
              </div>
              {data.items.slice(3).map((l) => (
                <div className="col-6 col-md-4" key={l.id}>
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(p) => {
                update({ page: String(p) });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
