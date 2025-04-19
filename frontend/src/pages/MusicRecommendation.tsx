import React, { useState } from 'react';
import { useSpotifyAuth } from '../contexts/SpotifyAuthContext';
import { moodApi } from '../api';
import { SpotifyLoginButton } from '../components/SpotifyLoginButton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

export const MusicRecommendation: React.FC = () => {
    const [mood, setMood] = useState('');
    const [recommendations, setRecommendations] = useState<{ suggested_songs: string; playlist_url: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { isAuthenticated, accessToken } = useSpotifyAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated || !accessToken) {
            setError('Please connect your Spotify account first');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await moodApi.getRecommendations(mood, accessToken);
            setRecommendations(response);
        } catch (err) {
            setError('Failed to get recommendations. Please try again.');
            console.error('Recommendation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Music Recommendation</CardTitle>
                    <CardDescription>
                        Enter your mood and get personalized music recommendations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <SpotifyLoginButton />
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="text"
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                placeholder="How are you feeling today?"
                                className="w-full"
                                disabled={!isAuthenticated}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!isAuthenticated || isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Getting Recommendations...' : 'Get Recommendations'}
                        </Button>
                    </form>

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {recommendations && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Recommended Songs:</h3>
                            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                                {recommendations.suggested_songs}
                            </pre>
                            {recommendations.playlist_url && (
                                <div className="mt-4">
                                    <a
                                        href={recommendations.playlist_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Open Playlist in Spotify
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}; 