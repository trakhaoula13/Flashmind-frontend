import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cardApi, folderApi, errorMessage } from '../api';
import CardItem from '../components/CardItem.jsx';
import CardModal from '../components/CardModal.jsx';
import FolderModal from '../components/FolderModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ImportModal from '../components/ImportModal.jsx';
import { plural } from '../utils/format.js';

export default function FolderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [folder, setFolder] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const [cardEditing, setCardEditing] = useState(null); // null | 'new' | card
  const [cardDeleting, setCardDeleting] = useState(null);
  const [folderEditing, setFolderEditing] = useState(false);
  const [folderDeleting, setFolderDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([folderApi.get(id), folderApi.cards(id)]);
      setFolder(f);
      setCards(c);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const allTags = useMemo(() => [...new Set(cards.flatMap((c) => c.tags || []))].sort(), [cards]);
  const dueCount = folder?.studyCount || 0; // à réviser aujourd'hui (nouvelles cartes limitées par jour)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter(
      (c) =>
        (!activeTag || c.tags?.includes(activeTag)) &&
        (!q || `${c.front} ${c.back}`.toLowerCase().includes(q))
    );
  }, [cards, query, activeTag]);

  const saveCard = async (form) => {
    if (cardEditing && cardEditing !== 'new') await cardApi.update(cardEditing._id, form);
    else await folderApi.addCard(id, form);
    setCardEditing(null);
    await load();
  };

  const removeCard = async () => {
    setBusy(true);
    try {
      await cardApi.remove(cardDeleting._id);
      setCardDeleting(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
      setCardDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const saveFolder = async (form) => {
    await folderApi.update(id, form);
    setFolderEditing(false);
    await load();
  };

  const removeFolder = async () => {
    setBusy(true);
    try {
      await folderApi.remove(id);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
      setFolderDeleting(false);
      setBusy(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
  if (!folder) {
    return (
      <div className="fm-empty">
        <p className="mb-3">{error || 'Dossier introuvable.'}</p>
        <Link to="/" className="btn btn-primary">Retour au tableau de bord</Link>
      </div>
    );
  }

  return (
    <>
      <Link to="/" className="fm-backlink"><i className="bi bi-chevron-left" /> Tableau de bord</Link>

      <header className="fm-folder-head" style={{ '--tab': folder.color }}>
        <div>
          <h1>{folder.name}</h1>
          {folder.description && <p className="text-secondary mb-2">{folder.description}</p>}
          <div className="fm-tags">
            {folder.tags?.map((t) => <span key={t} className="fm-tag">#{t}</span>)}
          </div>
          <p className="fm-folder-sub">
            {cards.length} {plural(cards.length, 'carte', 'cartes')}
            {folder.newCount > 0 && ` · ${folder.newCount} ${plural(folder.newCount, 'nouvelle', 'nouvelles')}`}
            {dueCount > 0 && <span className="fm-badge-due ms-2">{dueCount} à réviser</span>}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2 align-items-start">
          {dueCount > 0 && <Link to={`/study/${id}`} className="btn btn-primary"><i className="bi bi-lightning-charge-fill me-1" />Réviser</Link>}
          <button type="button" className="btn btn-outline-primary" onClick={() => setCardEditing('new')}>
            <i className="bi bi-plus-lg me-1" />Ajouter une carte
          </button>
          <button type="button" className="btn btn-outline-primary" onClick={() => setImporting(true)}>
            <i className="bi bi-file-earmark-arrow-up me-1" />Importer un CSV
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setFolderEditing(true)} aria-label="Modifier le dossier" title="Modifier le dossier">
            <i className="bi bi-pencil" />
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={() => setFolderDeleting(true)} aria-label="Supprimer le dossier" title="Supprimer le dossier">
            <i className="bi bi-trash3" />
          </button>
        </div>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {cards.length > 0 && (
        <div className="fm-toolbar">
          <div className="fm-search">
            <i className="bi bi-search" />
            <input className="form-control" placeholder="Rechercher une carte" value={query}
              onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher une carte" />
          </div>
          <div className="fm-tags">
            {allTags.map((tag) => (
              <button type="button" key={tag} className={`fm-chip ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}>
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="fm-empty">
          <h3>Ce dossier est vide</h3>
          <p className="text-secondary mb-3">Ajoutez une première carte : saisissez-la à la main, ou importez un fichier CSV pour en créer plusieurs d’un coup. Exemple : un mot au recto, sa définition et un exemple au verso.</p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <button type="button" className="btn btn-primary" onClick={() => setCardEditing('new')}>Ajouter une carte</button>
            <button type="button" className="btn btn-outline-primary" onClick={() => setImporting(true)}>Importer un CSV</button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="fm-empty"><p className="mb-0 text-secondary">Aucune carte ne correspond à votre recherche.</p></div>
      ) : (
        <div className="row g-3">
          <AnimatePresence>
            {visible.map((card) => (
              <motion.div
                key={card._id}
                className="col-12 col-md-6 col-xl-4"
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22 }}
              >
                <CardItem card={card} onEdit={setCardEditing} onDelete={setCardDeleting} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ImportModal
        open={importing}
        onClose={() => setImporting(false)}
        onImport={(list, skipDuplicates) => folderApi.importCards(id, list, skipDuplicates)}
        onDone={load}
      />
      <CardModal
        open={cardEditing !== null}
        card={cardEditing && cardEditing !== 'new' ? cardEditing : null}
        defaultColor={folder.color}
        onClose={() => setCardEditing(null)}
        onSave={saveCard}
      />
      <ConfirmModal
        open={!!cardDeleting}
        title="Supprimer la carte"
        message={cardDeleting ? `La carte « ${cardDeleting.front} » sera supprimée définitivement.` : ''}
        busy={busy}
        onConfirm={removeCard}
        onClose={() => setCardDeleting(null)}
      />
      <FolderModal open={folderEditing} folder={folder} onClose={() => setFolderEditing(false)} onSave={saveFolder} />
      <ConfirmModal
        open={folderDeleting}
        title="Supprimer le dossier"
        message={`Le dossier « ${folder.name} » et ses ${cards.length} carte(s) seront supprimés définitivement.`}
        busy={busy}
        onConfirm={removeFolder}
        onClose={() => setFolderDeleting(false)}
      />
    </>
  );
}
