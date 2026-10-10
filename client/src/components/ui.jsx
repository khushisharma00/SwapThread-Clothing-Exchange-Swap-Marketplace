import { Link } from 'react-router-dom';
import { STATUS_STYLES, initials } from '../utils/format';

export function Logo({ light = false }) {
  return (
    <span className={`rw-logo ${light ? 'rw-logo-light' : ''}`} aria-label="ReWear">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#f7f3ea' : '#2f6b4f'} />
        <path d="M20 22 L28 17 Q32 22 36 17 L44 22 L50 30 L45 34 L42 31 L42 48 L22 48 L22 31 L19 34 L14 30 Z" fill={light ? '#2f6b4f' : '#f7f3ea'} />
      </svg>
      <span className="rw-logo-text">
        Re<em>Wear</em>
      </span>
    </span>
  );
}

export function Loader({ label = 'Loading…', small = false }) {
  return (
    <div className={`rw-loader ${small ? 'rw-loader-sm' : ''}`} role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm text-success me-2" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className="alert rw-alert-error d-flex align-items-center justify-content-between gap-3" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-dark" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = '🧺', title, children, action }) {
  return (
    <div className="rw-empty">
      <div className="rw-empty-icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { label: status, cls: 'rw-badge-muted' };
  return <span className={`rw-badge ${s.cls}`}>{s.label}</span>;
}

export function Avatar({ user, size = 40 }) {
  return (
    <span className="rw-avatar" style={{ width: size, height: size, background: user?.avatarColor || '#2f6b4f', fontSize: size * 0.38 }} aria-hidden="true">
      {initials(user?.name || '?')}
    </span>
  );
}

export function UserChip({ user, linked = true }) {
  if (!user) return null;
  const inner = (
    <>
      <Avatar user={user} size={34} />
      <span>
        <strong className="d-block">{user.name}</strong>
        <small className="text-muted">
          {[user.location?.area, user.location?.city].filter(Boolean).join(', ') || 'Location not shared'}
        </small>
      </span>
    </>
  );
  return linked && user.id ? (
    <Link to={`/users/${user.id}`} className="rw-userchip">
      {inner}
    </Link>
  ) : (
    <span className="rw-userchip">{inner}</span>
  );
}

export function StatCard({ label, value, hint, tone = 'green' }) {
  return (
    <div className={`rw-stat rw-stat-${tone}`}>
      <div className="rw-stat-value">{value}</div>
      <div className="rw-stat-label">{label}</div>
      {hint && <div className="rw-stat-hint">{hint}</div>}
    </div>
  );
}

export function Field({ id, label, error, hint, children }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {hint && !error && <div className="form-text">{hint}</div>}
      {error && (
        <div className="invalid-feedback d-block" id={`${id}-error`}>
          {error}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, size = '' }) {
  return (
    <div className="rw-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`rw-modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="rw-modal-header">
          <h2 className="h5 mb-0">{title}</h2>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="rw-modal-body">{children}</div>
        {footer && <div className="rw-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="d-flex justify-content-center align-items-center gap-2 mt-4" aria-label="Pagination">
      <button type="button" className="btn btn-outline-dark btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span className="small text-muted px-2">
        Page {page} of {totalPages}
      </span>
      <button type="button" className="btn btn-outline-dark btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </nav>
  );
}
