import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  QrCode, 
  Users, 
  UserPlus,
  Camera,
  LogOut,
} from 'lucide-react';
import { cn } from './lib/utils';
import { AttendanceProvider } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load components for code splitting
const Scanner = lazy(() => import('./components/Scanner'));
const Records = lazy(() => import('./components/Records'));
const Register = lazy(() => import('./components/Register'));
const Login = lazy(() => import('./components/Login'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      {isAuthenticated && (
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <QrCode className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900 leading-tight">
                  QR Attendance Monitoring
                </h1>
                <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
                  Barangay Assembly System
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <nav className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
                <TabButton 
                  to="/scanner"
                  icon={<Camera size={18} />}
                  label="Scanner"
                />
                <TabButton 
                  to="/records"
                  icon={<Users size={18} />}
                  label="Records"
                />
                <TabButton 
                  to="/register"
                  icon={<UserPlus size={18} />}
                  label="Register"
                />
              </nav>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold text-sm"
                title="Logout"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/scanner" element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute>
                <Records />
              </ProtectedRoute>
            } />
            <Route path="/register" element={
              <ProtectedRoute>
                <Register />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-neutral-400">
            &copy; {new Date().getFullYear()} Barangay Assembly Attendance System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AttendanceProvider>
    </AuthProvider>
  );
}

function TabButton({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink 
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
        isActive 
          ? "bg-white text-blue-600 shadow-sm" 
          : "text-neutral-500 hover:text-neutral-700"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}
