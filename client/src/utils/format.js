export function formatValue(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
  return `₹${Number(v).toLocaleString('en-IN')}`;
}

export function timeAgo(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export const STATUS_STYLES = {
  available: { label: 'Available', cls: 'rw-badge-green' },
  reserved: { label: 'Reserved', cls: 'rw-badge-amber' },
  swapped: { label: 'Swapped', cls: 'rw-badge-charcoal' },
  removed: { label: 'Removed', cls: 'rw-badge-red' },
  pending: { label: 'Pending', cls: 'rw-badge-amber' },
  accepted: { label: 'Accepted', cls: 'rw-badge-green' },
  rejected: { label: 'Rejected', cls: 'rw-badge-red' },
  cancelled: { label: 'Cancelled', cls: 'rw-badge-muted' },
  completed: { label: 'Completed', cls: 'rw-badge-charcoal' },
  open: { label: 'Open', cls: 'rw-badge-amber' },
  resolved: { label: 'Resolved', cls: 'rw-badge-green' },
  dismissed: { label: 'Dismissed', cls: 'rw-badge-muted' },
  active: { label: 'Active', cls: 'rw-badge-green' },
  suspended: { label: 'Suspended', cls: 'rw-badge-red' },
};

export const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misleading', label: 'Misleading description' },
  { value: 'counterfeit', label: 'Possible counterfeit' },
  { value: 'item_not_as_described', label: 'Item not as described (swap dispute)' },
  { value: 'no_show', label: 'No-show / did not send item' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];
