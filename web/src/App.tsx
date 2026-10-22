import { Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { Header } from './components/Header';
import { EquipmentsPage } from './pages/EquipmentsPage';
import { HabilitationsPage } from './pages/HabilitationsPage';
import { LoginPage } from './pages/LoginPage';
import { MyReservationsPage } from './pages/MyReservationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlanningPage } from './pages/PlanningPage';

/**
 * Le cadre de chaque page : l'en-tête, puis la page de l'adresse. Tout est
 * réservé aux connectés, sauf la connexion : le planning ne regarde que les
 * gens de la salle.
 */
const App = () => {
  return (
    <main className="app">
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><EquipmentsPage /></RequireAuth>} />
        <Route path="/equipments/:id" element={<RequireAuth><PlanningPage /></RequireAuth>} />
        <Route path="/me/reservations" element={<RequireAuth><MyReservationsPage /></RequireAuth>} />
        <Route
          path="/admin/habilitations"
          element={<RequireAuth role="manager"><HabilitationsPage /></RequireAuth>}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
  );
};

export default App;
