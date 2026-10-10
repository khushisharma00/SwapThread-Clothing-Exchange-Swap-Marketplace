import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import { ErrorAlert, Loader } from '../components/ui';

const STEPS = [
  { n: '01', title: 'List what you no longer wear', text: 'Add photos, brand, size and condition. ReWear estimates a swap value so everyone compares fairly.' },
  { n: '02', title: 'Find something you love', text: 'Browse by category, size and city — or see fair matches near you.' },
  { n: '03', title: 'Propose, chat, swap', text: 'Offer one of your items, negotiate in chat, then meet locally or courier. Both confirm — done.' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get('/listings', { limit: 8, sort: 'newest' }), []);

  return (
    <>
      <section className="rw-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="rw-eyebrow">Clothing exchange · no payments</span>
              <h1 className="rw-display">Give your clothes a second life. <em>Swap, don&apos;t shop.</em></h1>
              <p className="rw-lead">ReWear connects people who want to refresh their wardrobe without buying new. Trade pre-loved pieces directly with members near you.</p>
              <div className="d-flex flex-wrap gap-2 mt-4">
                <Link to="/listings" className="btn btn-success btn-lg">Browse clothes</Link>
                <Link to={user ? '/dashboard/listings/new' : '/register'} className="btn btn-outline-dark btn-lg">
                  {user ? 'List an item' : 'Join for free'}
                </Link>
              </div>
              <ul className="rw-hero-points">
                <li>✓ Fair-value estimates</li>
                <li>✓ Nearby matching</li>
                <li>✓ Built-in negotiation chat</li>
              </ul>
            </div>
            <div className="col-lg-6">
              <div className="rw-hero-art" aria-hidden="true">
                <div className="rw-hero-tile t1"><span>👗</span><small>Wrap dress<br />est. ₹1,920</small></div>
                <div className="rw-hero-swap">⇄</div>
                <div className="rw-hero-tile t2"><span>🧥</span><small>Denim jacket<br />est. ₹1,870</small></div>
                <div className="rw-hero-badge">✓ Fair match</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5" aria-labelledby="how-title">
        <h2 id="how-title" className="rw-section-title">How ReWear works</h2>
        <div className="row g-4 mt-1">
          {STEPS.map((s) => (
            <div className="col-md-4" key={s.n}>
              <div className="rw-step">
                <span className="rw-step-n">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-5" aria-labelledby="fresh-title">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h2 id="fresh-title" className="rw-section-title mb-0">Freshly listed</h2>
          <Link to="/listings" className="rw-link">See all →</Link>
        </div>
        {loading && <Loader />}
        <ErrorAlert error={error} onRetry={reload} />
        <div className="row g-3">
          {(data?.items || []).map((l) => (
            <div className="col-6 col-md-4 col-lg-3" key={l.id}>
              <ListingCard listing={l} />
            </div>
          ))}
        </div>
      </section>

      <section className="rw-impact">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <h2 className="rw-section-title text-white">Why swapping matters</h2>
              <p className="mb-0">Fast fashion has made clothes cheap to buy and easy to throw away. Most wardrobes hold pieces that are in great condition but rarely worn. Every swap keeps a garment in use for longer and means one less new purchase.</p>
            </div>
            <div className="col-lg-5 text-lg-end">
              <Link to={user ? '/profile' : '/register'} className="btn btn-light btn-lg">{user ? 'See swaps near you' : 'Start swapping'}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
