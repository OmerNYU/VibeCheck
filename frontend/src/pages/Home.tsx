import React from 'react';
import styled from '@emotion/styled';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Link } from 'react-router-dom';

const HomeContainer = styled.div`
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
`;

const WelcomeMessage = styled.h1`
    margin-bottom: 2rem;
`;

const Home: React.FC = () => {
    const { user, loading, error } = useAuth();

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    if (error) {
        return <ErrorDisplay error={error} />;
    }

    return (
        <HomeContainer>
            <WelcomeMessage>
                Welcome, {user?.display_name || 'User'}!
            </WelcomeMessage>
            <p className="text-xl text-gray-600 mb-8">
                Discover music that matches your mood through facial expression analysis
            </p>
            <div className="space-y-4">
                <Link
                    to="/mood-detection"
                    className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Start Mood Detection
                </Link>
                <br />
                <Link
                    to="/music-recommendation"
                    className="inline-block bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                >
                    Get Music Recommendations
                </Link>
            </div>
        </HomeContainer>
    );
};

export default Home; 