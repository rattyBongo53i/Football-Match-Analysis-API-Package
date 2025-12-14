# app/services/user_service.py (updated)
"""
Service for user-related operations.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import hashlib
import hmac

logger = logging.getLogger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """Service for user operations."""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.logger = logging.getLogger(__name__)
        self.logger.info("UserService initialized")
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            self.logger.error(f"Password verification error: {e}")
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    def create_access_token(
        self,
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create a simple access token (simplified version without JOSE).
        
        Args:
            data: Data to encode in the token
            expires_delta: Optional expiration time delta
            
        Returns:
            Simple token string
        """
        try:
            # Try to use python-jose if available
            from jose import jwt
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=30)
            
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            
            return encoded_jwt
        except ImportError:
            # Fallback to simple token if python-jose is not installed
            self.logger.warning("python-jose not installed, using simple token")
            
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=30)
            
            # Create a simple hash-based token
            token_data = f"{data.get('sub', '')}:{expire.timestamp()}"
            signature = hmac.new(
                self.secret_key.encode(),
                token_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return f"{token_data}.{signature}"
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user.
        
        Args:
            username: Username
            password: Password
            
        Returns:
            User data if authenticated, None otherwise
        """
        self.logger.info(f"Authenticating user: {username}")
        
        # Placeholder implementation
        # In a real app, you would:
        # 1. Query user from database
        # 2. Verify password hash
        # 3. Return user data
        
        if username == "admin" and password == "admin123":
            return {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "full_name": "Admin User",
                "is_active": True
            }
        
        return None
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a token.
        
        Args:
            token: Token string
            
        Returns:
            Token data if valid, None otherwise
        """
        try:
            # Try to use python-jose if available
            from jose import jwt, JWTError
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
                return payload
            except JWTError as e:
                self.logger.error(f"JWT validation error: {e}")
                return None
        except ImportError:
            # Simple validation for fallback tokens
            self.logger.warning("python-jose not installed, using simple token validation")
            
            try:
                if '.' not in token:
                    return None
                
                token_data, signature = token.rsplit('.', 1)
                expected_signature = hmac.new(
                    self.secret_key.encode(),
                    token_data.encode(),
                    hashlib.sha256
                ).hexdigest()
                
                if hmac.compare_digest(signature, expected_signature):
                    # Token is valid, parse basic data
                    user_id, expire_timestamp = token_data.split(':', 1)
                    expire_time = datetime.fromtimestamp(float(expire_timestamp))
                    
                    if datetime.utcnow() < expire_time:
                        return {"sub": user_id, "exp": expire_timestamp}
                
                return None
            except Exception as e:
                self.logger.error(f"Token validation error: {e}")
                return None

__all__ = ["UserService"]