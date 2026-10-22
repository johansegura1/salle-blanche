import type { Role } from '../types';

/** Ce que porte le token de l'API : les champs de `JwtPayload` côté API, plus les dates. */
export interface JwtPayload {
  /** L'id de l'utilisateur : la convention JWT */
  sub: string;
  username: string;
  name: string;
  role: Role;
  /** Émis à, en secondes depuis 1970 */
  iat: number;
  /** Expire à, en secondes depuis 1970 */
  exp: number;
}

/**
 * Lit le payload d'un JWT (la partie entre les deux points), ou null si on ne
 * peut pas le lire. Le payload n'est pas secret : il est encodé, pas chiffré.
 * Le front le lit pour afficher qui est connecté, et ne lui fait confiance
 * pour rien d'autre : l'API vérifie la signature à chaque requête.
 */
export function decodePayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // atob donne des octets ; TextDecoder les relit en UTF-8, pour les accents de « Léa ».
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtPayload;
  } catch {
    return null;
  }
}

/** Un token encore valable : lisible, et pas expiré. */
export function isValid(payload: JwtPayload | null): payload is JwtPayload {
  return payload !== null && payload.exp * 1000 > Date.now();
}
