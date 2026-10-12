import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_STYLES, initials } from '../utils/format';

export function Logo({ light = false }) {
  return (
    <span className={`rw-logo ${light ? 'rw-logo-light' : ''}`} aria-label="ReWear">
      <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#f7f3ea' : '#2f6b4f'} />
        <path
          d="M20 22 L28 17 Q32 22 36 17 L44 22 L50 30 L45 34 L42 31 L42 48 L22 48 L22 31 L19 34 L14 30 Z"
          fill={light ? '#2f6b4f' : '#f7f3ea'}
        />
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

export function SkeletonCard() {
  return (
    <div className="rw-skeleton-card" aria-hidden="true">
      <div className="rw-skeleton rw-skeleton-media" />
      <div className="rw-skeleton-body">
        <div className="rw-skeleton rw-skeleton-text" />
        <div className="rw-skeleton rw-skeleton-text-sm" />
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2">
          <div className="rw-skeleton" style={{ width: 60, height: 20 }} />
          <div className="rw-skeleton" style={{ width: 45, height: 16 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="row g-3 g-md-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="col-6 col-md-4 col-lg-3">
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rw-stat" aria-hidden="true">
      <div className="rw-skeleton" style={{ width: 50, height: 32, marginBottom: 8 }} />
      <div className="rw-skeleton" style={{ width: 110, height: 16, marginBottom: 4 }} />
      <div className="rw-skeleton" style={{ width: 70, height: 12 }} />
    </div>
  );
}

export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  return (
    <div className="alert rw-alert-error d-flex align-items-center justify-content-between gap-3 shadow-sm" role="alert">
      <div className="d-flex align-items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{message}</span>
      </div>
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
      <div className="rw-empty-icon" aria-hidden="true" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <h3 className="h4 mb-2">{title}</h3>
      {children && <p className="text-muted mx-auto mb-4" style={{ maxWidth: '32rem' }}>{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { label: status, cls: 'rw-badge-muted' };
  return <span className={`rw-badge ${s.cls}`}>{s.label}</span>;
}

export function Avatar({ user, size = 40 }) {
  return (
    <span
      className="rw-avatar"
      style={{
        width: size,
        height: size,
        background: user?.avatarColor || '#2f6b4f',
        fontSize: size * 0.38,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        color: '#fff',
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials(user?.name || '?')}
    </span>
  );
}

export function UserChip({ user, linked = true }) {
  if (!user) return null;
  const inner = (
    <>
      <Avatar user={user} size={36} />
      <span>
        <strong className="d-block text-truncate" style={{ maxWidth: '140px' }}>{user.name}</strong>
        <small className="text-muted d-block text-truncate" style={{ maxWidth: '140px' }}>
          {[user.location?.area, user.location?.city].filter(Boolean).join(', ') || 'Location shared'}
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

export function StatCard({ label, value, hint, tone = 'green', icon }) {
  return (
    <div className={`rw-stat rw-stat-${tone}`}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="rw-stat-value">{value}</div>
        {icon && <span className="opacity-75" aria-hidden="true">{icon}</span>}
      </div>
      <div className="rw-stat-label">{label}</div>
      {hint && <div className="rw-stat-hint">{hint}</div>}
    </div>
  );
}

export function Field({ id, label, error, hint, required, children }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label d-flex justify-content-between">
        <span>
          {label} {required && <span className="text-danger">*</span>}
        </span>
      </label>
      {children}
      {hint && !error && <div className="form-text" id={`${id}-hint`}>{hint}</div>}
      {error && (
        <div className="invalid-feedback d-block" id={`${id}-error`} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, size = '', isSheet = true }) {
  const modalRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <div
      className={`rw-modal-backdrop ${isSheet ? 'rw-sheet-mobile' : ''}`}
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className={`rw-modal ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="rw-modal-header">
          <h2 className="h5 mb-0 fw-bold">{title}</h2>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
        </div>
        <div className="rw-modal-body">{children}</div>
        {footer && <div className="rw-modal-footer rw-modal-footer-sticky">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, title = 'Confirm action', message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-outline-dark" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className={`btn ${isDanger ? 'btn-danger' : 'btn-success'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </>
      }
    >
      <p className="mb-0 text-muted">{message}</p>
    </Modal>
  );
}

export function PromptDialog({ isOpen, title = 'Input required', message, initialValue = '', placeholder = '', confirmText = 'Submit', cancelText = 'Cancel', onConfirm, onCancel }) {
  const [val, setVal] = useState(initialValue);
  useEffect(() => {
    setVal(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" className="btn btn-outline-dark" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="btn btn-success" onClick={() => onConfirm(val)}>
            {confirmText}
          </button>
        </>
      }
    >
      {message && <p className="mb-3 text-muted">{message}</p>}
      <input
        type="text"
        className="form-control"
        placeholder={placeholder}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        autoFocus
      />
    </Modal>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="d-flex justify-content-center align-items-center gap-2 mt-4 pt-2" aria-label="Pagination">
      <button
        type="button"
        className="btn btn-outline-dark btn-sm"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        ← Previous
      </button>
      <span className="small text-muted px-2 fw-medium">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-outline-dark btn-sm"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </nav>
  );
}
