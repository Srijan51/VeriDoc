"""
Supabase JWT authentication service.
Verifies the Bearer token from incoming requests and extracts user_id.
"""

import logging
from typing import Optional

from fastapi import Request, HTTPException, status
from supabase import create_client

from app.config import get_settings

logger = logging.getLogger(__name__)


def get_current_user(request: Request) -> str:
    """
    Extract and verify the Supabase JWT from the Authorization header.

    Returns the user's UUID (as string).
    Raises 401 if the token is missing or invalid.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = auth_header[7:]  # Strip "Bearer "

    try:
        settings = get_settings()
        client = create_client(settings.supabase_url, settings.supabase_key)

        # Use supabase-py's built-in JWT verification via getUser()
        # This calls Supabase's /auth/v1/user endpoint with the token
        user_response = client.auth.get_user(token)

        if user_response and user_response.user:
            user_id = str(user_response.user.id)
            logger.debug("Authenticated user: %s", user_id)
            return user_id

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("JWT verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {exc}",
        )
