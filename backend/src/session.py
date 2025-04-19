from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class SessionManager:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY")
        self.session_cookie_name = os.getenv("SESSION_COOKIE_NAME", "session")
        self.session_max_age = int(os.getenv("SESSION_MAX_AGE", "1800"))
        self.security = HTTPBearer()

    def create_session_token(self, user_data: Dict[str, Any]) -> str:
        """Create a new session token with user data"""
        payload = {
            "user": user_data,
            "exp": datetime.utcnow() + timedelta(seconds=self.session_max_age),
            "iat": datetime.utcnow(),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_session_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode a session token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Session expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid session token")

    async def get_current_user(self, request: Request) -> Optional[Dict[str, Any]]:
        """Get the current user from the session token"""
        try:
            # Try to get token from Authorization header
            credentials: HTTPAuthorizationCredentials = await self.security(request)
            if credentials:
                return self.verify_session_token(credentials.credentials)
            
            # Try to get token from cookie
            session_cookie = request.cookies.get(self.session_cookie_name)
            if session_cookie:
                return self.verify_session_token(session_cookie)
            
            return None
        except Exception:
            return None

    def set_session_cookie(self, response, token: str) -> None:
        """Set the session cookie in the response"""
        response.set_cookie(
            key=self.session_cookie_name,
            value=token,
            max_age=self.session_max_age,
            httponly=True,
            secure=True,  # Set to True in production
            samesite="lax",
            path="/",
        )

    def delete_session_cookie(self, response) -> None:
        """Delete the session cookie"""
        response.delete_cookie(
            key=self.session_cookie_name,
            path="/",
        )

# Create a singleton instance
session_manager = SessionManager() 