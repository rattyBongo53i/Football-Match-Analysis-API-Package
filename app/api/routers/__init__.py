# app/api/routers/__init__.py
"""
Router imports - This file exports all routers from individual files.
Import the actual router objects from each file.
"""

# Import router from each file
try:
    from .match import router as match_router
except ImportError as e:
    print(f"Warning: Could not import match router: {e}")
    match_router = None

try:
    from .slip import router as slip_router
except ImportError as e:
    print(f"Warning: Could not import slip router: {e}")
    slip_router = None

try:
    from .generator import router as generator_router
except ImportError as e:
    print(f"Warning: Could not import generator router: {e}")
    generator_router = None

try:
    from .market import router as market_router
except ImportError as e:
    print(f"Warning: Could not import market router: {e}")
    market_router = None

try:
    from .user import router as user_router
except ImportError as e:
    print(f"Warning: Could not import user router: {e}")
    user_router = None

# Create lists of available routers
available_routers = []
if match_router:
    available_routers.append(("matches", match_router))
if slip_router:
    available_routers.append(("slips", slip_router))
if generator_router:
    available_routers.append(("generator", generator_router))
if market_router:
    available_routers.append(("markets", market_router))
if user_router:
    available_routers.append(("users", user_router))

# Export for convenience
__all__ = [
    "available_routers",
    "match_router",
    "slip_router",
    "generator_router",
    "market_router",
    "user_router"
]