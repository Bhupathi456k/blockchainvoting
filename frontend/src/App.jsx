import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
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

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, hostOnly = false }) => {
  const { user, loading, canHostElections } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  if (hostOnly && !canHostElections) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Main App Component
function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/admin/login" element={user ? (user.role === 'ADMIN' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />) : <AdminLogin />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/elections"
          element={
            <ProtectedRoute>
              <ElectionsList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/elections/:id"
          element={
            <ProtectedRoute>
              <ElectionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/host-request"
          element={
            <ProtectedRoute>
              <HostRequestForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/host-request"
          element={
            <ProtectedRoute>
              <HostRequestForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/elections/create"
          element={
            <ProtectedRoute hostOnly>
              <CreateElection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />

        <Route
          path="/blockchain"
          element={
            <ProtectedRoute>
              <BlockchainExplorer />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
