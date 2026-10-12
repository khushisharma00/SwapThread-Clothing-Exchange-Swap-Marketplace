import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync, useDebounce } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { useMeta } from '../context/MetaContext';
import { ConfirmDialog, EmptyState, ErrorAlert, Loader, Modal, PromptDialog, StatCard, StatusBadge } from '../components/ui';
import { REPORT_REASONS, formatDate, formatValue, timeAgo } from '../utils/format';

const TABS = ['overview', 'users', 'listings', 'swaps', 'reports'];

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="rw-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="rw-bars-label" title={r.label}>{r.label}</span>
          <span className="rw-bars-track">
            <span style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="rw-bars-value">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

function Overview() {
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/stats'), []);
  if (loading) return <Loader label="Calculating platform analytics…" />;
  if (error) return <ErrorAlert error={error} onRetry={reload} />;

  const { kpis, users, listings, swaps, reports, messagesLast30d, generatedAt } = data;
  const swapRows = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((s) => ({
    label: s[0].toUpperCase() + s.slice(1),
    count: swaps.byStatus[s] || 0,
  }));

  return (
    <>
      <div className="rw-stats-grid">
        <StatCard
          label="Total listings"
          value={kpis.totalListings}
          hint={`${kpis.availableListings} available now`}
          icon={<span className="fs-4">👗</span>}
        />
        <StatCard
          label="Successful swaps"
          value={kpis.successfulSwaps}
          hint={`${swaps.total} requests total`}
          tone="charcoal"
          icon={<span className="fs-4">🤝</span>}
        />
        <StatCard
          label="Active members (30d)"
          value={kpis.activeUsers30d}
          hint={`${kpis.totalUsers} total · ${users.newLast7d} new this week`}
          tone="cream"
          icon={<span className="fs-4">👥</span>}
        />
        <StatCard
          label="Swap conversion"
          value={`${kpis.swapConversionRate}%`}
          hint="completed ÷ all requests"
          tone="amber"
          icon={<span className="fs-4">📈</span>}
        />
        <StatCard
          label="Acceptance rate"
          value={`${kpis.acceptanceRate}%`}
          hint="accepted ÷ decided requests"
          icon={<span className="fs-4">✅</span>}
        />
        <StatCard
          label="User engagement"
          value={`${kpis.userEngagementRate}%`}
          hint="members who sent a request"
          tone="cream"
          icon={<span className="fs-4">⚡</span>}
        />
        <StatCard
          label="Open reports"
          value={reports.open}
          hint="moderation queue"
          tone={reports.open ? 'amber' : 'green'}
          icon={<span className="fs-4">🛡️</span>}
        />
        <StatCard
          label="Messages (30d)"
          value={messagesLast30d}
          hint={`${swaps.last7d} requests this week`}
          tone="charcoal"
          icon={<span className="fs-4">💬</span>}
        />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="rw-panel h-100">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>🔄</span> Swaps by status
            </h3>
            <Bars rows={swapRows} />
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="rw-panel h-100">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>👚</span> Listings by category
            </h3>
            <Bars rows={listings.byCategory.map((c) => ({ label: c.label, count: c.count }))} />
          </div>
        </div>

        <div className="col-12 col-md-6 col-lg-4">
          <div className="rw-panel h-100">
            <h3 className="h6 fw-bold mb-3 d-flex align-items-center gap-2">
              <span>📍</span> Top active cities
            </h3>
            <Bars rows={listings.byCity.map((c) => ({ label: c.city, count: c.count }))} />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center small text-muted mt-4 pt-2 border-top">
        <span>Report updated {formatDate(generatedAt)}</span>
        <span>{users.suspended} suspended account(s) on file</span>
      </div>
    </>
  );
}

function Users() {
  const notify = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/users', { q: dq, status }), [dq, status]);

  const [promptData, setPromptData] = useState(null);

  async function applyStatus(u, next, reason = '') {
    try {
      await api.patch(`/admin/users/${u.id}/status`, { status: next, reason });
      notify(next === 'suspended' ? `${u.name} suspended.` : `${u.name} reactivated.`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setPromptData(null);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Search member name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search users"
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading && <Loader small label="Loading members…" />}
      <ErrorAlert error={error} onRetry={reload} />

      <div className="rw-table-responsive rw-table">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Member</th>
              <th>City</th>
              <th>Role</th>
              <th>Listings</th>
              <th>Swaps</th>
              <th>Last active</th>
              <th>Status</th>
              <th className="text-end" aria-label="Actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((u) => (
              <tr key={u.id}>
                <td data-label="Member">
                  <Link to={`/users/${u.id}`} className="rw-link fw-semibold">{u.name}</Link>
                  <div className="small text-muted">{u.email}</div>
                </td>
                <td data-label="City">{u.location.city || '—'}</td>
                <td data-label="Role" className="text-capitalize">{u.role}</td>
                <td data-label="Listings">{u.listingCount}</td>
                <td data-label="Swaps">{u.swapsCompleted}</td>
                <td data-label="Last active" className="small">{timeAgo(u.lastActiveAt)}</td>
                <td data-label="Status">
                  <StatusBadge status={u.status} />
                  {u.suspendedReason && <div className="small text-muted">{u.suspendedReason}</div>}
                </td>
                <td data-label="Action" className="text-end">
                  {u.role !== 'admin' && (u.status === 'active' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        setPromptData({
                          user: u,
                          next: 'suspended',
                          title: `Suspend ${u.name}`,
                          message: `Suspend ${u.name}? Their active swaps will be cancelled. Enter reason:`,
                          placeholder: 'Violation of community guidelines',
                        })
                      }
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => applyStatus(u, 'active')}
                    >
                      Reactivate
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PromptDialog
        isOpen={!!promptData}
        title={promptData?.title}
        message={promptData?.message}
        placeholder={promptData?.placeholder}
        confirmText="Suspend account"
        onConfirm={(reason) => promptData && applyStatus(promptData.user, promptData.next, reason)}
        onCancel={() => setPromptData(null)}
      />
    </>
  );
}

function Listings() {
  const notify = useToast();
  const { categories } = useMeta();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounce(q);
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/listings', { status, q: dq }), [status, dq]);
  const [editing, setEditing] = useState(null);
  const [removePrompt, setRemovePrompt] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleRemove(reason) {
    if (!removePrompt) return;
    try {
      await api.del(`/admin/listings/${removePrompt.id}`, { reason: reason || 'Violates listing guidelines' });
      notify('Listing removed.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setRemovePrompt(null);
    }
  }

  async function restore(l) {
    try {
      await api.patch(`/admin/listings/${l.id}`, { status: 'available', moderationNote: '' });
      notify('Listing restored.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/admin/listings/${editing.id}`, {
        title: editing.title,
        description: editing.description,
        category: editing.category,
        moderationNote: editing.moderationNote,
      });
      notify('Listing updated.');
      setEditing(null);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 320 }}
          placeholder="Search title or brand…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search listings"
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {['available', 'reserved', 'swapped', 'removed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading && <Loader small label="Loading listings…" />}
      <ErrorAlert error={error} onRetry={reload} />

      <div className="rw-table-responsive rw-table">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Item</th>
              <th>Owner</th>
              <th>City</th>
              <th>Est. value</th>
              <th>Status</th>
              <th>Listed</th>
              <th className="text-end" aria-label="Actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((l) => (
              <tr key={l.id}>
                <td data-label="Item">
                  <Link to={`/listings/${l.id}`} className="rw-link fw-semibold">{l.title}</Link>
                  <div className="small text-muted">{l.brand} · {l.categoryLabel} · {l.size}</div>
                  {l.moderationNote && <div className="small text-danger fw-medium">{l.moderationNote}</div>}
                </td>
                <td data-label="Owner">{l.owner?.name}</td>
                <td data-label="City">{l.location.city}</td>
                <td data-label="Est. value">{formatValue(l.estimatedValue)}</td>
                <td data-label="Status"><StatusBadge status={l.status} /></td>
                <td data-label="Listed" className="small">{timeAgo(l.createdAt)}</td>
                <td data-label="Action" className="text-end text-nowrap">
                  <button type="button" className="btn btn-sm btn-outline-dark me-1" onClick={() => setEditing({ ...l })}>
                    Edit
                  </button>
                  {l.status === 'removed' ? (
                    <button type="button" className="btn btn-sm btn-outline-success" onClick={() => restore(l)}>
                      Restore
                    </button>
                  ) : (
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setRemovePrompt(l)}>
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Styled Prompt Modal for Removal */}
      <PromptDialog
        isOpen={!!removePrompt}
        title={`Remove “${removePrompt?.title}”`}
        message="Enter the moderation reason shown to the owner:"
        placeholder="Violates listing guidelines"
        confirmText="Remove listing"
        onConfirm={handleRemove}
        onCancel={() => setRemovePrompt(null)}
      />

      {/* Edit Listing Modal */}
      {editing && (
        <Modal title="Edit listing (moderation)" onClose={() => setEditing(null)}>
          <form onSubmit={saveEdit}>
            <label htmlFor="a-title" className="form-label">Title</label>
            <input
              id="a-title"
              className="form-control mb-2"
              minLength={3}
              maxLength={80}
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <label htmlFor="a-cat" className="form-label">Category</label>
            <select
              id="a-cat"
              className="form-select mb-2"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <label htmlFor="a-desc" className="form-label">Description</label>
            <textarea
              id="a-desc"
              className="form-control mb-2"
              rows={4}
              minLength={10}
              maxLength={1000}
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <label htmlFor="a-note" className="form-label">Moderation note</label>
            <input
              id="a-note"
              className="form-control mb-3"
              maxLength={300}
              value={editing.moderationNote || ''}
              onChange={(e) => setEditing({ ...editing, moderationNote: e.target.value })}
            />
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-dark" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-success" disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Swaps() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/swaps', { status }), [status]);

  return (
    <>
      <select
        className="form-select mb-3"
        style={{ maxWidth: 220 }}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All swap statuses</option>
        {['pending', 'accepted', 'completed', 'rejected', 'cancelled'].map((s) => (
          <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      {loading && <Loader small label="Loading swaps…" />}
      <ErrorAlert error={error} onRetry={reload} />
      {data && data.items.length === 0 && <EmptyState icon="🔁" title="No swaps match this filter" />}

      <div className="rw-table-responsive rw-table">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              <th>Requester → Owner</th>
              <th>Offered ⇄ Requested</th>
              <th>Values</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="text-end" aria-label="Actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((s) => (
              <tr key={s.id}>
                <td data-label="Parties">{s.requester?.name} → {s.owner?.name}</td>
                <td data-label="Items" className="small">{s.offeredListing.title} ⇄ {s.requestedListing.title}</td>
                <td data-label="Values" className="small">
                  {formatValue(s.offeredValue)} / {formatValue(s.requestedValue)}
                  <div className={s.isFairMatch ? 'text-success fw-medium' : 'text-warning-emphasis'}>
                    Δ {formatValue(s.valueDifference)}{s.isFairMatch ? ' · fair' : ''}
                  </div>
                </td>
                <td data-label="Status"><StatusBadge status={s.status} /></td>
                <td data-label="Updated" className="small">{timeAgo(s.updatedAt)}</td>
                <td data-label="Action" className="text-end">
                  <Link to={`/chat/${s.id}`} className="btn btn-sm btn-outline-dark">
                    View chat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Reports() {
  const notify = useToast();
  const [status, setStatus] = useState('open');
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/reports', { status }), [status]);
  const [reportAction, setReportAction] = useState(null);

  const reasonLabel = (r) => REPORT_REASONS.find((x) => x.value === r)?.label || r;

  async function executeDecision(note) {
    if (!reportAction) return;
    const { report, next } = reportAction;
    try {
      await api.patch(`/admin/reports/${report.id}`, { status: next, adminNote: note || '' });
      notify('Report updated.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setReportAction(null);
    }
  }

  return (
    <>
      <select
        className="form-select mb-3"
        style={{ maxWidth: 220 }}
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Filter reports"
      >
        <option value="open">Open Reports</option>
        <option value="resolved">Resolved Reports</option>
        <option value="dismissed">Dismissed Reports</option>
        <option value="">All Reports</option>
      </select>

      {loading && <Loader small label="Loading reports…" />}
      <ErrorAlert error={error} onRetry={reload} />
      {data && data.items.length === 0 && <EmptyState icon="✅" title="Nothing to review">No reports with this status.</EmptyState>}

      <div className="d-grid gap-3">
        {(data?.items || []).map((r) => (
          <div key={r.id} className="rw-panel p-3">
            <div className="d-flex flex-wrap justify-content-between gap-2">
              <div>
                <StatusBadge status={r.status} />{' '}
                <span className="rw-chip text-capitalize">{r.targetType}</span>{' '}
                <strong className="ms-1">{reasonLabel(r.reason)}</strong>
                <div className="small text-muted mt-1">
                  Reported by {r.reporter?.name} · {timeAgo(r.createdAt)}
                </div>
              </div>

              <div className="d-flex gap-2 align-items-start">
                {r.target?.link && (
                  <Link to={r.target.link} className="btn btn-sm btn-outline-dark">
                    Open {r.targetType}
                  </Link>
                )}
                {r.status === 'open' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() =>
                        setReportAction({
                          report: r,
                          next: 'resolved',
                          title: 'Resolve Report',
                          message: 'Add an optional admin resolution note:',
                        })
                      }
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setReportAction({
                          report: r,
                          next: 'dismissed',
                          title: 'Dismiss Report',
                          message: 'Add an optional note explaining dismissal:',
                        })
                      }
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="mb-1 mt-2">
              <strong>Target:</strong> {r.target ? `${r.target.label} (${r.target.status})` : 'Item no longer exists'}
            </p>
            {r.details && <p className="mb-1 text-secondary">“{r.details}”</p>}
            {r.adminNote && (
              <p className="small text-muted mb-0 bg-light p-2 rounded-2 mt-2">
                Admin note: {r.adminNote}{r.resolvedBy ? ` — ${r.resolvedBy}` : ''}
              </p>
            )}
          </div>
        ))}
      </div>

      <PromptDialog
        isOpen={!!reportAction}
        title={reportAction?.title}
        message={reportAction?.message}
        placeholder="e.g. Verified with user"
        confirmText="Confirm decision"
        onConfirm={executeDecision}
        onCancel={() => setReportAction(null)}
      />
    </>
  );
}

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'overview';

  return (
    <div className="container py-4">
      <h1 className="rw-page-title mb-1">Marketplace admin panel</h1>
      <p className="text-muted mb-3">
        Monitor exchange metrics, moderate clothing listings, manage members, and resolve disputes.
      </p>

      <div className="overflow-auto pb-2 mb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="rw-tabs" style={{ display: 'inline-flex', flexWrap: 'nowrap' }} role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`rw-tab text-capitalize text-nowrap px-3 ${tab === t ? 'active' : ''}`}
              onClick={() => setParams({ tab: t }, { replace: true })}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users />}
      {tab === 'listings' && <Listings />}
      {tab === 'swaps' && <Swaps />}
      {tab === 'reports' && <Reports />}
    </div>
  );
}
