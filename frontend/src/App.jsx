import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';

import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Results from './pages/Results';
import BlockchainExplorer from './pages/BlockchainExplorer';
import HostRequestForm from './pages/HostRequestForm';
import CreateElection from './pages/CreateElection';
import ElectionsList from './pages/ElectionsList';
import ElectionDetail from './pages/ElectionDetail';
import SecuritySettings from './pages/SecuritySettings';
import MyActivity from './pages/MyActivity';
import Profile from './pages/Profile';
import MyHostedElections from './pages/MyHostedElections';
import ErrorBoundary from './components/ErrorBoundary';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, hostOnly = false }) => {
  const { user, loading, canHostElections } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (hostOnly && !canHostElections) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <AppShell>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/admin/login" element={user ? (user.role === 'ADMIN' ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />) : <AdminLogin />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* User / Host Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/elections" element={<ElectionsList />} />
        <Route path="/elections/:id" element={<ElectionDetail />} />
        <Route path="/activity" element={<ProtectedRoute><MyActivity /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings/security" element={<ProtectedRoute><SecuritySettings /></ProtectedRoute>} />

        {/* Host Routes */}
        <Route path="/host-request" element={<ProtectedRoute><HostRequestForm /></ProtectedRoute>} />
        <Route path="/host/request" element={<ProtectedRoute><HostRequestForm /></ProtectedRoute>} />
        <Route path="/host/elections" element={<ProtectedRoute hostOnly><MyHostedElections /></ProtectedRoute>} />
        <Route path="/elections/create" element={<ProtectedRoute hostOnly><CreateElection /></ProtectedRoute>} />

        {/* Admin Portal & Subroutes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/host-requests" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/elections" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/candidates" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/transactions" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

        {/* Utilities & Results */}
        <Route path="/results" element={<Results />} />
        <Route path="/blockchain" element={<BlockchainExplorer />} />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
