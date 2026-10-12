import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { ErrorAlert, SkeletonGrid } from '../components/ui';

const CATEGORIES = [
  { slug: 'tops', label: 'Tops & Tees', icon: '👚' },
  { slug: 'shirts', label: 'Shirts', icon: '👔' },
  { slug: 'jeans', label: 'Jeans', icon: '👖' },
  { slug: 'dresses', label: 'Dresses', icon: '👗' },
  { slug: 'jackets', label: 'Jackets & Coats', icon: '🧥' },
  { slug: 'ethnic', label: 'Ethnic Wear', icon: '🥻' },
  { slug: 'footwear', label: 'Footwear', icon: '👟' },
  { slug: 'accessories', label: 'Accessories', icon: '👜' },
];

const STEPS = [
  {
    n: '01',
    title: 'List clothes you don’t wear',
    text: 'Snap a few photos, pick brand, size, and condition. ReWear calculates an estimated swap value so comparisons are transparent.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
  },
  {
    n: '02',
    title: 'Discover fair matches nearby',
    text: 'Filter by city, category, or size. Our algorithm suggests fair trades based on equal value — no haggling or price tags.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Chat, exchange, and wear',
    text: 'Propose a swap, agree on details in private chat, and exchange locally or by post. Both confirm on delivery — 100% money-free.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get('/listings', { limit: 8, sort: 'newest' }), []);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="rw-hero">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-12 col-lg-6">
              <span className="rw-eyebrow mb-2">Clothing exchange · No money involved</span>
              <h1 className="rw-display">
                Give your clothes a second life. <em>Swap, don&apos;t shop.</em>
              </h1>
              <p className="rw-lead mb-4">
                ReWear connects conscious fashion lovers to refresh wardrobes directly without buying new. Trade pre-loved pieces with people in your city.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3">
                <Link to="/listings" className="btn btn-success btn-lg justify-content-center">
                  Browse clothes
                </Link>
                <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-outline-dark btn-lg justify-content-center">
                  {user ? '+ List an item' : 'Join for free'}
                </Link>
              </div>

              <ul className="rw-hero-points mb-0">
                <li><span className="rw-hero-point-icon">✓</span> Fair-value estimates</li>
                <li><span className="rw-hero-point-icon">✓</span> Nearby city matching</li>
                <li><span className="rw-hero-point-icon">✓</span> Built-in negotiation chat</li>
              </ul>
            </div>

            <div className="col-12 col-lg-6">
              <div className="rw-hero-art" aria-hidden="true">
                <div className="rw-hero-tile t1">
                  <span>👗</span>
                  <small>Wrap dress<br />est. swap value ₹1,920</small>
                </div>
                <div className="rw-hero-swap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9" />
                    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" />
                    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </div>
                <div className="rw-hero-tile t2">
                  <span>🧥</span>
                  <small>Denim jacket<br />est. swap value ₹1,870</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Grid */}
      <section className="container py-4 py-lg-5" aria-labelledby="cat-shortcuts">
        <div className="d-flex justify-content-between align-items-baseline mb-3">
          <h2 id="cat-shortcuts" className="h4 fw-bold mb-0">Browse by category</h2>
          <Link to="/listings" className="rw-link small">View all categories →</Link>
        </div>
        <div className="rw-cat-grid">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/listings?category=${c.slug}`} className="rw-cat-pill">
              <span className="rw-cat-icon" aria-hidden="true">{c.icon}</span>
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-4 py-lg-5" aria-labelledby="how-title">
        <div className="text-center mb-4 pb-2">
          <span className="rw-eyebrow mb-2">Sustainable & Simple</span>
          <h2 id="how-title" className="rw-section-title mb-2">How ReWear works</h2>
          <p className="rw-lead mx-auto">Three simple steps to swap your way into a refreshed, circular wardrobe.</p>
        </div>
        <div className="row g-4">
          {STEPS.map((s) => (
            <div className="col-12 col-md-4" key={s.n}>
              <div className="rw-step">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="rw-step-n">{s.n}</span>
                  <span className="text-success p-2 bg-success-subtle rounded-3">{s.icon}</span>
                </div>
                <h3 className="h5 fw-bold">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fresh Listings */}
      <section className="container py-4 py-lg-5" aria-labelledby="fresh-title">
        <div className="d-flex justify-content-between align-items-end mb-4">
          <div>
            <span className="rw-eyebrow mb-1">Live from our community</span>
            <h2 id="fresh-title" className="rw-section-title mb-0">Freshly listed garments</h2>
          </div>
          <Link to="/listings" className="btn btn-outline-dark btn-sm">
            Explore all ({data?.total || 35}+) →
          </Link>
        </div>

        {loading && <SkeletonGrid count={8} />}
        <ErrorAlert error={error} onRetry={reload} />

        {!loading && (
          <div className="row g-3 g-md-4">
            {(data?.items || []).map((l) => (
              <div className="col-6 col-md-4 col-lg-3" key={l.id}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sustainability Impact Banner */}
      <section className="container py-4 py-lg-5">
        <div className="rw-impact p-4 p-md-5">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-lg-8">
              <span className="badge bg-white text-dark mb-2 fw-semibold px-3 py-2">🌍 Circular Fashion Impact</span>
              <h2 className="display-6 fw-bold text-white mb-3">Why swapping beats shopping</h2>
              <p className="mb-0 text-white-50 rw-reading-width fs-6">
                Textile waste is one of the world&apos;s fastest growing landfill pollutants. The most sustainable garment is already in someone&apos;s closet. By swapping instead of buying new, you save water, reduce carbon emissions, and keep quality clothing in active rotation.
              </p>
            </div>
            <div className="col-12 col-lg-4 text-lg-end">
              <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-light btn-lg w-100 w-lg-auto fw-bold text-dark">
                {user ? '+ List a pre-loved piece' : 'Start swapping today'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
