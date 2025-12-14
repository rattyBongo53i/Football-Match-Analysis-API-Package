import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import joblib
import json
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class MatchOutcomePredictor:
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.model_path = model_path
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
    
    def _build_model(self, input_dim: int, output_dim: int = 3):
        """Build neural network for outcome prediction."""
        model = models.Sequential([
            layers.Dense(128, activation='relu', input_shape=(input_dim,)),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            
            layers.Dense(64, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.2),
            
            layers.Dense(32, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.1),
            
            layers.Dense(output_dim, activation='softmax')
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
        )
        
        return model
    
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        epochs: int = 100,
        batch_size: int = 32,
        feature_names: Optional[List[str]] = None
    ):
        """Train the neural network."""
        logger.info(f"Training model with {X_train.shape[0]} samples, {X_train.shape[1]} features")
        
        if self.model is None:
            self.model = self._build_model(X_train.shape[1], y_train.shape[1])
        
        self.feature_names = feature_names
        
        # Callbacks
        callbacks_list = [
            callbacks.EarlyStopping(
                monitor='val_loss' if X_val is not None else 'loss',
                patience=20,
                restore_best_weights=True
            ),
            callbacks.ReduceLROnPlateau(
                monitor='val_loss' if X_val is not None else 'loss',
                factor=0.5,
                patience=10,
                min_lr=1e-6
            ),
            callbacks.ModelCheckpoint(
                'best_model.h5' if not self.model_path else f"{self.model_path}_best.h5",
                monitor='val_loss' if X_val is not None else 'loss',
                save_best_only=True
            )
        ]
        
        # Training
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val) if X_val is not None else None,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks_list,
            verbose=1
        )
        
        logger.info("Training completed")
        return history
    
    def predict_proba(self, features: np.ndarray) -> np.ndarray:
        """Predict outcome probabilities."""
        if self.model is None:
            raise ValueError("Model not trained or loaded")
        
        if self.scaler is not None:
            features = self.scaler.transform(features)
        
        return self.model.predict(features, verbose=0)
    
    def predict_match(
        self, 
        match_features: Dict[str, float],
        market_type: str = "MATCH_RESULT"
    ) -> Dict[str, float]:
        """Predict specific match outcomes."""
        
        # Convert features to array in correct order
        if self.feature_names:
            X = np.array([[match_features.get(feature, 0.0) for feature in self.feature_names]])
        else:
            X = np.array([list(match_features.values())])
        
        predictions = self.predict_proba(X)[0]
        
        # Map predictions based on market type
        if market_type == "MATCH_RESULT":
            return {
                'home_win': float(predictions[0]),
                'draw': float(predictions[1]),
                'away_win': float(predictions[2])
            }
        elif market_type == "BTTS":
            return {
                'yes': float(predictions[0]),
                'no': float(predictions[1])
            }
        elif market_type == "OVER_UNDER_2_5":
            return {
                'over': float(predictions[0]),
                'under': float(predictions[1])
            }
        else:
            # Default: return as is
            return {f'outcome_{i}': float(pred) for i, pred in enumerate(predictions)}
    
    def predict_match_market(
        self, 
        match_id: int, 
        market_id: int,
        match_features: Optional[Dict[str, float]] = None
    ) -> Dict[str, float]:
        """Predict outcomes for specific match and market."""
        
        # This should be implemented based on your feature extraction
        # For now, return dummy predictions
        if match_features is None:
            match_features = self._extract_match_features(match_id, market_id)
        
        # Determine market type from market_id (you'd need market info)
        market_type = "MATCH_RESULT"  # Default
        
        return self.predict_match(match_features, market_type)
    
    def _extract_match_features(self, match_id: int, market_id: int) -> Dict[str, float]:
        """Extract features for a specific match and market."""
        # This should query your database and extract relevant features
        # For now, return dummy features
        features = {
            'home_team_rating': np.random.random(),
            'away_team_rating': np.random.random(),
            'home_form': np.random.random(),
            'away_form': np.random.random(),
            'h2h_home_win_rate': np.random.random(),
            'h2h_draw_rate': np.random.random(),
            'home_goals_scored_avg': np.random.random() * 3,
            'away_goals_scored_avg': np.random.random() * 3,
            'home_goals_conceded_avg': np.random.random() * 2,
            'away_goals_conceded_avg': np.random.random() * 2,
            'league_strength': np.random.random(),
            'match_importance': np.random.random()
        }
        
        return features
    
    def save_model(self, path: str):
        """Save model and scaler."""
        if self.model is None:
            raise ValueError("No model to save")
        
        # Save Keras model
        self.model.save(path)
        
        # Save scaler and feature names if they exist
        save_data = {
            'feature_names': self.feature_names,
            'model_info': {
                'input_dim': self.model.input_shape[1],
                'output_dim': self.model.output_shape[1],
                'created_at': datetime.now().isoformat()
            }
        }
        
        if self.scaler is not None:
            joblib.dump(self.scaler, f"{path}_scaler.pkl")
        
        with open(f"{path}_info.json", 'w') as f:
            json.dump(save_data, f)
        
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load model and scaler."""
        try:
            self.model = tf.keras.models.load_model(path)
            
            # Load scaler if exists
            scaler_path = f"{path}_scaler.pkl"
            if Path(scaler_path).exists():
                self.scaler = joblib.load(scaler_path)
            
            # Load feature names
            info_path = f"{path}_info.json"
            if Path(info_path).exists():
                with open(info_path, 'r') as f:
                    info = json.load(f)
                    self.feature_names = info.get('feature_names')
            
            logger.info(f"Model loaded from {path}")
            
        except Exception as e:
            logger.error(f"Error loading model from {path}: {e}")
            raise
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance using permutation importance."""
        # This is a simplified version
        # In production, use proper permutation importance calculation
        if self.feature_names is None or self.model is None:
            return {}
        
        # Return random importance for demo
        return {feature: np.random.random() for feature in self.feature_names}