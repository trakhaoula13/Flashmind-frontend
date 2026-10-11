import { useState } from 'react';
import { authApi, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const PRESETS = [5, 10, 15, 25, 50];
const emptyPwd = { currentPassword: '', newPassword: '', confirm: '' };

function Message({ msg }) {
  if (!msg) return null;
  return (
    <div className={`alert alert-${msg.type} py-2`} role={msg.type === 'danger' ? 'alert' : 'status'}>
      {msg.text}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [info, setInfo] = useState({
    name: user.name || '',
    email: user.email || '',
    newCardsPerDay: user.newCardsPerDay ?? 15,
  });
  const [infoMsg, setInfoMsg] = useState(null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [pwd, setPwd] = useState(emptyPwd);
  const [pwdMsg, setPwdMsg] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoMsg(null);
    const limit = Number(info.newCardsPerDay);
    if (!info.name.trim()) return setInfoMsg({ type: 'danger', text: 'Le nom est obligatoire.' });
    if (!/^\S+@\S+\.\S+$/.test(info.email.trim())) return setInfoMsg({ type: 'danger', text: 'Email invalide.' });
    if (!Number.isInteger(limit) || limit < 0 || limit > 500) {
      return setInfoMsg({ type: 'danger', text: 'La limite doit être un nombre entier entre 0 et 500.' });
    }
    setSavingInfo(true);
    try {
      const res = await authApi.updateProfile({ name: info.name.trim(), email: info.email.trim(), newCardsPerDay: limit });
      updateUser(res.user);
      setInfo({ name: res.user.name, email: res.user.email, newCardsPerDay: res.user.newCardsPerDay });
      setInfoMsg({ type: 'success', text: 'Profil enregistré.' });
    } catch (err) {
      setInfoMsg({ type: 'danger', text: errorMessage(err) });
    } finally {
      setSavingInfo(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!pwd.currentPassword) return setPwdMsg({ type: 'danger', text: 'Saisissez votre mot de passe actuel.' });
    if (pwd.newPassword.length < 6) return setPwdMsg({ type: 'danger', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    if (pwd.newPassword !== pwd.confirm) return setPwdMsg({ type: 'danger', text: 'Les deux mots de passe ne correspondent pas.' });
    setSavingPwd(true);
    try {
      await authApi.changePassword({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      setPwd(emptyPwd);
      setPwdMsg({ type: 'success', text: 'Mot de passe modifié.' });
    } catch (err) {
      setPwdMsg({ type: 'danger', text: errorMessage(err) });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="fm-profile">
      <h1 className="mb-1">Mon profil</h1>
      <p className="text-secondary mb-4">Modifiez vos informations, votre rythme de révision et votre mot de passe.</p>

      <form className="fm-panel mb-4" onSubmit={saveInfo} noValidate>
        <h2>Informations</h2>
        <Message msg={infoMsg} />
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="p-name">Nom</label>
            <input id="p-name" className="form-control" value={info.name} maxLength={60} autoComplete="name"
              onChange={(e) => setInfo({ ...info, name: e.target.value })} />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="p-email">Email</label>
            <input id="p-email" type="email" className="form-control" value={info.email} autoComplete="email"
              onChange={(e) => setInfo({ ...info, email: e.target.value })} />
          </div>
        </div>

        <h2 className="mt-4">Rythme de révision</h2>
        <label className="form-label" htmlFor="p-limit">Nouvelles cartes par jour</label>
        <div className="fm-limit">
          <input id="p-limit" type="number" min={0} max={500} className="form-control" value={info.newCardsPerDay}
            onChange={(e) => setInfo({ ...info, newCardsPerDay: e.target.value })} />
          <div className="fm-tags">
            {PRESETS.map((n) => (
              <button type="button" key={n} className={`fm-chip ${Number(info.newCardsPerDay) === n ? 'active' : ''}`}
                onClick={() => setInfo({ ...info, newCardsPerDay: n })}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="form-text mb-4">
          Les cartes jamais étudiées arrivent au maximum à ce rythme, même si vous en importez 150 d’un coup.
          Les cartes déjà étudiées ne sont pas limitées. Mettez 0 pour suspendre les nouvelles cartes.
        </div>

        <button type="submit" className="btn btn-primary" disabled={savingInfo}>
          {savingInfo ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <form className="fm-panel" onSubmit={savePassword} noValidate>
        <h2>Mot de passe</h2>
        <Message msg={pwdMsg} />
        <div className="mb-3">
          <label className="form-label" htmlFor="p-current">Mot de passe actuel</label>
          <input id="p-current" type={showPwd ? 'text' : 'password'} className="form-control" autoComplete="current-password"
            value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label" htmlFor="p-new">Nouveau mot de passe</label>
            <input id="p-new" type={showPwd ? 'text' : 'password'} className="form-control" autoComplete="new-password"
              value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
            <div className="form-text">6 caractères minimum.</div>
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="p-confirm">Confirmer</label>
            <input id="p-confirm" type={showPwd ? 'text' : 'password'} className="form-control" autoComplete="new-password"
              value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
          </div>
        </div>
        <div className="form-check mb-4">
          <input id="p-show" type="checkbox" className="form-check-input" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
          <label className="form-check-label" htmlFor="p-show">Afficher les mots de passe</label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={savingPwd}>
          {savingPwd ? 'Modification…' : 'Modifier le mot de passe'}
        </button>
      </form>
    </div>
  );
}
