import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  
  console.log('AuthProvider mounted, initial token:', !!token, 'loading:', loading);

  useEffect(() => {
    // Check if user is logged in on mount
    console.log('AuthProvider useEffect', 'token:', !!token);
    if (token) {
      fetchCurrentUser();
    } else {
      console.log('No token, setting loading to false');
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalid, logout
        logout();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('token', data.access_token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 3,
      'operator': 2,
      'viewer': 1
    };

    return (roleHierarchy[user.role] || 0) >= (roleHierarchy[requiredRole] || 0);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};