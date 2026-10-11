import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { relativeDue } from '../utils/format.js';

export default function CardItem({ card, onEdit, onDelete }) {
  const [showBack, setShowBack] = useState(false);
  const isNew = !card.reviews;
  const due = !isNew && new Date(card.dueAt) <= new Date();

  return (
    <article className="fm-card-item" style={{ '--accent': card.color }}>
      <button
        type="button"
        className="fm-card-face"
        onClick={() => setShowBack((v) => !v)}
        aria-label={showBack ? 'Afficher le recto' : 'Afficher le verso'}
      >
        <span className="fm-face-side">{showBack ? 'Verso' : 'Recto'}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={showBack ? 'back' : 'front'}
            className="fm-face-text"
            initial={{ rotateX: -70, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 70, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            {showBack ? card.back : card.front}
          </motion.span>
        </AnimatePresence>
      </button>

      <div className="fm-card-meta">
        <div className="fm-tags">
          {card.tags?.map((t) => (
            <span key={t} className="fm-tag">#{t}</span>
          ))}
        </div>
        <span className={`fm-due ${due ? 'is-due' : ''}`}>{isNew ? 'Nouvelle' : relativeDue(card.dueAt)}</span>
      </div>

      <div className="fm-card-actions">
        <button type="button" className="fm-icon-btn" onClick={() => onEdit(card)} aria-label="Modifier la carte" title="Modifier">
          <i className="bi bi-pencil" />
        </button>
        <button type="button" className="fm-icon-btn danger" onClick={() => onDelete(card)} aria-label="Supprimer la carte" title="Supprimer">
          <i className="bi bi-trash3" />
        </button>
      </div>
    </article>
  );
}
