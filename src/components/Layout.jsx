import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const initials =
    String(user.name || '?')
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <div className="fm-shell">
      <aside className="fm-sidebar">
        <Link to="/" className="fm-brand">
          <span className="fm-brand-mark">
            <i className="bi bi-layers-fill" />
          </span>
          <span>FlashMind</span>
        </Link>

        <nav className="fm-nav" aria-label="Navigation principale">
          <NavLink to="/" end className="fm-nav-link">
            <i className="bi bi-grid-1x2" /> Tableau de bord
          </NavLink>
          <NavLink to="/study" className="fm-nav-link">
            <i className="bi bi-lightning-charge" /> Réviser
          </NavLink>
          <NavLink to="/profile" className="fm-nav-link">
            <i className="bi bi-person-circle" /> Mon profil
          </NavLink>
        </nav>

        <div className="fm-user">
          <Link to="/profile" className="fm-user-main" title="Mon profil">
            <span className="fm-avatar">{initials}</span>
            <div className="fm-user-info">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </Link>
          <button type="button" className="fm-icon-btn" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter">
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </aside>

      <main className="fm-main">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
