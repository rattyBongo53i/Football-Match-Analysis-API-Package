# python_backend/app/__init__.py
"""
Football Match Analysis API Package

This package provides functionality for analyzing football matches,
generating predictions, and creating accumulator betting slips.
"""

import os
import sys
from pathlib import Path

# Add the parent directory to sys.path to allow absolute imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Package metadata
__version__ = "2.1.0"
__author__ = "Your Name"
__email__ = "your.email@example.com"
__description__ = "Football match analysis and betting slip generator"
__license__ = "MIT"

# Import key modules and classes for easier access
try:
    from .team_form_analyzer import EnhancedTeamFormAnalyzer, PredictionResult
    from .head_to_head_analyzer import EnhancedHeadToHeadAnalyzer, H2HPrediction
    from .slip_generator import SlipGenerator, Slip
    from .statistical_predictor import StatisticalPredictor
    from .main import app, AnalysisResponse, PredictionRequest, SlipGenerationRequest
except ImportError as e:
    print(f"Warning: Could not import all modules: {e}")
    # Define fallback imports for development
    pass

# Define what gets imported with "from app import *"
__all__ = [
    # Core classes
    "EnhancedTeamFormAnalyzer",
    "PredictionResult",
    "EnhancedHeadToHeadAnalyzer",
    "H2HPrediction",
    "SlipGenerator",
    "Slip",
    "StatisticalPredictor",
    
    # FastAPI app
    "app",
    
    # Pydantic models
    "AnalysisResponse",
    "PredictionRequest",
    "SlipGenerationRequest",
    
    # Package metadata
    "__version__",
    "__author__",
    "__description__",
]

# Package configuration
PACKAGE_ROOT = Path(__file__).parent
DATA_DIR = PACKAGE_ROOT / "data"
MODELS_DIR = PACKAGE_ROOT / "models"
LOGS_DIR = PACKAGE_ROOT / "logs"

# Create directories if they don't exist
for directory in [DATA_DIR, MODELS_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Configuration variables
CONFIG = {
    "api_version": __version__,
    "default_port": 8000,
    "debug": os.getenv("DEBUG", "False").lower() == "true",
    "max_workers": int(os.getenv("MAX_WORKERS", "4")),
    "cache_timeout": int(os.getenv("CACHE_TIMEOUT", "300")),  # 5 minutes
}

def get_package_info() -> dict:
    """
    Get package information.
    
    Returns:
        dict: Package metadata and configuration
    """
    return {
        "name": "football_match_analyzer",
        "version": __version__,
        "author": __author__,
        "description": __description__,
        "license": __license__,
        "package_root": str(PACKAGE_ROOT),
        "directories": {
            "data": str(DATA_DIR),
            "models": str(MODELS_DIR),
            "logs": str(LOGS_DIR),
        },
        "config": CONFIG,
        "available_modules": [
            "team_form_analyzer",
            "head_to_head_analyzer",
            "slip_generator",
            "statistical_predictor",
            "main"
        ]
    }

def setup_logging(level: str = "INFO"):
    """
    Setup logging configuration for the package.
    
    Args:
        level (str): Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    import logging
    
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(LOGS_DIR / "app.log"),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

# Initialize logging
logger = setup_logging("INFO")

# Package initialization message
logger.info(f"Football Match Analysis API v{__version__} initialized")
logger.info(f"Package root: {PACKAGE_ROOT}")
logger.info(f"Available modules: {', '.join(__all__)}")

# Version check
def check_version(required_version: str = "2.0.0") -> bool:
    """
    Check if the current version meets the required version.
    
    Args:
        required_version (str): Minimum required version
        
    Returns:
        bool: True if version meets requirement
    """
    from packaging import version
    
    try:
        return version.parse(__version__) >= version.parse(required_version)
    except ImportError:
        # Fallback for simple version comparison
        def parse_version(v: str) -> tuple:
            return tuple(map(int, v.split('.')))
        
        return parse_version(__version__) >= parse_version(required_version)

# Export version check
__all__.append("check_version")

# Environment variables
class Environment:
    """Environment configuration helper"""
    
    @staticmethod
    def get_api_key() -> str:
        """Get API key from environment"""
        return os.getenv("API_KEY", "")
    
    @staticmethod
    def get_database_url() -> str:
        """Get database URL from environment"""
        return os.getenv("DATABASE_URL", "sqlite:///./data/database.db")
    
    @staticmethod
    def is_production() -> bool:
        """Check if running in production"""
        return os.getenv("ENVIRONMENT", "development") == "production"
    
    @staticmethod
    def get_allowed_origins() -> list:
        """Get allowed CORS origins"""
        origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000")
        return [origin.strip() for origin in origins.split(",")]

# Export environment helper
__all__.append("Environment")

# Clean up sys.path modification
if str(Path(__file__).parent.parent) in sys.path:
    sys.path.remove(str(Path(__file__).parent.parent))