import { formatValue } from '../utils/format';

/** Side-by-side estimated values with difference and fair-match indication. */
export default function ValueComparison({ offeredValue, requestedValue, offeredLabel = 'You offer', requestedLabel = 'You get', compact = false }) {
  const a = Number(offeredValue) || 0;
  const b = Number(requestedValue) || 0;
  const diff = Math.abs(a - b);
  const higher = Math.max(a, b);
  // Mirrors the server rule: fair when within 20% of the higher value or ₹150.
  const fair = diff <= 150 || diff <= higher * 0.2;
  const pctA = higher ? Math.round((a / higher) * 100) : 0;
  const pctB = higher ? Math.round((b / higher) * 100) : 0;

  return (
    <div className={`rw-compare ${compact ? 'rw-compare-compact' : ''}`}>
      <div className="rw-compare-row">
        <span className="rw-compare-label">{offeredLabel}</span>
        <div className="rw-compare-bar"><span style={{ width: `${pctA}%` }} /></div>
        <strong>{formatValue(a)}</strong>
      </div>
      <div className="rw-compare-row">
        <span className="rw-compare-label">{requestedLabel}</span>
        <div className="rw-compare-bar rw-compare-bar-b"><span style={{ width: `${pctB}%` }} /></div>
        <strong>{formatValue(b)}</strong>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
        <span className={`rw-badge ${fair ? 'rw-badge-green' : 'rw-badge-amber'}`}>{fair ? '✓ Fair match' : 'Values differ'}</span>
        <span className="small">Difference: <strong>{formatValue(diff)}</strong></span>
      </div>
      {!compact && <p className="rw-fineprint mt-2 mb-0">Estimated swap values are suggestions based on category, brand and condition. You both decide whether the exchange is worth it.</p>}
    </div>
  );
}
