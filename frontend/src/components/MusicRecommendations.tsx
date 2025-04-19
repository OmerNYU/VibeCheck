import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import moodApi from '../api/moodApi';

interface MoodData {
  dominant_emotion: string;
  emotions: Record<string, number>;
}

const MusicRecommendations: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login } = useSpotifyAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{
    suggested_songs: string;
    playlist_url: string;
  } | null>(null);

  const moodData = location.state?.moodData as MoodData;

  useEffect(() => {
    if (!moodData) {
      navigate('/');
    }
  }, [moodData, navigate]);

  const handleGetRecommendations = async () => {
    if (!moodData) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await moodApi.getRecommendations(moodData.dominant_emotion);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  if (!moodData) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Music Recommendations</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Mood Analysis</h2>
        <p className="text-lg mb-2">
          Dominant Emotion: <span className="font-medium">{moodData.dominant_emotion}</span>
        </p>
        <div className="space-y-2">
          {Object.entries(moodData.emotions).map(([emotion, value]) => (
            <div key={emotion} className="flex items-center">
              <span className="w-32">{emotion}:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="ml-2 w-12">{value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="text-center">
          <p className="text-yellow-500 mb-4">
            Please connect your Spotify account to get music recommendations
          </p>
          <Button onClick={login}>Connect Spotify</Button>
        </div>
      ) : (
        <div className="text-center">
          <Button
            onClick={handleGetRecommendations}
            disabled={isLoading}
            className="mb-6"
          >
            {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
          </Button>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {recommendations && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Recommended Songs</h2>
              <div className="whitespace-pre-line mb-4">
                {recommendations.suggested_songs}
              </div>
              <a
                href={recommendations.playlist_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Open Playlist in Spotify
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicRecommendations; 