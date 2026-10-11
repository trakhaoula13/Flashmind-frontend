import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const RULES = [
  { color: '#F0654E', label: 'À revoir', text: 'revient après 3 ou 4 cartes' },
  { color: '#F2A93B', label: 'Difficile', text: 'revient dans 10 minutes' },
  { color: '#3B8FD9', label: 'Moyen', text: 'revient en fin de journée' },
  { color: '#37A46B', label: 'Facile', text: 'revient dans quelques jours' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="fm-auth">
      <section className="fm-auth-art">
        <div className="fm-brand">
          <span className="fm-brand-mark">
            <i className="bi bi-layers-fill" />
          </span>
          <span>FlashMind</span>
        </div>

        <div className="fm-stack" aria-hidden="true">
          <div className="fm-float fm-float-1">
            <small>albeit</small>
            <strong>although</strong>
          </div>
          <div className="fm-float fm-float-2">
            <small>tenacious</small>
            <strong>persistent</strong>
          </div>
          <div className="fm-float fm-float-3">
            <small>mitigate</small>
            <strong>lessen the effect</strong>
          </div>
        </div>

        <div>
          <h2>Chaque carte revient au bon moment.</h2>
          <ul className="fm-rules">
            {RULES.map((r) => (
              <li key={r.label} style={{ '--c': r.color }}>
                <i />
                <strong>{r.label}</strong>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="fm-auth-form">
        <motion.div
          className="fm-auth-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/login" className="fm-brand d-lg-none mb-4">
            <span className="fm-brand-mark">
              <i className="bi bi-layers-fill" />
            </span>
            <span>FlashMind</span>
          </Link>
          <h1>{title}</h1>
          <p className="text-secondary mb-4">{subtitle}</p>
          {children}
          <p className="fm-auth-foot">{footer}</p>
        </motion.div>
      </section>
    </div>
  );
}
