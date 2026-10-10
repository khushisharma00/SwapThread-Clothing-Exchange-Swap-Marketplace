import { useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { REPORT_REASONS } from '../utils/format';
import { ErrorAlert, Modal } from './ui';

/** Lets a member report a listing/user, or open a dispute on a swap. */
export default function ReportButton({ targetType, targetId, label = 'Report', className = 'btn btn-link btn-sm text-muted' }) {
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(targetType === 'swap' ? 'item_not_as_described' : 'inappropriate');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/reports', { targetType, targetId, reason, details: details.trim() });
      notify('Thanks — our moderators will review this.');
      setOpen(false);
      setDetails('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <Modal title={targetType === 'swap' ? 'Open a dispute' : 'Report to moderators'} onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="mb-3">
              <label htmlFor="report-reason" className="form-label">Reason</label>
              <select id="report-reason" className="form-select" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="report-details" className="form-label">Details (optional)</label>
              <textarea id="report-details" className="form-control" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <ErrorAlert error={error} />
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-dark" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger" disabled={busy}>{busy ? 'Sending…' : 'Submit report'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
