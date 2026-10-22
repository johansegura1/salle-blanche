import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import type { Role } from '../types';
import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  /** Le rôle exigé, pour les pages des gestionnaires. */
  role?: Role;
}

/**
 * Protège une page. Déconnecté : direction /login, en retenant la page
 * demandée pour y revenir après la connexion. Connecté sans le bon rôle :
 * un message.
 *
 * Ça ne fait que cacher la page : la vraie protection est dans l'API, qui
 * vérifie le token et le rôle à chaque requête. Un front se contourne toujours.
 */
export const RequireAuth = ({ children, role }: RequireAuthProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return (
      <section className="page">
        <p className="error" role="alert">
          Cette page est réservée aux gestionnaires de la salle.
        </p>
      </section>
    );
  }
  return children;
};
