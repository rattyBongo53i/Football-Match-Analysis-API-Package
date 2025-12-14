
"""
Utility functions.
"""

def validate_email(email):
    return "@" in email

def format_odds(odds):
    return f"{odds:.2f}"

__all__ = ["validate_email", "format_odds"]
