# game_engine/engine/__init__.py

"""
Engine Package
The central hub for all quantitative betting logic.
This package exposes modules for probability estimation, Monte Carlo 
simulations, risk coverage, and statistical scoring.
"""

from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer
from .slip_builder import SlipBuilder
from .scoring import ScoringEngine
from .math_utils import MathUtils
from .helpers import EngineHelpers

# Explicitly defining the public API for the engine package.
# This prevents internal logic from leaking into the API or Laravel-facing layers.
__all__ = [
    "ProbabilityEngine",
    "MonteCarloSimulator",
    "CoverageOptimizer",
    "SlipBuilder",
    "ScoringEngine",
    "MathUtils",
    "EngineHelpers",
]