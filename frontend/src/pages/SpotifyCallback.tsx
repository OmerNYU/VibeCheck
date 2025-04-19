import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const SpotifyCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { handleCallback } = useSpotifyAuth();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleCallback(code)
                .then(() => {
                    navigate('/music-recommendation');
                })
                .catch((error) => {
                    console.error('Failed to handle Spotify callback:', error);
                    navigate('/');
                });
        } else {
            navigate('/');
        }
    }, [searchParams, handleCallback, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner fullScreen />
        </div>
    );
}; 