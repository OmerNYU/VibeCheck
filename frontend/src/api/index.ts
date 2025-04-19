import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('spotify_access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const moodApi = {
    detectMood: async (text: string) => {
        const response = await api.post('/api/mood/detect', { text });
        return response.data;
    },
    getRecommendations: async (mood: string) => {
        const response = await api.post('/api/music/recommendations', { mood_description: mood });
        return response.data;
    },
    getSpotifyAuthUrl: async () => {
        const response = await api.get('/api/auth/spotify/url');
        return response.data;
    },
    handleSpotifyCallback: async (code: string) => {
        const response = await api.post('/api/auth/spotify/callback', { code });
        return response.data;
    }
};

export default api; 