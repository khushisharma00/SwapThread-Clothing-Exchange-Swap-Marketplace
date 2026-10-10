import { Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import SwapsPage from './pages/SwapsPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ListingFormPage from './pages/ListingFormPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const guard = (el) => <ProtectedRoute>{el}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        {/* Page 1 — Authentication */}
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        {/* Page 2 — Clothing listings */}
        <Route path="listings" element={<ListingsPage />} />
        {/* Page 3 — Item details */}
        <Route path="listings/:id" element={<ListingDetailPage />} />
        {/* Page 4 — Swap requests */}
        <Route path="swaps" element={guard(<SwapsPage />)} />
        {/* Page 5 — Negotiation chat */}
        <Route path="chat" element={guard(<ChatPage />)} />
        <Route path="chat/:swapId" element={guard(<ChatPage />)} />
        {/* Page 6 — User dashboard (+ listing editor) */}
        <Route path="dashboard" element={guard(<DashboardPage />)} />
        <Route path="dashboard/listings/new" element={guard(<ListingFormPage />)} />
        <Route path="dashboard/listings/:id/edit" element={guard(<ListingFormPage />)} />
        {/* Page 7 — Administrator panel */}
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        {/* Page 8 — Profile & nearby swaps */}
        <Route path="profile" element={guard(<ProfilePage />)} />
        <Route path="users/:id" element={<PublicProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
