import React, { createContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const AuthContext = createContext();

const initialState = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  token: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isSignedIn: !!action.payload,
        token: action.payload,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isSignedIn: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_UP':
      return {
        ...state,
        isSignedIn: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isSignedIn: false,
        user: null,
        token: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Restore token on app launch
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          // Validate token
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const user = await response.json();
            dispatch({
              type: 'RESTORE_TOKEN',
              payload: token,
            });
          } else {
            dispatch({ type: 'RESTORE_TOKEN', payload: null });
          }
        } else {
          dispatch({ type: 'RESTORE_TOKEN', payload: null });
        }
      } catch (e) {
        dispatch({ type: 'RESTORE_TOKEN', payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    state,
    dispatch,
    signIn: async (username, password) => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          throw new Error('Invalid credentials');
        }

        const data = await response.json();
        await SecureStore.setItemAsync('token', data.access_token);
        dispatch({
          type: 'SIGN_IN',
          payload: { user: data.user, token: data.access_token },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    signOut: async () => {
      try {
        await SecureStore.deleteItemAsync('token');
        dispatch({ type: 'SIGN_OUT' });
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
    signUp: async (username, email, password) => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
          throw new Error('Registration failed');
        }

        const data = await response.json();
        await SecureStore.setItemAsync('token', data.access_token);
        dispatch({
          type: 'SIGN_UP',
          payload: { user: data.user, token: data.access_token },
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}
