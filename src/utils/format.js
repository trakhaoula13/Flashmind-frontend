export function endOfDay(date = new Date()) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

// Même règle que le backend : 4 jours la première fois, puis x2.5
export function easyDays(card) {
  const current = card?.intervalDays || 0;
  return current >= 1 ? Math.ceil(current * 2.5) : 4;
}

export function relativeDue(date) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'À réviser';
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `Dans ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Dans ${hours} h`;
  return `Dans ${Math.round(hours / 24)} j`;
}

export function greeting() {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 18 ? 'Bonjour' : 'Bonsoir';
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const plural = (n, one, many) => (n > 1 ? many : one);
