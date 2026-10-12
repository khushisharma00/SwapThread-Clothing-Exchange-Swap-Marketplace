import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center" style={{ maxWidth: '640px' }}>
      <div className="rw-panel p-5">
        {/* Friendly Eco Illustration */}
        <div className="mb-4 d-inline-flex align-items-center justify-content-center p-4 rounded-circle" style={{ background: 'var(--rw-sand)', width: '120px', height: '120px' }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 28C12 20 20 14 32 14C44 14 52 20 52 28V36C52 46 44 54 32 54C20 54 12 46 12 36V28Z" fill="#E8E2D2" />
            <path d="M22 28C22 24 26 21 32 21C38 21 42 24 42 28C42 34 38 38 32 38C26 38 22 34 22 28Z" fill="#2F6B4F" fillOpacity="0.2" />
            {/* Sock / Leaf shape */}
            <path d="M28 10C28 6 36 6 36 10V16H28V10Z" fill="#2F6B4F" />
            <path d="M24 26C24 24 28 22 32 22C36 22 40 24 40 26V34C40 38 36 42 32 42C28 42 24 38 24 34V26Z" fill="#2F6B4F" />
            {/* Lost sparkle */}
            <path d="M46 16L48 20L52 22L48 24L46 28L44 24L40 22L44 20L46 16Z" fill="#D97706" />
            <circle cx="18" cy="18" r="3" fill="#2F6B4F" opacity="0.4" />
          </svg>
        </div>

        <span className="badge bg-secondary-subtle text-secondary px-3 py-1 mb-2">404 Error</span>
        <h1 className="rw-hero-title mb-3" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)' }}>
          Like a lost sock, this page went missing
        </h1>
        <p className="text-muted mb-4 lead" style={{ fontSize: '1rem', maxWidth: '440px', margin: '0 auto' }}>
          We looked in every wardrobe drawer, but couldn&apos;t find what you&apos;re looking for. It might have been moved or swapped!
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <Link to="/" className="btn btn-success btn-lg px-4" style={{ minHeight: '44px' }}>
            Back to Home
          </Link>
          <Link to="/listings" className="btn btn-outline-dark btn-lg px-4" style={{ minHeight: '44px' }}>
            Browse Wardrobe
          </Link>
        </div>
      </div>
    </div>
  );
}
