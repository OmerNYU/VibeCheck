import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SpotifyAuthState, SpotifyUser } from '../types';
import moodApi from '../api/moodApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface SpotifyAuthContextType {
  state: SpotifyAuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: (code: string) => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | undefined>(undefined);

export const SpotifyAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SpotifyAuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    error: null,
  });

  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          isAuthenticated: true,
          user: data.user,
          accessToken: data.spotify_access_token,
          error: null,
        });
        return true;
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: null,
        });
        return false;
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: null,
      });
      return false;
    }
  };

  // Only check auth status once on mount
  useEffect(() => {
    const token = document.cookie.includes('session=');
    if (token) {
      checkAuth();
    }
  }, []);

  const login = async () => {
    try {
      const { url } = await moodApi.getSpotifyAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Error getting Spotify auth URL:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to initiate Spotify login'
      }));
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: null,
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCallback = async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/spotify/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          isAuthenticated: true,
          user: data.user,
          accessToken: data.spotify_access_token,
          error: null,
        });
      } else {
        const error = await response.json();
        setState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          error: error.detail || 'Authentication failed',
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: 'Failed to complete authentication',
      });
    }
  };

  return (
    <SpotifyAuthContext.Provider value={{ state, login, logout, handleCallback, checkAuth }}>
      {children}
    </SpotifyAuthContext.Provider>
  );
};

export const useSpotifyAuth = () => {
  const context = useContext(SpotifyAuthContext);
  if (context === undefined) {
    throw new Error('useSpotifyAuth must be used within a SpotifyAuthProvider');
  }
  return context;
}; 