import { useState } from 'react';

export default function TagInput({ value = [], onChange, placeholder = 'Ajouter un tag, puis Entrée' }) {
  const [text, setText] = useState('');

  const commit = () => {
    const tag = text.trim().replace(/^#/, '').slice(0, 30);
    setText('');
    if (!tag || value.length >= 10) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !text && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="fm-taginput">
      {value.map((tag) => (
        <span key={tag} className="fm-tag">
          #{tag}
          <button type="button" aria-label={`Retirer le tag ${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}>
            <i className="bi bi-x" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={value.length ? '' : placeholder}
        aria-label="Nouveau tag"
      />
    </div>
  );
}
