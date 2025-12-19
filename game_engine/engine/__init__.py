# game_engine/engine/__init__.py

"""
Engine Sub-package
Contains the core analytical and quantitative modules for:
- Probability estimation
- Monte Carlo simulations
- Coverage & Risk optimization
- Scoring & Expected Value (EV)
"""

from .probability import ProbabilityEngine
from .monte_carlo import MonteCarloSimulator
from .coverage import CoverageOptimizer
from .slip_builder import SlipBuilder
from .scoring import ScoringEngine

# Define the public interface for the engine.
# This ensures a clean, predictable API for the orchestrator.
__all__ = [
    "ProbabilityEngine",
    "MonteCarloSimulator",
    "CoverageOptimizer",
    "SlipBuilder",
    "ScoringEngine",
]