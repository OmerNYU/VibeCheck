from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
from .session import session_manager
from datetime import datetime, timedelta

load_dotenv()

class RateLimiter:
    def __init__(self, limit: int = 5, window: int = 60):
        self.limit = limit
        self.window = window
        self.requests: Dict[str, list] = {}

    def is_allowed(self, client_ip: str) -> bool:
        now = datetime.now()
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Remove old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < timedelta(seconds=self.window)
        ]
        
        if len(self.requests[client_ip]) >= self.limit:
            return False
        
        self.requests[client_ip].append(now)
        return True

class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limit: int = 100):
        super().__init__(app)
        self.rate_limiter = RateLimiter(limit=rate_limit)
        self.csrf_exempt_paths = {
            "/api/mood/detect",
            "/api/auth/spotify/url",
            "/api/auth/spotify/callback",
            "/api/auth/check",
            "/api/auth/me"
        }

    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Check rate limit
        if not self.rate_limiter.is_allowed(client_ip):
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(self.rate_limiter.window)}
            )
        
        # Skip CSRF check for exempt paths
        if request.url.path not in self.csrf_exempt_paths and request.method == "POST":
            csrf_token = request.headers.get("X-CSRF-Token")
            if not csrf_token or csrf_token != os.getenv("CSRF_TOKEN"):
                raise HTTPException(status_code=403, detail="Invalid CSRF token")
        
        response = await call_next(request)
        return response

    def _verify_csrf_token(self, request: Request) -> bool:
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            return False

        session_token = request.cookies.get(session_manager.session_cookie_name)
        if not session_token:
            return False

        try:
            session_data = session_manager.verify_session_token(session_token)
            return csrf_token == session_data.get("csrf_token")
        except:
            return False

    async def _handle_session(self, request: Request, response: Response) -> None:
        # Check if we need to refresh the session
        session_token = request.cookies.get(session_manager.session_cookie_name)
        if session_token:
            try:
                session_data = session_manager.verify_session_token(session_token)
                # Refresh session if it's about to expire (within 5 minutes)
                if session_data["exp"] - time.time() < 300:
                    new_token = session_manager.create_session_token(session_data["user"])
                    session_manager.set_session_cookie(response, new_token)
            except:
                # Invalid session, remove the cookie
                session_manager.delete_session_cookie(response) 