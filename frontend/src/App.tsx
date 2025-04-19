import React from 'react';
import { createBrowserRouter, RouterProvider, type RouterProviderProps } from 'react-router-dom';
import { SpotifyAuthProvider } from './contexts/SpotifyAuthContext';
import { Toaster } from './components/ui/toaster';
import MoodDetection from './components/MoodDetection';
import MusicRecommendations from './components/MusicRecommendations';
import { SpotifyAuthCallback } from './components/SpotifyAuthCallback';

// Define router configuration with future flags
const routerConfig = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
  routes: [
    {
      path: '/',
      element: <MoodDetection />,
    },
    {
      path: '/recommendations',
      element: <MusicRecommendations />,
    },
    {
      path: '/auth/callback',
      element: <SpotifyAuthCallback />,
    },
  ],
} satisfies RouterProviderProps['router'];

const router = createBrowserRouter(routerConfig.routes, {
  future: routerConfig.future,
});

function App() {
  return (
    <SpotifyAuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </SpotifyAuthProvider>
  );
}

export default App; 