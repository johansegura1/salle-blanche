import { createContext, useContext, useState, type ReactNode } from 'react';
import * as api from '../api';
import { decodePayload, isValid, type JwtPayload } from './jwt';

/** Where the token is kept: DevTools → Application → Local Storage, under this key. */
export const TOKEN_KEY = 'token';

/** What every component under <AuthProvider> can ask for, with useAuth(). */
export interface Auth {
  /** The raw token, for the Authorization header. null: logged out. */
  token: string | null;
  /** Who is logged in, read from the payload of the token. null: logged out. */
  user: JwtPayload | null;
  /** Demande un token à l'API, le garde, et renvoie qui s'est connecté. Laisse passer l'ApiError : 401 pour un mauvais mot de passe. */
  login: (username: string, password: string) => Promise<JwtPayload | null>;
  /** Forgets the token. */
  logout: () => void;
}

/**
 * Given. A context shares a value with every component below its provider,
 * however deep, without passing it down as props through every level.
 */
const AuthContext = createContext<Auth | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * The logged-in user, for the whole app: main.tsx puts it around <App />.
 *
 * The token lives in two places. In a state, so that React redraws the page
 * when it changes. In localStorage, so that it survives a reload: the state
 * starts from what localStorage holds.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [storedToken, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // Calculé à chaque rendu à partir du token. Un token expiré compte comme
  // une déconnexion : RequireAuth renvoie alors vers la connexion.
  const payload = storedToken ? decodePayload(storedToken) : null;
  const user = isValid(payload) ? payload : null;
  const token = user ? storedToken : null;

  const login = async (username: string, password: string) => {
    // A wrong password throws here, before anything is kept: the page shows the error.
    const newToken = await api.login(username, password);
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    return decodePayload(newToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return <AuthContext value={{ token, user, login, logout }}>{children}</AuthContext>;
};

/** Given. The logged-in user, from any component under <AuthProvider>. */
export const useAuth = (): Auth => {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return auth;
};
