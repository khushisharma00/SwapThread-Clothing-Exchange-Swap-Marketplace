import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Logo } from '../components/ui';

function NavItem({ to, children, end }) {
  return (
    <li className="nav-item">
      <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
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
      <a href="#main" className="visually-hidden-focusable rw-skip">Skip to content</a>
      <header className="rw-nav">
        <nav className="navbar navbar-expand-lg container" aria-label="Main navigation">
          <Link to="/" className="navbar-brand">
            <Logo />
          </Link>
          <button className="navbar-toggler" type="button" aria-controls="rw-navbar" aria-expanded={open} aria-label="Toggle navigation" onClick={() => setOpen((o) => !o)}>
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${open ? 'show' : ''}`} id="rw-navbar">
            <ul className="navbar-nav me-auto">
              <NavItem to="/listings">Browse</NavItem>
              {user && <NavItem to="/profile">Nearby</NavItem>}
              {user && <NavItem to="/swaps">Swaps</NavItem>}
              {user && <NavItem to="/chat">Chat</NavItem>}
              {user && <NavItem to="/dashboard" end>Dashboard</NavItem>}
              {isAdmin && <NavItem to="/admin">Admin</NavItem>}
            </ul>
            <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
              {user ? (
                <>
                  <Link to="/dashboard/listings/new" className="btn btn-success btn-sm">+ List an item</Link>
                  <Link to="/profile" className="rw-nav-user" aria-label="Your profile">
                    <Avatar user={user} size={32} />
                    <span className="d-lg-none d-xl-inline">{user.name.split(' ')[0]}</span>
                  </Link>
                  <button type="button" className="btn btn-outline-dark btn-sm" onClick={handleLogout}>Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-dark btn-sm">Log in</Link>
                  <Link to="/register" className="btn btn-success btn-sm">Join ReWear</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main id="main" className="rw-main">
        <Outlet />
      </main>

      <footer className="rw-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-5">
              <Logo light />
              <p className="mt-3 mb-0">Swap, don&apos;t shop. ReWear helps people exchange pre-loved clothes directly — no payments, less textile waste.</p>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="rw-footer-h">Explore</h2>
              <ul className="list-unstyled">
                <li><Link to="/listings">Browse clothes</Link></li>
                <li><Link to="/profile">Nearby swaps</Link></li>
                <li><Link to="/dashboard/listings/new">List an item</Link></li>
              </ul>
            </div>
            <div className="col-6 col-md-4">
              <h2 className="rw-footer-h">How values work</h2>
              <p className="small mb-0">Estimated swap values are calculated from category, brand and condition. They&apos;re suggestions for comparing items — never prices.</p>
            </div>
          </div>
          <div className="rw-footer-bottom">© {new Date().getFullYear()} ReWear · Built for sustainable fashion</div>
        </div>
      </footer>
    </div>
  );
}
