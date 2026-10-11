import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, TOKEN_KEY } from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Garantit que user.name existe toujours (évite les plantages si la réponse du serveur est différente)
function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const fullName = [raw.firstName, raw.lastName].filter(Boolean).join(' ');
  const name =
    raw.name || raw.username || raw.fullName || raw.fullname || fullName ||
    (raw.email ? String(raw.email).split('@')[0] : '') || 'Utilisateur';
  return { ...raw, name: String(name) };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Restaure la session au chargement
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        const u = normalizeUser(res?.user || res);
        if (u) setUser(u);
        else localStorage.removeItem(TOKEN_KEY);
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Déconnexion automatique si le token expire
  useEffect(() => {
    window.addEventListener('fm:unauthorized', logout);
    return () => window.removeEventListener('fm:unauthorized', logout);
  }, [logout]);

  const startSession = (res) => {
    if (!res?.token) throw new Error('Réponse inattendue du serveur. Vérifiez que le backend FlashMind est bien lancé sur le port 5000.');
    localStorage.setItem(TOKEN_KEY, res.token);
    setUser(normalizeUser(res.user));
  };

  const updateUser = (u) => setUser(normalizeUser(u));

  const login = async (credentials) => startSession(await authApi.login(credentials));
  const register = async (payload) => startSession(await authApi.register(payload));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthContext.Provider>
  );
}
