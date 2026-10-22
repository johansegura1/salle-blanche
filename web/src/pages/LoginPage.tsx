import { useState, type SubmitEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api';
import { useAuth } from '../auth/AuthProvider';

/** What RequireAuth leaves in the state of the navigation: the page that was asked for. */
interface FromState {
  from?: string;
}

/** La page de connexion, sur /login. Un formulaire contrôlé : React tient la valeur de chaque champ. */
export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    // Without it, the browser sends the form itself and reloads the page.
    event.preventDefault();
    setError('');

    try {
      const user = await login(username, password);
      // Retour à la page que RequireAuth a retenue, ou à l'accueil. Sauf une page
      // de gestionnaire pour quelqu'un qui ne l'est pas : c'était celle de la
      // personne précédente sur ce poste. replace : la connexion ne reste pas
      // dans l'historique.
      const from = (location.state as FromState | null)?.from ?? '/';
      const allowed = !from.startsWith('/admin') || user?.role === 'manager';
      navigate(allowed ? from : '/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Identifiant ou mot de passe incorrect.'
          : `Connexion impossible : ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <section className="page form-page">
      <h2>Connexion</h2>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-username">Identifiant</label>
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Mot de passe</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <button className="button" type="submit">
          Se connecter
        </button>
      </form>

      <p className="hint">
        Comptes de démonstration&nbsp;: claire et bruno (gestionnaires), lea et noah. Mot de passe&nbsp;: secret.
      </p>
    </section>
  );
};
