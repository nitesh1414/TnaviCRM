import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { PropertiesPage, BrandsPage, LeadsPage, CommunicationsPage, ProposalsPage, LeasesPage, TasksPage } from './pages/CrudPages';
import Meetings from './pages/Meetings';
import Matching from './pages/Matching';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Compose from './pages/Compose';
import './styles.css';

function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
    <Route path="*" element={!user ? <Navigate to="/login" replace /> : <Layout><Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/properties" element={<PropertiesPage />} />
      <Route path="/brands" element={<BrandsPage />} />
      <Route path="/matching" element={<Matching />} />
      <Route path="/leads" element={<LeadsPage />} />
      <Route path="/meetings" element={<Meetings />} />
      <Route path="/compose" element={user.role === 'viewer' ? <Navigate to="/" replace /> : <Compose />} />
      <Route path="/settings" element={user.role === 'admin' ? <Settings /> : <Navigate to="/" replace />} />
      <Route path="/communications" element={<CommunicationsPage />} />
      <Route path="/proposals" element={<ProposalsPage />} />
      <Route path="/leases" element={<LeasesPage />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/users" element={<Users />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Layout>} />
  </Routes>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></React.StrictMode>);
