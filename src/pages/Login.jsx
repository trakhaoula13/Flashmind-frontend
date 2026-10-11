import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouvez vos dossiers et vos cartes à réviser."
      footer={<>Pas encore de compte ? <Link to="/register">Créer un compte</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="email">Email</label>
          <input id="email" type="email" className="form-control form-control-lg" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mb-4">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <input id="password" type="password" className="form-control form-control-lg" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={busy}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthShell>
  );
}
