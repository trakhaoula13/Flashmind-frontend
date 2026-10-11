import { useEffect, useReducer, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cardApi, folderApi, studyApi, errorMessage } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { easyDays, endOfDay, formatCountdown, plural } from '../utils/format.js';

/**
 * Session de révision.
 *  - queue   : cartes à montrer maintenant
 *  - waiting : cartes "Difficile" qui reviennent dans 10 min (dueAt en ms)
 *  - "À revoir" : la carte est réinsérée 3 ou 4 cartes plus loin dans la queue
 */
const initial = { loaded: false, queue: [], waiting: [], done: 0, total: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      return initial;
    case 'load':
      return { ...initial, loaded: true, queue: action.cards, total: action.cards.length };
    case 'tick': {
      const ready = state.waiting.filter((w) => w.dueAt <= action.now);
      if (!ready.length) return state;
      return {
        ...state,
        waiting: state.waiting.filter((w) => w.dueAt > action.now),
        queue: [...state.queue, ...ready.map((w) => w.card)],
      };
    }
    case 'rate': {
      const rest = state.queue.slice(1);
      const card = action.card;
      if (action.rating === 'again') {
        const position = Math.min(action.offset, rest.length);
        const queue = [...rest];
        queue.splice(position, 0, card);
        return { ...state, queue };
      }
      if (action.rating === 'hard') {
        return {
          ...state,
          queue: rest,
          waiting: [...state.waiting, { card, dueAt: new Date(card.dueAt).getTime() }],
        };
      }
      return { ...state, queue: rest, done: state.done + 1 };
    }
    default:
      return state;
  }
}

export default function Study() {
  const { folderId } = useParams();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initial);
  const [folder, setFolder] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    dispatch({ type: 'reset' });
    setFlipped(false);
    setError('');
    (async () => {
      try {
        const [cards, f] = await Promise.all([
          studyApi.due(folderId),
          folderId ? folderApi.get(folderId) : Promise.resolve(null),
        ]);
        if (!alive) return;
        setFolder(f);
        dispatch({ type: 'load', cards });
      } catch (err) {
        if (alive) setError(errorMessage(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [folderId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    dispatch({ type: 'tick', now });
  }, [now]);

  const current = state.queue[0];
  const backTo = folderId ? `/folders/${folderId}` : '/';

  const rate = async (rating) => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const updated = await cardApi.review(current._id, rating, endOfDay().toISOString());
      dispatch({
        type: 'rate',
        rating,
        card: { ...current, ...updated, folder: current.folder },
        offset: 3 + Math.floor(Math.random() * 2), // 3 ou 4 cartes plus tard
      });
      setFlipped(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Raccourcis clavier : Espace = retourner, 1 à 4 = noter
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (!current || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped) {
        const map = { 1: 'again', 2: 'hard', 3: 'medium', 4: 'easy' };
        if (map[e.key]) rate(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (error) {
    return (
      <div className="fm-study">
        <div className="alert alert-danger" role="alert">{error}</div>
        <Link to={backTo} className="btn btn-outline-secondary">Retour</Link>
      </div>
    );
  }
  if (!state.loaded) {
    return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
  }

  const remaining = state.queue.length + state.waiting.length;
  const pct = state.total ? Math.round((state.done / state.total) * 100) : 0;

  return (
    <div className="fm-study">
      <div className="fm-study-top">
        <Link to={backTo} className="fm-icon-btn dark" aria-label="Quitter la session" title="Quitter">
          <i className="bi bi-x-lg" />
        </Link>
        <div className="fm-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <motion.div animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
        </div>
        <span className="fm-study-count">{remaining} {plural(remaining, 'restante', 'restantes')}</span>
      </div>
      {folder && <p className="text-secondary text-center mb-3">{folder.name}</p>}

      {state.total === 0 ? (
        <div className="fm-empty">
          <h3>Aucune carte à réviser</h3>
          <p className="text-secondary mb-3">
            Les cartes déjà étudiées reviendront à la date choisie par vos notes. Les nouvelles cartes sont limitées à{' '}
            {user?.newCardsPerDay ?? 15} par jour.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <Link to={backTo} className="btn btn-primary">Retour</Link>
            <Link to="/profile" className="btn btn-outline-secondary">Changer la limite</Link>
          </div>
        </div>
      ) : current ? (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={current._id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
            >
              <div
                className="fm-flip"
                style={{ '--accent': current.color }}
                onClick={() => setFlipped((f) => !f)}
                role="button"
                tabIndex={0}
                aria-label="Retourner la carte"
                onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
              >
                <motion.div
                  className="fm-flip-inner"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                >
                  <div className="fm-face fm-front">
                    <div className="fm-tags justify-content-center mb-3">
                      {!current.reviews && <span className="fm-tag fm-tag-new">Nouvelle</span>}
                      {current.tags?.map((t) => <span key={t} className="fm-tag">#{t}</span>)}
                    </div>
                    <div className="fm-face-big">{current.front}</div>
                    <span className="fm-face-hint">Cliquez ou appuyez sur Espace pour voir la réponse</span>
                  </div>
                  <div className="fm-face fm-back">
                    <div className="fm-face-answer">{current.back}</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4">
            {!flipped ? (
              <button type="button" className="btn btn-primary btn-lg w-100" onClick={() => setFlipped(true)}>
                Afficher la réponse
              </button>
            ) : (
              <div className="fm-rates">
                <button type="button" className="fm-rate" style={{ '--c': '#F0654E' }} disabled={busy} onClick={() => rate('again')}>
                  À revoir<small>3-4 cartes</small>
                </button>
                <button type="button" className="fm-rate" style={{ '--c': '#D98A0F' }} disabled={busy} onClick={() => rate('hard')}>
                  Difficile<small>10 min</small>
                </button>
                <button type="button" className="fm-rate" style={{ '--c': '#3B8FD9' }} disabled={busy} onClick={() => rate('medium')}>
                  Moyen<small>Fin de journée</small>
                </button>
                <button type="button" className="fm-rate" style={{ '--c': '#2C9160' }} disabled={busy} onClick={() => rate('easy')}>
                  Facile<small>{easyDays(current)} jours</small>
                </button>
              </div>
            )}
          </div>
        </>
      ) : state.waiting.length > 0 ? (
        <div className="fm-empty">
          <h3>Pause avant les cartes difficiles</h3>
          <div className="fm-countdown">
            {formatCountdown(Math.min(...state.waiting.map((w) => w.dueAt)) - now)}
          </div>
          <p className="text-secondary mb-3">
            {state.waiting.length} {plural(state.waiting.length, 'carte revient', 'cartes reviennent')} automatiquement ici.
          </p>
          <Link to={backTo} className="btn btn-outline-secondary">Terminer la session</Link>
        </div>
      ) : (
        <motion.div className="fm-empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div
            className="fm-done-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
          >
            <i className="bi bi-check-lg" />
          </motion.div>
          <h3>Session terminée</h3>
          <p className="text-secondary mb-3">{state.done} {plural(state.done, 'carte révisée', 'cartes révisées')}.</p>
          <Link to={backTo} className="btn btn-primary">Retour</Link>
        </motion.div>
      )}
    </div>
  );
}
