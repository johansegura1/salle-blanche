/** Les deux rôles dont Claire a besoin : les gestionnaires (Claire, Bruno) et les autres. */
export type Role = 'manager' | 'user';
export const ROLES: Role[] = ['manager', 'user'];

/** Ce que l'API montre d'un utilisateur : jamais son hash de mot de passe. */
export interface PublicUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}
