import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useToast } from '../context/ToastContext';
import { ErrorAlert, Loader, Modal } from './ui';
import ItemImage from './ItemImage';
import ValueComparison from './ValueComparison';
import { formatValue } from '../utils/format';

export default function ProposeSwapModal({ listing, onClose }) {
  const navigate = useNavigate();
  const notify = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get(`/listings/${listing.id}/matches`), [listing.id]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [exchangeMethod, setExchangeMethod] = useState('undecided');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const items = data?.items || [];
  const chosen = items.find((i) => i.listing.id === selected);

  async function submit(e) {
    e.preventDefault();
    if (!selected) {
      setSubmitError('Choose one of your items to offer.');
      return;
    }
    if (message.length > 500) {
      setSubmitError('Message must be 500 characters or fewer.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post('/swaps', { requestedListingId: listing.id, offeredListingId: selected, message: message.trim(), exchangeMethod });
      notify('Swap request sent! You can negotiate in the chat.');
      onClose();
      navigate(`/chat/${res.swap.id}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Propose a swap for “${listing.title}”`} onClose={onClose} size="rw-modal-lg">
      {loading && <Loader label="Loading your items…" />}
      <ErrorAlert error={error} onRetry={reload} />
      {!loading && !error && items.length === 0 && (
        <div className="text-center py-3">
          <p className="mb-3">You need at least one available item to offer in a swap.</p>
          <Link to="/dashboard/listings/new" className="btn btn-success" onClick={onClose}>
            List an item
          </Link>
        </div>
      )}
      {!loading && items.length > 0 && (
        <form onSubmit={submit} noValidate>
          <fieldset>
            <legend className="form-label fw-semibold">1. Choose an item to offer <span className="text-muted fw-normal small">(closest values first)</span></legend>
            <div className="rw-offer-grid">
              {items.map(({ listing: l, comparison }) => (
                <label key={l.id} className={`rw-offer ${selected === l.id ? 'rw-offer-selected' : ''}`}>
                  <input type="radio" name="offered" value={l.id} checked={selected === l.id} onChange={() => setSelected(l.id)} className="visually-hidden" />
                  <ItemImage src={l.images?.[0]} alt={l.title} category={l.category} className="rw-offer-img" />
                  <span className="rw-offer-title">{l.title}</span>
                  <span className="small text-muted">{formatValue(l.estimatedValue)} · {l.conditionLabel}</span>
                  {comparison.isFairMatch && <span className="rw-badge rw-badge-green mt-1">Fair match</span>}
                </label>
              ))}
            </div>
          </fieldset>

          {chosen && (
            <div className="my-3">
              <div className="form-label fw-semibold">2. Value comparison</div>
              <ValueComparison offeredValue={chosen.listing.estimatedValue} requestedValue={listing.estimatedValue} />
            </div>
          )}

          <div className="row g-3 mt-1">
            <div className="col-md-8">
              <label htmlFor="swap-msg" className="form-label fw-semibold">3. Message (optional)</label>
              <textarea id="swap-msg" className="form-control" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I'd love to swap — happy to meet up or ship." />
              <div className="form-text">{message.length}/500</div>
            </div>
            <div className="col-md-4">
              <label htmlFor="swap-method" className="form-label fw-semibold">Exchange</label>
              <select id="swap-method" className="form-select" value={exchangeMethod} onChange={(e) => setExchangeMethod(e.target.value)}>
                <option value="undecided">Decide in chat</option>
                <option value="meetup">Meet locally</option>
                <option value="courier">Courier / ship</option>
              </select>
            </div>
          </div>

          <ErrorAlert error={submitError} />
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-outline-dark" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send swap request'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
