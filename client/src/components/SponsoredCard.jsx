import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Clean, verified sustainable fashion partners (Zero cheap/scam ads)
const VERIFIED_PARTNERS = [
  {
    id: 1,
    title: 'Eco-Wash Laundry Sheets',
    category: 'Garment Care',
    link: '/listings?category=tops',
    badge: 'ECO',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="rw-sponsored-thumb">
        <defs>
          <linearGradient id="g-eco" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="10" fill="url(#g-eco)" />
        <circle cx="60" cy="48" r="24" fill="#ffffff" opacity="0.18" />
        <path d="M60 28 C74 44 80 56 76 66 C70 80 50 80 44 66 C40 56 46 44 60 28 Z" fill="#ecfdf5" />
        <path d="M60 40 L60 68 M60 52 L68 46 M60 58 L52 54" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <text x="60" y="102" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="800" fill="#a7f3d0" textAnchor="middle" letterSpacing="0.5">
          ECO-WASH 🌱
        </text>
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Sashiko Denim Mending Kit',
    category: 'Repair & Upcycle',
    link: '/listings?category=jeans',
    badge: 'MEND',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="rw-sponsored-thumb">
        <defs>
          <linearGradient id="g-mend" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="10" fill="url(#g-mend)" />
        <rect x="22" y="24" width="76" height="52" rx="6" fill="#0f172a" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 3" />
        <circle cx="48" cy="50" r="14" fill="#3b82f6" opacity="0.35" />
        <line x1="36" y1="36" x2="84" y2="64" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="84" cy="64" r="2.5" fill="#60a5fa" />
        <text x="60" y="102" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="800" fill="#bfdbfe" textAnchor="middle" letterSpacing="0.5">
          MEND & CARE 🧵
        </text>
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Zero-Waste Sneaker Restore',
    category: 'Footwear Care',
    link: '/listings?category=footwear',
    badge: 'RESTORE',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="rw-sponsored-thumb">
        <defs>
          <linearGradient id="g-shoe" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#115e59" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="10" fill="url(#g-shoe)" />
        <circle cx="60" cy="48" r="24" fill="#ffffff" opacity="0.15" />
        <path d="M34 56 C34 50 44 44 54 44 L68 44 C76 44 86 52 86 60 L84 64 L36 64 Z" fill="#ccfbf1" />
        <circle cx="44" cy="64" r="3" fill="#0f766e" />
        <circle cx="76" cy="64" r="3" fill="#0f766e" />
        <text x="60" y="102" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="800" fill="#99f6e4" textAnchor="middle" letterSpacing="0.5">
          SNEAKER LAB 👟
        </text>
      </svg>
    ),
  },
  {
    id: 4,
    title: 'Curated 90s Vintage Drop',
    category: 'Vintage Outerwear',
    link: '/listings?category=jackets',
    badge: 'ARCHIVE',
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" className="rw-sponsored-thumb">
        <defs>
          <linearGradient id="g-vin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="10" fill="url(#g-vin)" />
        <circle cx="60" cy="48" r="24" fill="#ffffff" opacity="0.15" />
        <path d="M60 30 C64 30 66 34 62 38 L38 52 L82 52 Z" fill="none" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="60" y="102" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="800" fill="#fde68a" textAnchor="middle" letterSpacing="0.5">
          90s ARCHIVE 🧥
        </text>
      </svg>
    ),
  },
];

// Blocklist of cheap / spammy / vulgar third-party ad networks
const BLOCKED_AD_NETWORKS = [
  'afders.org',
  'bicea.org',
  'arwf.org',
  'adsterra',
  'popads',
  'propellerads',
  'clickadu',
];

export default function SponsoredCard({
  title = 'Recommended Partner',
  description = 'Quality garment care & repair essentials supporting our circular clothing exchange.',
  footer = '🛡️ Cheap ads blocked · Verified sustainable partners',
  className = '',
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Active Cheap Ad Blocker: ensures no external spam ad scripts inject into DOM
  useEffect(() => {
    // 1. Remove any legacy or injected third-party spam script tags
    BLOCKED_AD_NETWORKS.forEach((domain) => {
      const badScripts = document.querySelectorAll(`script[src*="${domain}"]`);
      badScripts.forEach((s) => s.remove());
    });

    // 2. Active DOM guard: intercept any attempts by external libraries to inject cheap scripts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src) {
            const isCheapAd = BLOCKED_AD_NETWORKS.some((domain) => node.src.includes(domain));
            if (isCheapAd) {
              node.remove();
              // eslint-disable-next-line no-console
              console.warn('[AdBlocker] Blocked cheap ad script:', node.src);
            }
          }
        });
      });
    });

    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (isDismissed) {
    return (
      <article className={`rw-sponsored-card ${className} p-3 d-flex flex-column justify-content-center text-center`} style={{ minHeight: '120px' }}>
        <p className="small text-muted mb-2">🛡️ Cheap ad blocked & hidden for this session.</p>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mx-auto py-0 px-2"
          style={{ fontSize: '0.72rem' }}
          onClick={() => setIsDismissed(false)}
        >
          Restore partner view
        </button>
      </article>
    );
  }

  return (
    <article
      className={`rw-sponsored-card ${className}`}
      aria-label="Verified sponsored partner"
      data-testid="sponsored-ad-card"
    >
      {/* Top Header Row with Verified Shield & Dismiss */}
      <div className="rw-sponsored-header mb-2">
        <div className="d-flex align-items-center gap-1">
          <span className="rw-sponsored-pill">SPONSORED</span>
          <span className="badge bg-success-subtle text-success py-1 px-1 font-monospace" style={{ fontSize: '0.58rem' }}>
            🛡️ SAFE
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="rw-sponsored-tag" style={{ fontSize: '0.62rem' }}>VERIFIED</span>
          <button
            type="button"
            className="btn btn-sm p-0 text-muted border-0 lh-1"
            title="Hide this partner card"
            aria-label="Dismiss ad"
            style={{ fontSize: '0.85rem', opacity: 0.6 }}
            onClick={() => setIsDismissed(true)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <div className="rw-sponsored-content-head">
        <h3 className="rw-sponsored-title">{title}</h3>
        <p className="rw-sponsored-desc">{description}</p>
      </div>

      {/* Clean, Verified 4-Item Partner Grid */}
      <div className="rw-sponsored-body">
        <div className="rw-sponsored-grid">
          {VERIFIED_PARTNERS.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="rw-sponsored-item"
              title={`${item.title} (${item.category})`}
            >
              <div className="rw-sponsored-thumb-wrap">
                {item.svg}
              </div>
              <span className="rw-sponsored-item-title">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Footer Note with Safe Status */}
      <div className="rw-sponsored-footer">
        <span className="d-flex align-items-center gap-1">
          {footer}
        </span>
        <span className="font-monospace text-success" style={{ fontSize: '0.65rem' }}>
          ● 0% SPAM
        </span>
      </div>
    </article>
  );
}
