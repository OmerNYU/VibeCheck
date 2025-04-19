import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import moodApi from '../api/moodApi';

const MoodDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [moodData, setMoodData] = useState<{ dominant_emotion: string; emotions: Record<string, number> } | null>(null);
  const { state, login } = useSpotifyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Failed to access camera. Please ensure camera permissions are granted.');
        console.error('Camera error:', err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg');
    });

    // Convert blob to file
    const file = new File([blob], 'mood-capture.jpg', { type: 'image/jpeg' });
    return file;
  };

  const handleDetectMood = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setMoodData(null);
      
      const imageFile = await captureImage();
      if (!imageFile) {
        throw new Error('Failed to capture image');
      }

      const result = await moodApi.detectMood(imageFile);
      setMoodData(result);
      
      if (state.isAuthenticated) {
        navigate('/recommendations', { state: { moodData: result } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect mood');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = () => {
    if (moodData) {
      navigate('/recommendations', { state: { moodData } });
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Mood Detection</h1>
      
      <div className="relative aspect-video mb-6 rounded-lg overflow-hidden bg-gray-100">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleDetectMood}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Detect Mood'}
        </Button>

        {moodData && (
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-3">
            <h2 className="font-semibold text-lg">Detected Mood</h2>
            <p>Primary emotion: {moodData.dominant_emotion}</p>
            <div className="space-y-2">
              {Object.entries(moodData.emotions).map(([emotion, value]) => (
                <div key={emotion} className="flex items-center gap-2">
                  <span className="w-24 text-sm">{emotion}:</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-sm w-12">{value.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            {!state.isAuthenticated ? (
              <div className="pt-2">
                <p className="text-sm text-yellow-600 mb-2">
                  Connect your Spotify account to get music recommendations based on your mood!
                </p>
                <Button onClick={login} variant="outline" className="w-full">
                  Connect Spotify
                </Button>
              </div>
            ) : (
              <Button onClick={handleGetRecommendations} className="w-full">
                Get Music Recommendations
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default MoodDetection; 