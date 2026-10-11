import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import ColorPicker from './ColorPicker.jsx';
import TagInput from './TagInput.jsx';
import { errorMessage } from '../api';

export default function CardModal({ open, card, defaultColor = '#10A5A0', onClose, onSave }) {
  const [form, setForm] = useState({ front: '', back: '', color: defaultColor, tags: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      card
        ? { front: card.front, back: card.back, color: card.color, tags: card.tags || [] }
        : { front: '', back: '', color: defaultColor, tags: [] }
    );
    setError('');
  }, [open, card, defaultColor]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.front.trim() || !form.back.trim()) return setError('Le recto et le verso sont obligatoires.');
    setSaving(true);
    setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={card ? 'Modifier la carte' : 'Nouvelle carte'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="card-front">Recto</label>
          <textarea id="card-front" className="form-control" rows={2} value={form.front} maxLength={1000} autoFocus
            onChange={(e) => set('front')(e.target.value)} placeholder="Ex. mitigate" />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="card-back">Verso</label>
          <textarea id="card-back" className="form-control" rows={3} value={form.back} maxLength={2000}
            onChange={(e) => set('back')(e.target.value)} placeholder="Ex. lessen the effect — Measures to mitigate climate change." />
        </div>
        <div className="mb-3">
          <span className="form-label d-block">Couleur</span>
          <ColorPicker value={form.color} onChange={set('color')} />
        </div>
        <div className="mb-4">
          <span className="form-label d-block">Tags</span>
          <TagInput value={form.tags} onChange={set('tags')} />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : card ? 'Enregistrer' : 'Ajouter la carte'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
