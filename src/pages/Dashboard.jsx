import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { folderApi, studyApi, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import FolderTile from '../components/FolderTile.jsx';
import FolderModal from '../components/FolderModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { greeting, plural } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const [editing, setEditing] = useState(null); // null | 'new' | folder
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, s] = await Promise.all([folderApi.list(), studyApi.stats()]);
      setFolders(f);
      setStats(s);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => [...new Set(folders.flatMap((f) => f.tags || []))].sort(), [folders]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return folders.filter(
      (f) =>
        (!activeTag || f.tags?.includes(activeTag)) &&
        (!q || `${f.name} ${f.description || ''}`.toLowerCase().includes(q))
    );
  }, [folders, query, activeTag]);

  const saveFolder = async (form) => {
    if (editing && editing !== 'new') await folderApi.update(editing._id, form);
    else await folderApi.create(form);
    setEditing(null);
    await load();
  };

  const removeFolder = async () => {
    setBusy(true);
    try {
      await folderApi.remove(deleting._id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const due = stats?.dueNow || 0;
  let heroText = '';
  if (stats) {
    if (due > 0) {
      heroText = `${stats.reviewDue} à revoir et ${stats.newAvailable} ${plural(stats.newAvailable, 'nouvelle', 'nouvelles')} aujourd’hui.`;
    } else if (stats.newTotal > 0) {
      heroText = 'Vous avez atteint votre limite de nouvelles cartes pour aujourd’hui. Revenez demain ou augmentez la limite.';
    } else {
      heroText = 'Ajoutez des cartes ou revenez plus tard : les prochaines révisions arrivent selon vos notes.';
    }
  }
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <section className="fm-hero">
        <div>
          <p className="fm-hero-hello">{greeting()}, {firstName}</p>
          <h1>{due > 0 ? `${due} ${plural(due, 'carte', 'cartes')} à réviser` : 'Tout est à jour'}</h1>
          <p>
            {heroText}{' '}
            {stats && (
              <>
                Limite de nouvelles cartes : {stats.newLimit} par jour.{' '}
                <Link to="/profile" className="fm-hero-link">Modifier</Link>
              </>
            )}
          </p>
          <div className="d-flex gap-2 flex-wrap">
            {due > 0 ? (
              <Link to="/study" className="btn btn-light btn-lg">Commencer la révision</Link>
            ) : (
              <span className="btn btn-light btn-lg disabled" aria-disabled="true">Rien à réviser</span>
            )}
            <button type="button" className="btn btn-outline-light btn-lg" onClick={() => setEditing('new')}>
              Nouveau dossier
            </button>
          </div>
        </div>
        <div className="fm-hero-stats">
          <div><strong>{stats?.totalFolders ?? '–'}</strong><span>dossiers</span></div>
          <div><strong>{stats?.totalCards ?? '–'}</strong><span>cartes</span></div>
          <div><strong>{stats?.reviewedToday ?? '–'}</strong><span>révisées aujourd’hui</span></div>
        </div>
      </section>

      {error && <div className="alert alert-danger mt-4" role="alert">{error}</div>}

      <div className="fm-toolbar">
        <div className="fm-search">
          <i className="bi bi-search" />
          <input className="form-control" placeholder="Rechercher un dossier" value={query}
            onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher un dossier" />
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

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
      ) : folders.length === 0 ? (
        <div className="fm-empty">
          <h3>Créez votre premier dossier</h3>
          <p className="text-secondary mb-3">Un dossier regroupe des cartes sur un même sujet : un chapitre, une langue, un examen.</p>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>Nouveau dossier</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="fm-empty"><p className="mb-0 text-secondary">Aucun dossier ne correspond à votre recherche.</p></div>
      ) : (
        <div className="row g-4">
          <AnimatePresence>
            {visible.map((folder, i) => (
              <motion.div
                key={folder._id}
                className="col-12 col-md-6 col-xxl-4"
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, delay: Math.min(i, 8) * 0.05 }}
              >
                <FolderTile folder={folder} onEdit={setEditing} onDelete={setDeleting} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FolderModal
        open={editing !== null}
        folder={editing && editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)}
        onSave={saveFolder}
      />
      <ConfirmModal
        open={!!deleting}
        title="Supprimer le dossier"
        message={deleting ? `Le dossier « ${deleting.name} » et ses ${deleting.cardCount} carte(s) seront supprimés définitivement.` : ''}
        busy={busy}
        onConfirm={removeFolder}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
