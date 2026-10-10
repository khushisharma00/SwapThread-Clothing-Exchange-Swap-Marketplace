import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import ItemImage from './ItemImage';
import ValueComparison from './ValueComparison';
import ReportButton from './ReportButton';
import { StatusBadge } from './ui';
import { formatDate, timeAgo } from '../utils/format';

function ItemMini({ item, caption }) {
  return (
    <Link to={`/listings/${item.id}`} className="rw-swap-item">
      <ItemImage src={item.images?.[0]} alt={item.title} category={item.category} />
      <span>
        <small className="text-muted d-block">{caption}</small>
        <strong>{item.title || 'Item'}</strong>
        <small className="d-block text-muted">{item.brand} · {item.size}</small>
      </span>
    </Link>
  );
}

export default function SwapCard({ swap, onChange }) {
  const notify = useToast();
  const [busy, setBusy] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const incoming = swap.direction === 'incoming';
  const other = incoming ? swap.requester : swap.owner;
  const myItem = incoming ? swap.requestedListing : swap.offeredListing;
  const theirItem = incoming ? swap.offeredListing : swap.requestedListing;
  const iConfirmed = incoming ? swap.ownerConfirmed : swap.requesterConfirmed;
  const theyConfirmed = incoming ? swap.requesterConfirmed : swap.ownerConfirmed;

  async function act(action, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(action);
    try {
      const res = await api.post(`/swaps/${swap.id}/${action}`);
      const msgs = { accept: 'Swap accepted — both items are now reserved.', reject: 'Request declined.', cancel: 'Swap cancelled.', confirm: res.swap.status === 'completed' ? 'Swap completed! 🎉' : 'Exchange confirmed. Waiting for the other person.' };
      notify(msgs[action]);
      onChange?.(res.swap);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rw-swap">
      <header className="rw-swap-head">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <StatusBadge status={swap.status} />
          <span className="small text-muted">
            {incoming ? 'Request from' : 'Request to'} <Link to={`/users/${other?.id}`} className="rw-link">{other?.name}</Link> · {timeAgo(swap.createdAt)}
          </span>
        </div>
        <span className="small text-muted text-capitalize">{swap.exchangeMethod === 'undecided' ? 'Exchange: decide in chat' : `Exchange: ${swap.exchangeMethod}`}</span>
      </header>

      <div className="rw-swap-body">
        <div className="rw-swap-items">
          <ItemMini item={myItem} caption="Your item" />
          <span className="rw-swap-arrow" aria-hidden="true">⇄</span>
          <ItemMini item={theirItem} caption="Their item" />
        </div>
        <ValueComparison
          compact
          offeredValue={incoming ? swap.requestedValue : swap.offeredValue}
          requestedValue={incoming ? swap.offeredValue : swap.requestedValue}
          offeredLabel="Yours"
          requestedLabel="Theirs"
        />
      </div>

      {swap.message && <blockquote className="rw-swap-msg">“{swap.message}”</blockquote>}

      {swap.status === 'accepted' && (
        <p className="small mb-2">
          {iConfirmed ? '✓ You confirmed the exchange.' : 'Once you have exchanged items, confirm below.'}{' '}
          {theyConfirmed ? `✓ ${other?.name} confirmed.` : `Waiting for ${other?.name}.`}
        </p>
      )}

      <footer className="rw-swap-actions">
        <Link to={`/chat/${swap.id}`} className="btn btn-outline-dark btn-sm">💬 Chat</Link>
        {incoming && swap.status === 'pending' && (
          <>
            <button type="button" className="btn btn-success btn-sm" disabled={!!busy} onClick={() => act('accept')}>{busy === 'accept' ? 'Accepting…' : 'Accept'}</button>
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={!!busy} onClick={() => act('reject', 'Decline this swap request?')}>Reject</button>
          </>
        )}
        {!incoming && swap.status === 'pending' && (
          <button type="button" className="btn btn-outline-danger btn-sm" disabled={!!busy} onClick={() => act('cancel', 'Withdraw your swap request?')}>Withdraw</button>
        )}
        {swap.status === 'accepted' && (
          <>
            {!iConfirmed && <button type="button" className="btn btn-success btn-sm" disabled={!!busy} onClick={() => act('confirm', 'Confirm you have received the item and the exchange is done?')}>Confirm exchange</button>}
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={!!busy} onClick={() => act('cancel', 'Cancel this accepted swap? Both items will be available again.')}>Cancel swap</button>
          </>
        )}
        <button type="button" className="btn btn-link btn-sm" onClick={() => setShowHistory((s) => !s)} aria-expanded={showHistory}>
          {showHistory ? 'Hide' : 'Show'} timeline
        </button>
        {['accepted', 'completed'].includes(swap.status) && <ReportButton targetType="swap" targetId={swap.id} label="Open dispute" />}
      </footer>

      {showHistory && (
        <ol className="rw-timeline">
          {swap.history.map((h, i) => (
            <li key={i}>
              <StatusBadge status={h.status} /> <span className="small">{h.note}</span> <span className="small text-muted">· {formatDate(h.at)}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
