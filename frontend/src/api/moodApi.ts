import axios from 'axios';
import { MoodInput } from '../types';

// Use relative URLs since we're using Vite's proxy
const moodApi = {
  // Mood detection
  detectMood: async (file: File): Promise<{ dominant_emotion: string; emotions: Record<string, number> }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/mood/detect', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to detect mood');
    }

    return response.json();
  },

  // Music recommendations
  getRecommendations: async (mood: string): Promise<{ suggested_songs: string; playlist_url: string }> => {
    const response = await fetch('/api/music/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ mood_description: mood }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get recommendations');
    }

    return response.json();
  },

  // Spotify authentication
  getSpotifyAuthUrl: async () => {
    try {
      const response = await fetch('/api/auth/spotify/url', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get Spotify auth URL');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Spotify auth URL:', error);
      throw error;
    }
  },

  // Check authentication status
  checkAuth: async () => {
    const response = await fetch('/api/auth/check', {
      credentials: 'include',
    });
    return response.json();
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    return response.json();
  },

  // Logout
  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    return response.json();
  },
};

// Add response interceptor to handle rate limiting
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn(`Rate limited. Please try again in ${retryAfter} seconds.`);
      // You could implement a retry mechanism here
    }
    return Promise.reject(error);
  }
);

export default moodApi; 