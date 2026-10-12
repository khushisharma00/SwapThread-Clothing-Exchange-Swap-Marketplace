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
    if (e) e.preventDefault();
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
      const res = await api.post('/swaps', {
        requestedListingId: listing.id,
        offeredListingId: selected,
        message: message.trim(),
        exchangeMethod,
      });
      notify('Swap request sent! You can negotiate in the chat.');
      onClose();
      navigate(`/chat/${res.swap.id}`);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const modalFooter = items.length > 0 ? (
    <div className="d-flex w-100 justify-content-between align-items-center gap-2">
      <button type="button" className="btn btn-outline-dark" onClick={onClose}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn-success flex-grow-1 flex-sm-grow-0"
        disabled={submitting || !selected}
        onClick={submit}
      >
        {submitting ? 'Sending…' : 'Send swap request'}
      </button>
    </div>
  ) : null;

  return (
    <Modal
      title={`Propose a swap for “${listing.title}”`}
      onClose={onClose}
      size="rw-modal-lg"
      footer={modalFooter}
    >
      {loading && <Loader label="Finding matching items from your wardrobe…" />}
      <ErrorAlert error={error} onRetry={reload} />

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-4">
          <div className="display-6 mb-2" aria-hidden="true">👕</div>
          <h3 className="h5 mb-2">No available items</h3>
          <p className="text-muted mb-4">You need at least one available listing in your wardrobe to propose a swap.</p>
          <Link to="/dashboard/listings/new" className="btn btn-success" onClick={onClose}>
            + List an item now
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div>
          <fieldset className="mb-4">
            <legend className="form-label fw-bold mb-2">
              1. Choose an item to offer{' '}
              <span className="text-muted fw-normal small">(sorted by fair-value match)</span>
            </legend>
            <div className="rw-offer-grid">
              {items.map(({ listing: l, comparison }) => (
                <label
                  key={l.id}
                  className={`rw-offer ${selected === l.id ? 'rw-offer-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="offered"
                    value={l.id}
                    checked={selected === l.id}
                    onChange={() => setSelected(l.id)}
                    className="visually-hidden"
                  />
                  <ItemImage src={l.images?.[0]} alt={l.title} category={l.category} className="rw-offer-img" />
                  <span className="rw-offer-title text-truncate">{l.title}</span>
                  <span className="small text-muted">{formatValue(l.estimatedValue)} · {l.conditionLabel}</span>
                  {comparison.isFairMatch ? (
                    <span className="rw-badge rw-badge-green mt-1">✓ Fair match</span>
                  ) : (
                    <span className="rw-badge rw-badge-amber mt-1">Diff ₹{comparison.difference}</span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          {chosen && (
            <div className="mb-4 p-3 bg-light rounded-3 border">
              <div className="form-label fw-bold mb-2">2. Value comparison</div>
              <ValueComparison offeredValue={chosen.listing.estimatedValue} requestedValue={listing.estimatedValue} />
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-8">
              <label htmlFor="swap-msg" className="form-label fw-bold">3. Note to owner (optional)</label>
              <textarea
                id="swap-msg"
                className="form-control"
                rows={3}
                maxLength={500}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'd love to swap with you. Happy to meet locally or ship via courier."
              />
              <div className="form-text text-end">{message.length}/500</div>
            </div>
            <div className="col-12 col-md-4">
              <label htmlFor="swap-method" className="form-label fw-bold">Exchange method</label>
              <select
                id="swap-method"
                className="form-select"
                value={exchangeMethod}
                onChange={(e) => setExchangeMethod(e.target.value)}
              >
                <option value="undecided">Decide in chat</option>
                <option value="meetup">Meet locally</option>
                <option value="courier">Courier / shipping</option>
              </select>
            </div>
          </div>

          <ErrorAlert error={submitError} />
        </div>
      )}
    </Modal>
  );
}
