# ========== Imports ==========
import os
import cv2
import numpy as np
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from deepface import DeepFace
from src.session import session_manager
from src.security import SecurityMiddleware
from spotify_auth import spotify_auth
from spotify_client import SpotifyClient

# ========== Load Environment Variables ==========
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# ========== FastAPI Setup ==========
app = FastAPI()

# Add security middleware
app.add_middleware(SecurityMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5176"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# ========== Models ==========
class MoodInput(BaseModel):
    mood_description: str

class SpotifyAuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int

# ========== Helper Functions ==========
def analyze_emotion(img) -> dict:
    result = DeepFace.analyze(
        img,
        actions=['emotion'],
        detector_backend='retinaface',
        enforce_detection=False
    )
    data = result[0]
    dominant_emotion = data["dominant_emotion"].strip().lower()
    raw_emotions = data["emotion"]
    emotions = {k: float(v) for k, v in raw_emotions.items()}
    return {"dominant_emotion": dominant_emotion, "emotions": emotions}

# ========== Routes ==========
@app.get("/api/auth/spotify/url")
async def get_spotify_auth_url():
    """Get Spotify authorization URL"""
    state = "moodmusic"  # In production, use a secure random string
    auth_url = spotify_auth.get_auth_url(state)
    return {"url": auth_url}

@app.post("/api/auth/spotify/callback")
async def spotify_callback(code: str, response: Response) -> SpotifyAuthResponse:
    """Handle Spotify callback and get access token"""
    try:
        token_data = spotify_auth.get_access_token(code)
        
        # Create session with user data
        session_token = session_manager.create_session_token({
            "spotify_access_token": token_data["access_token"],
            "spotify_refresh_token": token_data["refresh_token"],
        })
        
        # Set session cookie
        session_manager.set_session_cookie(response, session_token)
        
        return SpotifyAuthResponse(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            expires_in=token_data["expires_in"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/mood/detect")
async def analyze(file: UploadFile = File(...)):
    try:
        # Read and validate image
        img_bytes = await file.read()
        if not img_bytes:
            print("Error: No image data received")
            raise HTTPException(status_code=400, detail="No image data received")
            
        img_array = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            print("Error: Invalid image format")
            raise HTTPException(status_code=400, detail="Invalid image format")

        # Analyze emotion
        try:
            print("Starting emotion analysis...")
            emotion_data = analyze_emotion(img)
            print("Emotion analysis result:", emotion_data)
            return {
                "dominant_emotion": emotion_data["dominant_emotion"],
                "emotions": emotion_data["emotions"]
            }
        except Exception as e:
            print(f"DeepFace analysis error: {str(e)}")
            print(f"Error type: {type(e)}")
            print(f"Error args: {e.args}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze emotions: {str(e)}. Please ensure the image contains a clear face."
            )

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Analyze error: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error args: {e.args}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )

@app.post("/api/music/recommendations")
async def ai_recommend(data: MoodInput, request: Request):
    """
    Accepts mood_description, fetches user's saved Spotify songs,
    and asks Gemini which ones match the mood best.
    """
    try:
        # Get user session
        user_data = await session_manager.get_current_user(request)
        if not user_data or "spotify_access_token" not in user_data:
            raise HTTPException(status_code=401, detail="Not authenticated with Spotify")
        
        # Initialize Spotify client
        spotify = SpotifyClient(user_data["spotify_access_token"])
        
        # Get user profile
        user_profile = spotify.get_user_profile()
        user_id = user_profile["id"]
        
        # Get saved tracks
        saved_tracks = spotify.get_saved_tracks(limit=50)
        items = saved_tracks.get("items", [])
        
        if not items:
            return {"error": "No saved tracks found in user's library."}

        # Format song list for Gemini
        song_lines = []
        for i, item in enumerate(items, start=1):
            track = item["track"]
            name = track["name"]
            artist = track["artists"][0]["name"]
            song_lines.append(f"{i}. {name} - {artist}")
        
        song_list_text = "\n".join(song_lines)
        mood = data.mood_description.strip()

        # Send to Gemini
        gemini_prompt = (
            f"Based on the following mood: '{mood}', "
            f"select the top 3 songs from this list that emotionally fit best:\n\n"
            f"{song_list_text}\n\n"
            f"Only return the selected 3 songs as a list of 'Title - Artist'."
        )

        gemini_response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/text-bison-001:generateText?key={GOOGLE_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={"prompt": {"text": gemini_prompt}, "temperature": 0.7}
        )

        if gemini_response.status_code != 200:
            return {"error": "Gemini API failed", "details": gemini_response.text}

        output = gemini_response.json().get("candidates", [{}])[0].get("output", "").strip()
        
        # Create a playlist with the recommended songs
        playlist_name = f"MoodMusic: {mood.capitalize()} Vibes"
        playlist = spotify.create_playlist(
            user_id=user_id,
            name=playlist_name,
            description=f"Songs that match your {mood} mood"
        )
        
        # Add tracks to playlist
        track_uris = []
        for item in items:
            track = item["track"]
            for line in output.split("\n"):
                if f"{track['name']} - {track['artists'][0]['name']}" in line:
                    track_uris.append(track["uri"])
                    break
        
        if track_uris:
            spotify.add_tracks_to_playlist(playlist["id"], track_uris)
        
        return {
            "suggested_songs": output,
            "playlist_url": playlist["external_urls"]["spotify"]
        }

    except Exception as e:
        print(f"Recommendation error: {str(e)}")
        print(f"Error type: {type(e)}")
        print(f"Error args: {e.args}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        )

@app.get("/api/auth/check")
async def check_auth(request: Request):
    """Check if user is authenticated"""
    try:
        user_data = await session_manager.get_current_user(request)
        return {"is_authenticated": bool(user_data)}
    except:
        return {"is_authenticated": False}

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    """Get current user data"""
    try:
        user_data = await session_manager.get_current_user(request)
        if not user_data or "spotify_access_token" not in user_data:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        # Initialize Spotify client
        spotify = SpotifyClient(user_data["spotify_access_token"])
        
        # Get user profile
        user_profile = spotify.get_user_profile()
        
        return {
            "user": user_profile,
            "spotify_access_token": user_data["spotify_access_token"]
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
