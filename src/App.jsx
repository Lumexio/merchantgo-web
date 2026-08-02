import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './store/auth.js';
import AppShell from './components/layout/AppShell.jsx';
import LoginView from './views/auth/LoginView.jsx';
import RegisterView from './views/auth/RegisterView.jsx';
import DashboardView from './views/dashboard/DashboardView.jsx';
import OrdersView from './views/orders/OrdersView.jsx';
import HistoryView from './views/history/HistoryView.jsx';
import ZReportsView from './views/zreports/ZReportsView.jsx';
import StaffView from './views/staff/StaffView.jsx';
import BranchesView from './views/branches/BranchesView.jsx';
import MenuView from './views/menu/MenuView.jsx';
import SettingsView from './views/settings/SettingsView.jsx';
import ProfileView from './views/profile/ProfileView.jsx';

function RequireAuth({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardView />} />
        <Route path="orders" element={<OrdersView />} />
        <Route path="history" element={<HistoryView />} />
        <Route path="zreports" element={<ZReportsView />} />
        <Route path="staff" element={<StaffView />} />
        <Route path="branches" element={<BranchesView />} />
        <Route path="menu" element={<MenuView />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="profile" element={<ProfileView />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
