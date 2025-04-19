export interface MoodInput {
  mood_description: string;
}

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  accessToken: string | null;
  error: string | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
} 