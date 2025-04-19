import requests
from fastapi import HTTPException
from typing import List, Dict, Any

class SpotifyClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.spotify.com/v1"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    def get_user_profile(self) -> Dict[str, Any]:
        """Get the current user's profile"""
        response = requests.get(
            f"{self.base_url}/me",
            headers=self.headers
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to get user profile"
            )
        return response.json()

    def get_saved_tracks(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """Get user's saved tracks"""
        response = requests.get(
            f"{self.base_url}/me/tracks",
            headers=self.headers,
            params={"limit": limit, "offset": offset}
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to get saved tracks"
            )
        return response.json()

    def get_track_features(self, track_id: str) -> Dict[str, Any]:
        """Get audio features for a track"""
        response = requests.get(
            f"{self.base_url}/audio-features/{track_id}",
            headers=self.headers
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to get track features"
            )
        return response.json()

    def create_playlist(self, user_id: str, name: str, description: str = "") -> Dict[str, Any]:
        """Create a new playlist"""
        response = requests.post(
            f"{self.base_url}/users/{user_id}/playlists",
            headers=self.headers,
            json={
                "name": name,
                "description": description,
                "public": False
            }
        )
        if response.status_code != 201:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to create playlist"
            )
        return response.json()

    def add_tracks_to_playlist(self, playlist_id: str, track_uris: List[str]) -> None:
        """Add tracks to a playlist"""
        response = requests.post(
            f"{self.base_url}/playlists/{playlist_id}/tracks",
            headers=self.headers,
            json={"uris": track_uris}
        )
        if response.status_code != 201:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to add tracks to playlist"
            ) 