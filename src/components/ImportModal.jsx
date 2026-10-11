import { useState } from 'react';
import Modal from './Modal.jsx';
import { parseCards, TEMPLATE_CSV } from '../utils/csv.js';
import { errorMessage } from '../api';

const BATCH = 500;

export default function ImportModal({ open, onClose, onImport, onDone }) {
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  const close = () => {
    setFileName('');
    setParsed(null);
    setError('');
    setResult(null);
    setBusy(false);
    setDragging(false);
    onClose();
  };

  const readFile = async (file) => {
    if (!file) return;
    setError('');
    setResult(null);
    if (file.size > 3 * 1024 * 1024) {
      setParsed(null);
      return setError('Fichier trop volumineux (3 Mo maximum).');
    }
    try {
      const res = parseCards(await file.text());
      setFileName(file.name);
      setParsed(res);
      if (!res.cards.length) {
        setError('Aucune carte valide trouvée : chaque ligne doit contenir au moins un recto et un verso.');
      }
    } catch (err) {
      setParsed(null);
      setError('Impossible de lire ce fichier.');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-flashmind.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (!parsed?.cards.length) return;
    setBusy(true);
    setError('');
    let created = 0;
    let skipped = parsed.ignored;
    try {
      for (let i = 0; i < parsed.cards.length; i += BATCH) {
        const res = await onImport(parsed.cards.slice(i, i + BATCH), skipDuplicates);
        created += res.created;
        skipped += res.skipped;
      }
      setResult({ created, skipped });
      setParsed(null);
      setFileName('');
      await onDone();
    } catch (err) {
      setError(errorMessage(err));
      if (created) await onDone();
    } finally {
      setBusy(false);
    }
  };

  const preview = parsed?.cards.slice(0, 5) || [];

  return (
    <Modal open={open} title="Importer des cartes (CSV)" onClose={close}>
      {result ? (
        <>
          <div className="alert alert-success" role="status">
            <strong>{result.created}</strong> carte{result.created > 1 ? 's' : ''} importée{result.created > 1 ? 's' : ''}.
            {result.skipped > 0 && <> {result.skipped} ligne{result.skipped > 1 ? 's' : ''} ignorée{result.skipped > 1 ? 's' : ''} (vides ou doublons).</>}
          </div>
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-primary" onClick={close}>Terminer</button>
          </div>
        </>
      ) : (
        <>
          {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

          <label
            className={`fm-drop ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files?.[0]); }}
          >
            <i className="bi bi-file-earmark-arrow-up" />
            <span>{fileName || 'Glissez un fichier ici ou cliquez pour le choisir'}</span>
            <small>.csv, .tsv ou .txt (export Anki)</small>
            <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={(e) => readFile(e.target.files?.[0])} />
          </label>

          <p className="fm-import-help">
            Colonnes : <strong>recto</strong>, <strong>verso</strong>, puis <em>tags</em> et <em>couleur</em> (facultatifs).
            Séparateur : virgule, point-virgule ou tabulation. Une première ligne d’en-tête est acceptée.{' '}
            <button type="button" className="btn btn-link p-0 align-baseline" onClick={downloadTemplate}>Télécharger un modèle</button>
          </p>

          {parsed?.cards.length > 0 && (
            <>
              <p className="fw-semibold mb-2">
                {parsed.cards.length} carte{parsed.cards.length > 1 ? 's' : ''} prête{parsed.cards.length > 1 ? 's' : ''} à importer
                {parsed.ignored > 0 && <span className="text-secondary fw-normal"> · {parsed.ignored} ligne(s) ignorée(s)</span>}
              </p>
              <div className="fm-preview">
                <table className="table table-sm mb-0">
                  <thead><tr><th>Recto</th><th>Verso</th><th>Tags</th></tr></thead>
                  <tbody>
                    {preview.map((c, i) => (
                      <tr key={i}>
                        <td>{c.front}</td>
                        <td>{c.back.replace(/\s+/g, ' ').slice(0, 70)}{c.back.length > 70 ? '…' : ''}</td>
                        <td>{(c.tags || []).map((t) => `#${t}`).join(' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsed.cards.length > preview.length && (
                <p className="text-secondary small mt-1 mb-0">… et {parsed.cards.length - preview.length} autre(s).</p>
              )}
              <div className="form-check mt-3">
                <input id="skip-dup" className="form-check-input" type="checkbox" checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)} />
                <label className="form-check-label" htmlFor="skip-dup">Ignorer les mots déjà présents dans ce dossier</label>
              </div>
            </>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={close}>Annuler</button>
            <button type="button" className="btn btn-primary" onClick={runImport} disabled={busy || !parsed?.cards.length}>
              {busy ? 'Importation…' : parsed?.cards.length ? `Importer ${parsed.cards.length} carte${parsed.cards.length > 1 ? 's' : ''}` : 'Importer'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
