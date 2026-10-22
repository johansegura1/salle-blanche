import { NavLink } from 'react-router';
import { useAuth } from '../auth/AuthProvider';

/** Le haut de chaque page : le titre, la navigation, et qui est connecté. */
export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div>
        <h1 className="app-title">
          <NavLink to="/">Salle blanche</NavLink>
        </h1>
        <p className="app-tagline">Le planning des équipements du Centre de microélectronique</p>
      </div>

      {user && (
        <nav className="app-nav" aria-label="Navigation principale">
          <NavLink to="/" end>
            Équipements
          </NavLink>
          <NavLink to="/me/reservations">Mes réservations</NavLink>
          {user.role === 'manager' && <NavLink to="/admin/habilitations">Habilitations</NavLink>}
          <span className="app-user">
            {user.name}
            {user.role === 'manager' && ' (gestionnaire)'}
          </span>
          <button className="link-button" type="button" onClick={logout}>
            Se déconnecter
          </button>
        </nav>
      )}
    </header>
  );
};
