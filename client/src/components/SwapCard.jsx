import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ItemImage from './ItemImage';
import ValueComparison from './ValueComparison';
import ReportButton from './ReportButton';
import { ConfirmDialog, StatusBadge } from './ui';
import { formatDate, timeAgo } from '../utils/format';

function ItemMini({ item, caption, badgeBg = 'bg-light text-dark' }) {
  if (!item) return null;
  return (
    <Link to={`/listings/${item.id}`} className="rw-swap-item text-decoration-none">
      <ItemImage src={item.images?.[0]} alt={item.title} category={item.category} />
      <div className="min-w-0 flex-grow-1">
        <span className={`badge ${badgeBg} mb-1 fw-bold`}>{caption}</span>
        <strong className="d-block text-truncate text-dark">{item.title || 'Item'}</strong>
        <small className="d-block text-muted text-truncate">{item.brand} · Size {item.size}</small>
      </div>
    </Link>
  );
}

export default function SwapCard({ swap, onChange }) {
  const notify = useToast();
  const [busy, setBusy] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const incoming = swap.direction === 'incoming';
  const other = incoming ? swap.requester : swap.owner;
  const myItem = incoming ? swap.requestedListing : swap.offeredListing;
  const theirItem = incoming ? swap.offeredListing : swap.requestedListing;
  const iConfirmed = incoming ? swap.ownerConfirmed : swap.requesterConfirmed;
  const theyConfirmed = incoming ? swap.requesterConfirmed : swap.ownerConfirmed;

  async function executeAction(action) {
    setBusy(action);
    setPendingConfirm(null);
    try {
      const res = await api.post(`/swaps/${swap.id}/${action}`);
      const msgs = {
        accept: 'Swap accepted — both items are now reserved.',
        reject: 'Request declined.',
        cancel: 'Swap cancelled.',
        confirm: res.swap.status === 'completed' ? 'Swap completed! 🎉' : 'Exchange confirmed. Waiting for the other person.',
      };
      notify(msgs[action]);
      onChange?.(res.swap);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  function handleAct(action, confirmTitle, confirmMessage, isDanger = false) {
    if (confirmMessage) {
      setPendingConfirm({ action, title: confirmTitle, message: confirmMessage, isDanger });
    } else {
      executeAction(action);
    }
  }

  return (
    <article className="rw-swap">
      <header className="rw-swap-head d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <StatusBadge status={swap.status} />
          <span className="small text-muted">
            {incoming ? 'Request from' : 'Request to'}{' '}
            <Link to={`/users/${other?.id}`} className="rw-link fw-semibold">
              {other?.name}
            </Link>{' '}
            · {timeAgo(swap.createdAt)}
          </span>
        </div>
        <span className="badge bg-light text-dark border">
          {swap.exchangeMethod === 'undecided' ? '🤝 Decide in chat' : `📦 ${swap.exchangeMethod}`}
        </span>
      </header>

      <div className="rw-swap-body">
        <div className="rw-swap-items">
          <ItemMini item={myItem} caption="You give" badgeBg="bg-secondary-subtle text-dark" />
          <div className="rw-swap-arrow text-center" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </div>
          <ItemMini item={theirItem} caption="You get" badgeBg="bg-success-subtle text-success-emphasis" />
        </div>

        <ValueComparison
          compact
          offeredValue={incoming ? swap.requestedValue : swap.offeredValue}
          requestedValue={incoming ? swap.offeredValue : swap.requestedValue}
          offeredLabel="Yours"
          requestedLabel="Theirs"
        />
      </div>

      {swap.message && (
        <blockquote className="rw-swap-msg my-3">
          “{swap.message}”
        </blockquote>
      )}

      {swap.status === 'accepted' && (
        <div className="p-3 bg-light rounded-3 my-3 border">
          <div className="small fw-semibold text-dark mb-1">Exchange Confirmation Status</div>
          <div className="small text-muted">
            {iConfirmed ? '✓ You confirmed the exchange.' : '• Once you have received the item, confirm below.'}
            <br />
            {theyConfirmed ? `✓ ${other?.name} confirmed.` : `• Waiting for confirmation from ${other?.name}.`}
          </div>
        </div>
      )}

      <footer className="rw-swap-actions">
        <Link to={`/chat/${swap.id}`} className="btn btn-outline-dark btn-sm">
          💬 Open Chat
        </Link>

        {incoming && swap.status === 'pending' && (
          <>
            <button
              type="button"
              className="btn btn-success btn-sm"
              disabled={!!busy}
              onClick={() => handleAct('accept')}
            >
              {busy === 'accept' ? 'Accepting…' : 'Accept Request'}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              disabled={!!busy}
              onClick={() => handleAct('reject', 'Decline Request', 'Are you sure you want to decline this swap request?', true)}
            >
              Decline
            </button>
          </>
        )}

        {!incoming && swap.status === 'pending' && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            disabled={!!busy}
            onClick={() => handleAct('cancel', 'Withdraw Request', 'Are you sure you want to withdraw your swap request?', true)}
          >
            Withdraw Request
          </button>
        )}

        {swap.status === 'accepted' && (
          <>
            {!iConfirmed && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                disabled={!!busy}
                onClick={() => handleAct('confirm', 'Confirm Exchange', 'Confirm you have safely received the item and completed the exchange?')}
              >
                Confirm exchange
              </button>
            )}
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              disabled={!!busy}
              onClick={() => handleAct('cancel', 'Cancel Accepted Swap', 'Cancel this accepted swap? Both items will return to available status.', true)}
            >
              Cancel swap
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowHistory((s) => !s)}
          aria-expanded={showHistory}
        >
          {showHistory ? 'Hide' : 'Show'} timeline
        </button>

        {['accepted', 'completed'].includes(swap.status) && (
          <ReportButton targetType="swap" targetId={swap.id} label="Open dispute" />
        )}
      </footer>

      {showHistory && (
        <ol className="rw-timeline">
          {swap.history.map((h, i) => (
            <li key={i} className="d-flex align-items-center gap-2 mb-2">
              <StatusBadge status={h.status} />
              <span className="small">{h.note}</span>
              <span className="small text-muted ms-auto">· {formatDate(h.at)}</span>
            </li>
          ))}
        </ol>
      )}

      <ConfirmDialog
        isOpen={!!pendingConfirm}
        title={pendingConfirm?.title}
        message={pendingConfirm?.message}
        isDanger={pendingConfirm?.isDanger}
        confirmText={pendingConfirm?.isDanger ? 'Yes, proceed' : 'Confirm'}
        onConfirm={() => pendingConfirm && executeAction(pendingConfirm.action)}
        onCancel={() => setPendingConfirm(null)}
      />
    </article>
  );
}
