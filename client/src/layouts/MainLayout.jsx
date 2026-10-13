import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Logo, ThemeToggle } from '../components/ui';

function NavItem({ to, children, end }) {
  return (
    <li className="nav-item">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
      >
        {children}
      </NavLink>
    </li>
  );
}

export default function MainLayout() {
  const { user, isAdmin, logout } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    notify('You have been logged out.');
    navigate('/');
  }

  return (
    <div className="rw-shell">
      <a href="#main" className="visually-hidden-focusable rw-skip">
        Skip to main content
      </a>

      {/* Top Navbar */}
      <header className="rw-nav">
        <nav className="navbar navbar-expand-xl container" aria-label="Main navigation">
          <Link to="/" className="navbar-brand py-0 me-3" aria-label="ReWear homepage">
            <Logo />
          </Link>

          <div className="d-flex align-items-center gap-2 ms-auto d-xl-none">
            <ThemeToggle size="sm" />
            <button
              className="navbar-toggler border-0 p-2 shadow-none"
              type="button"
              aria-controls="rw-navbar"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {open ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className={`collapse navbar-collapse ${open ? 'show' : ''}`} id="rw-navbar">
            <ul className="navbar-nav me-auto mb-3 mb-xl-0">
              <NavItem to="/listings">Browse</NavItem>
              {user && <NavItem to="/profile">Nearby</NavItem>}
              {user && <NavItem to="/swaps">Swaps</NavItem>}
              {user && <NavItem to="/chat">Chat</NavItem>}
              {user && <NavItem to="/dashboard" end>Dashboard</NavItem>}
              {isAdmin && <NavItem to="/admin">Admin</NavItem>}
            </ul>

            <div className="d-flex flex-column flex-xl-row gap-2 align-items-stretch align-items-xl-center pt-2 pt-xl-0 border-top border-xl-0">
              <ThemeToggle className="d-none d-xl-inline-flex me-1" />
              {user ? (
                <>
                  <Link to="/dashboard/listings/new" className="btn btn-success btn-sm w-100 w-xl-auto justify-content-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>List an item</span>
                  </Link>

                  <div className="d-flex align-items-center justify-content-between justify-content-xl-start gap-2 pt-2 pt-xl-0">
                    <Link to="/profile" className="rw-nav-user" aria-label="Your profile">
                      <Avatar user={user} size={32} />
                      <span className="fw-semibold text-truncate" style={{ maxWidth: '120px' }}>
                        {user.name.split(' ')[0]}
                      </span>
                    </Link>
                    <button type="button" className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-dark btn-sm text-center">
                    Log in
                  </Link>
                  <Link to="/register" className="btn btn-success btn-sm text-center">
                    Join ReWear
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main id="main" className={`rw-main ${user ? 'has-bottom-bar' : ''}`}>
        <Outlet />
      </main>

      {/* Sticky Bottom Tab Bar for Mobile Users (< 768px) */}
      {user && (
        <nav className="rw-bottom-bar" aria-label="Mobile quick navigation">
          <NavLink
            to="/listings"
            className={({ isActive }) => `rw-tab-btn ${isActive ? 'active' : ''}`}
            aria-label="Browse clothes"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Browse</span>
          </NavLink>

          <NavLink
            to="/swaps"
            className={({ isActive }) => `rw-tab-btn ${isActive ? 'active' : ''}`}
            aria-label="Swap requests"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            <span>Swaps</span>
          </NavLink>

          <Link
            to="/dashboard/listings/new"
            className="rw-tab-btn rw-tab-btn-primary"
            aria-label="List a new item"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>

          <NavLink
            to="/chat"
            className={({ isActive }) => `rw-tab-btn ${isActive ? 'active' : ''}`}
            aria-label="Negotiation chat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Chat</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `rw-tab-btn ${isActive ? 'active' : ''}`}
            aria-label="My profile"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </NavLink>
        </nav>
      )}

      {/* Footer */}
      <footer className="rw-footer">
        <div className="container">
          <div className="row g-4 g-lg-5">
            <div className="col-12 col-md-5">
              <Logo light />
              <p className="mt-3 mb-0 rw-reading-width opacity-85">
                Swap, don&apos;t shop. ReWear helps people exchange pre-loved clothes directly — no payments, no waste, just better wardrobes.
              </p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="rw-footer-h">Explore</h2>
              <ul className="list-unstyled mb-0">
                <li><Link to="/listings">Browse clothes</Link></li>
                <li><a href="/#reviews">Community Reviews</a></li>
                <li><a href="/#faq">Q&amp;A / FAQ</a></li>
                <li><Link to="/dashboard/listings/new">List an item</Link></li>
                <li><Link to="/login">Sign in</Link></li>
              </ul>
            </div>
            <div className="col-6 col-md-4">
              <h2 className="rw-footer-h">Community &amp; Values</h2>
              <p className="small mb-2 opacity-85">
                Every garment is assigned an <strong>estimated swap value</strong> based on category, brand tier, and condition. These are fair-match benchmarks — not prices.
              </p>
              <div className="d-flex flex-wrap gap-2 pt-1">
                <a href="/#faq" className="badge bg-light text-dark text-decoration-none">Q&amp;A / FAQ</a>
                <a href="/#reviews" className="badge bg-light text-dark text-decoration-none">★ 4.9 Swapper Reviews</a>
              </div>
            </div>
          </div>
          <div className="rw-footer-bottom d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span>© {new Date().getFullYear()} ReWear · Built for sustainable clothing exchange</span>
            <span className="opacity-75">100% money-free swapping</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
