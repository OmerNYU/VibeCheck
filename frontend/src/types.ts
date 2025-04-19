export interface MoodInput {
  text: string;
}

export interface MoodResponse {
  dominant_emotion: string;
  emotions: Record<string, number>;
}

export interface RecommendationsResponse {
  suggested_songs: string;
  playlist_url: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  error: string | null;
} 