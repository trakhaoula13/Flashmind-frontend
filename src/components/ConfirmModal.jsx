import Modal from './Modal.jsx';

export default function ConfirmModal({ open, title, message, confirmLabel = 'Supprimer', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="mb-4">{message}</p>
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>
          Annuler
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Suppression…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
