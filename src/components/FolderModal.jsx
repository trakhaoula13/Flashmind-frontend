import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import ColorPicker, { PALETTE } from './ColorPicker.jsx';
import TagInput from './TagInput.jsx';
import { errorMessage } from '../api';

const empty = { name: '', description: '', color: PALETTE[0], tags: [] };

export default function FolderModal({ open, folder, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(
      folder
        ? { name: folder.name, description: folder.description || '', color: folder.color, tags: folder.tags || [] }
        : { ...empty }
    );
    setError('');
  }, [open, folder]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Donnez un nom au dossier.');
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
    <Modal open={open} title={folder ? 'Modifier le dossier' : 'Nouveau dossier'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <div className="mb-3">
          <label className="form-label" htmlFor="folder-name">Nom</label>
          <input id="folder-name" className="form-control" value={form.name} maxLength={80} autoFocus
            onChange={(e) => set('name')(e.target.value)} placeholder="Ex. Anglais B2" />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="folder-desc">Description</label>
          <textarea id="folder-desc" className="form-control" rows={2} value={form.description} maxLength={300}
            onChange={(e) => set('description')(e.target.value)} placeholder="Facultatif" />
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
            {saving ? 'Enregistrement…' : folder ? 'Enregistrer' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
