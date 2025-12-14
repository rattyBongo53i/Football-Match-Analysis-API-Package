"""
Common utility functions.
"""

def validate_email(email: str) -> bool:
    """Simple email validation."""
    return "@" in email and "." in email

def format_odds(odds: float) -> str:
    """Format odds to 2 decimal places."""
    return f"{odds:.2f}"

def calculate_payout(stake: float, odds: float) -> float:
    """Calculate potential payout."""
    return stake * odds

# Export
__all__ = ["validate_email", "format_odds", "calculate_payout"]