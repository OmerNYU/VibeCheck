import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, login, logout } = useSpotifyAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-gray-800">
            MoodMusic
          </Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button variant="outline" onClick={logout}>
                Disconnect Spotify
              </Button>
            ) : (
              <Button onClick={login}>
                Connect Spotify
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 