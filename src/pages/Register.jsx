import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api';

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Vos dossiers et vos cartes sont privés et liés à votre compte."
      footer={<>Déjà inscrit ? <Link to="/login">Se connecter</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="name">Nom</label>
          <input id="name" className="form-control form-control-lg" autoComplete="name" required
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control form-control-lg" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <input id="password" type="password" className="form-control form-control-lg" autoComplete="new-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="form-text">6 caractères minimum.</div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={busy}>
          {busy ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthShell>
  );
}
