import { Link } from 'react-router-dom';

export default function FolderTile({ folder, onEdit, onDelete }) {
  const study = folder.studyCount || 0;
  return (
    <article className="fm-folder" style={{ '--tab': folder.color }}>
      <Link to={`/folders/${folder._id}`} className="fm-folder-link">
        <h3>{folder.name}</h3>
        {folder.description && <p className="fm-folder-desc">{folder.description}</p>}
      </Link>

      {folder.tags?.length > 0 && (
        <div className="fm-tags">
          {folder.tags.map((t) => (
            <span key={t} className="fm-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="fm-folder-foot">
        <div className="fm-folder-count">
          <span>
            {folder.cardCount} carte{folder.cardCount > 1 ? 's' : ''}
            {folder.newCount > 0 && ` · ${folder.newCount} nouvelle${folder.newCount > 1 ? 's' : ''}`}
          </span>
          {study > 0 && <span className="fm-badge-due">{study} à réviser</span>}
        </div>
        <div className="d-flex">
          {study > 0 && (
            <Link to={`/study/${folder._id}`} className="fm-icon-btn" aria-label={`Réviser ${folder.name}`} title="Réviser">
              <i className="bi bi-lightning-charge-fill" />
            </Link>
          )}
          <Link to={`/folders/${folder._id}`} className="fm-icon-btn" aria-label={`Ouvrir ${folder.name}`} title="Ouvrir">
            <i className="bi bi-folder2-open" />
          </Link>
          <button type="button" className="fm-icon-btn" onClick={() => onEdit(folder)} aria-label={`Modifier ${folder.name}`} title="Modifier">
            <i className="bi bi-pencil" />
          </button>
          <button type="button" className="fm-icon-btn danger" onClick={() => onDelete(folder)} aria-label={`Supprimer ${folder.name}`} title="Supprimer">
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>
    </article>
  );
}
