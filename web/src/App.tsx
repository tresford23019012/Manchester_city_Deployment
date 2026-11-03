import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import AuthGate from "./auth/AuthGate";
import DashboardPage from "./views/pages/Dashboard/DashboardPage";
import RequestsPage from "./views/pages/Requests/RequestsPage";
import RequestDetailPage from "./views/pages/Requests/RequestDetailPage";
import UsersPage from "./views/pages/Users/UsersPage";
import NewAdminPage from "./views/pages/Admins/NewAdminPage";
import GuesthousesPage from "./features/guesthouses/views/GuesthousesPage";

function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <nav className="admin-nav" aria-label="Administration">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/guesthouses">Guesthouses</NavLink>
          <NavLink to="/admin/requests">Requests</NavLink>
          <NavLink to="/admin/users">Users</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/guesthouses" element={<GuesthousesPage />} />
          <Route path="/admin/requests" element={<RequestsPage />} />
          <Route path="/admin/requests/:id" element={<RequestDetailPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/users/new-admin" element={<NewAdminPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthGate>
  );
}

export default App;
