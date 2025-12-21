# game_engine/__init__.py

"""
Game Engine Root Package
The primary package for the Football Analysis service.
"""

# Import the FastAPI application instance from app.py
from .app import app

# Exporting 'app' allows you to run: uvicorn game_engine:app
__all__ = ["app"]