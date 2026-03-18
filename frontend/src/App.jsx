import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import Login from './components/Login';
import Dashboard from './Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import TopologyViewer from './components/TopologyViewer';
import ThresholdConfig from './components/ThresholdConfig';
import Analytics from './components/Analytics';
import AdminDevices from './components/AdminDevices';
import ProtectedRoute from './components/ProtectedRoute';
import { LogOut, Home, Network, Settings, BarChart3, Sun, Moon, ShieldPlus } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <nav className={`${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/10 border-gray-700'} backdrop-blur-md border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-white font-bold text-xl">Network Monitor</span>
            <div className="flex gap-4">
              <a href="/" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} flex items-center gap-2 px-3 py-2 rounded-md transition-colors`}>
                <Home size={18} />
                Dashboard
              </a>
              <a href="/topology" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} flex items-center gap-2 px-3 py-2 rounded-md transition-colors`}>
                <Network size={18} />
                Topology
              </a>
              <a href="/thresholds" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} flex items-center gap-2 px-3 py-2 rounded-md transition-colors`}>
                <Settings size={18} />
                Thresholds
              </a>
              <a href="/analytics" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} flex items-center gap-2 px-3 py-2 rounded-md transition-colors`}>
                <BarChart3 size={18} />
                Analytics
              </a>
              {user?.role === 'admin' && (
                <a href="/admin/devices" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} flex items-center gap-2 px-3 py-2 rounded-md transition-colors`}>
                  <ShieldPlus size={18} />
                  Admin Devices
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="text-yellow-400" size={18} /> : <Moon className="text-blue-600" size={18} />}
            </button>

            <div className="text-right">
              <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{user?.username}</p>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm capitalize`}>{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  
  console.log('AppContent rendering - loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campus Network Monitor</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/topology"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
                <TopologyViewer />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/thresholds"
          element={
            <ProtectedRoute requiredRole="operator">
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
                <ThresholdConfig />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
                <Analytics />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/devices"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDevices />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  console.log('App component rendering');
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;