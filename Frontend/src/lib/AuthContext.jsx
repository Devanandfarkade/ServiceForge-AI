/**
 * ServiceForge AI — Authentication Context
 *
 * Provides authentication state and actions to the React component tree.
 * Wraps the Cognito client (lib/cognito.js) and exposes:
 *  - user         — current authenticated user object (or null)
 *  - isLoading    — initial auth check in progress
 *  - isLoggedIn   — boolean shortcut
 *  - signIn()     — authenticate with Cognito
 *  - signOut()    — global sign out
 *
 * Usage:
 *   import { useAuth } from '../lib/AuthContext';
 *   const { user, signIn, signOut, isLoading } = useAuth();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  isAuthenticated,
  getCurrentUserFromToken,
} from './cognito';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if there's a valid stored session
  useEffect(() => {
    const storedUser = isAuthenticated() ? getCurrentUserFromToken() : null;
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  // Listen for token expiry events from apiClient
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
    };
    window.addEventListener('sf:auth:expired', handleExpiry);
    return () => window.removeEventListener('sf:auth:expired', handleExpiry);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { user: authUser } = await cognitoSignIn(email, password);
    setUser(authUser);
    return authUser;
  }, []);

  const signOut = useCallback(async () => {
    await cognitoSignOut();
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
