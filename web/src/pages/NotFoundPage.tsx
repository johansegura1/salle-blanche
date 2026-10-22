import { Link } from 'react-router';

/** La page de toute adresse qu'aucune route ne connaît : la route `*`. */
export const NotFoundPage = () => {
  return (
    <section className="page not-found">
      <h2>Page introuvable</h2>
      <p>Cette adresse ne correspond à aucune page.</p>
      <Link to="/">Retour aux équipements</Link>
    </section>
  );
};
