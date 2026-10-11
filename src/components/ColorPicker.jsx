export const PALETTE = ['#10A5A0', '#3B8FD9', '#6C5CE7', '#E056A0', '#F0654E', '#F2A93B', '#37A46B', '#5B6B7A'];

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="fm-colors" role="radiogroup" aria-label="Couleur">
      {PALETTE.map((color) => (
        <button
          type="button"
          key={color}
          role="radio"
          aria-checked={value === color}
          aria-label={`Couleur ${color}`}
          className={`fm-swatch ${value === color ? 'is-active' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
        />
      ))}
      <label className="fm-swatch fm-swatch-custom" title="Couleur personnalisée">
        <i className="bi bi-eyedropper" />
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Couleur personnalisée" />
      </label>
    </div>
  );
}
