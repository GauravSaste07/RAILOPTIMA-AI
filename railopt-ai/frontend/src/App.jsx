import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/RouteProtection';
import Layout from './components/Layout';

import Login from './pages/Login';
import SubmitRequest from './pages/SubmitRequest';
import RiskQueue from './pages/RiskQueue';
import BlockOptimization from './pages/BlockOptimization';
import AdminApproval from './pages/AdminApproval';
import BlockCalendar from './pages/BlockCalendar';
import Reports from './pages/Reports';
import LiveNetworkMap from './pages/LiveNetworkMap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RailOpt ErrorBoundary caught]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-500 text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-wide">Component Rendering Alert</h2>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {this.state.error?.message || 'A temporary interface error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all shadow-xs"
            >
              Refresh Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/risk-queue" replace />;
  return <Navigate to="/submit-request" replace />;
}

export default function App() {
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => {
        console.log('[ML Service Health Check Response]:', data);
      })
      .catch((err) => {
        console.error('[ML Service Health Check Error]:', err);
      });
  }, []);
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Root Redirect based on auth/role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authenticated Routes with Shared Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Department + Admin shared routes */}
              <Route path="/submit-request" element={<SubmitRequest />} />
              <Route path="/calendar" element={<BlockCalendar />} />
              <Route path="/live-map" element={<LiveNetworkMap />} />

              {/* Admin-only Protected Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/risk-queue" element={<RiskQueue />} />
                <Route path="/block-optimization" element={<BlockOptimization />} />
                <Route path="/admin-approval" element={<AdminApproval />} />
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
