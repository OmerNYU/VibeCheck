import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';

export const SpotifyAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback } = useSpotifyAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/');
      return;
    }

    const completeAuth = async () => {
      try {
        await handleCallback(code);
        navigate('/');
      } catch (error) {
        console.error('Failed to complete authentication:', error);
        navigate('/');
      }
    };

    completeAuth();
  }, [searchParams, handleCallback, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing Authentication...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}; 