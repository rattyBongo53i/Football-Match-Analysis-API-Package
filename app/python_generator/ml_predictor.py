# python_generator/ml_predictor.py

from collections import defaultdict
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
from dataclasses import dataclass
import logging
import pickle
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Try to import ML libraries (they may not be installed)
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.neural_network import MLPClassifier
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    from xgboost import XGBClassifier
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    logging.warning("ML libraries not available. Using fallback models.")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MLPrediction:
    """ML prediction results"""
    prediction: str  # 'home', 'draw', 'away'
    confidence: float
    probabilities: Dict[str, float]
    model_name: str
    features_used: List[str]
    feature_importance: Dict[str, float]
    model_metrics: Dict[str, float]
    explanation: Dict[str, Any]

@dataclass
class ModelPerformance:
    """Model performance metrics"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: Dict[str, Dict[str, int]]
    roc_auc: Optional[float]
    training_time: float
    inference_time: float

class MLPredictor:
    """Machine Learning predictor for football matches"""
    
    def __init__(self, model_dir: str = "./models"):
        self.model_dir = model_dir
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        
        # Model configurations
        self.config = {
            'models': {
                'random_forest': {
                    'enabled': True,
                    'n_estimators': 100,
                    'max_depth': 10,
                    'random_state': 42
                },
                'gradient_boosting': {
                    'enabled': True,
                    'n_estimators': 100,
                    'learning_rate': 0.1,
                    'max_depth': 5
                },
                'logistic_regression': {
                    'enabled': True,
                    'max_iter': 1000,
                    'random_state': 42
                },
                'neural_network': {
                    'enabled': ML_AVAILABLE,
                    'hidden_layer_sizes': (100, 50),
                    'max_iter': 1000,
                    'random_state': 42
                },
                'xgboost': {
                    'enabled': ML_AVAILABLE,
                    'n_estimators': 100,
                    'max_depth': 6,
                    'learning_rate': 0.1
                }
            },
            'training': {
                'test_size': 0.2,
                'random_state': 42,
                'cross_validation_folds': 5
            },
            'features': {
                'numeric': [
                    'form_advantage', 'momentum_advantage', 'goal_supremacy',
                    'home_expected_goals', 'away_expected_goals',
                    'h2h_home_advantage', 'strength_advantage',
                    'home_consistency', 'away_consistency'
                ],
                'categorical': [
                    'home_trend', 'away_trend', 'h2h_recent_trend'
                ]
            },
            'prediction': {
                'confidence_threshold': 0.6,
                'ensemble_weight': {
                    'random_forest': 0.3,
                    'gradient_boosting': 0.3,
                    'logistic_regression': 0.2,
                    'neural_network': 0.1,
                    'xgboost': 0.1
                }
            }
        }
        
        # Initialize models if ML is available
        if ML_AVAILABLE:
            self._initialize_models()
        else:
            logger.warning("ML libraries not available. Using statistical fallback.")
    
    def _initialize_models(self):
        """Initialize ML models"""
        try:
            if self.config['models']['random_forest']['enabled']:
                self.models['random_forest'] = RandomForestClassifier(
                    n_estimators=self.config['models']['random_forest']['n_estimators'],
                    max_depth=self.config['models']['random_forest']['max_depth'],
                    random_state=self.config['models']['random_forest']['random_state']
                )
            
            if self.config['models']['gradient_boosting']['enabled']:
                self.models['gradient_boosting'] = GradientBoostingClassifier(
                    n_estimators=self.config['models']['gradient_boosting']['n_estimators'],
                    learning_rate=self.config['models']['gradient_boosting']['learning_rate'],
                    max_depth=self.config['models']['gradient_boosting']['max_depth']
                )
            
            if self.config['models']['logistic_regression']['enabled']:
                self.models['logistic_regression'] = LogisticRegression(
                    max_iter=self.config['models']['logistic_regression']['max_iter'],
                    random_state=self.config['models']['logistic_regression']['random_state']
                )
            
            if self.config['models']['neural_network']['enabled']:
                self.models['neural_network'] = MLPClassifier(
                    hidden_layer_sizes=self.config['models']['neural_network']['hidden_layer_sizes'],
                    max_iter=self.config['models']['neural_network']['max_iter'],
                    random_state=self.config['models']['neural_network']['random_state']
                )
            
            if self.config['models']['xgboost']['enabled']:
                self.models['xgboost'] = XGBClassifier(
                    n_estimators=self.config['models']['xgboost']['n_estimators'],
                    max_depth=self.config['models']['xgboost']['max_depth'],
                    learning_rate=self.config['models']['xgboost']['learning_rate'],
                    random_state=42
                )
            
            # Initialize scaler
            self.scalers['standard'] = StandardScaler()
            
            logger.info(f"Initialized {len(self.models)} ML models")
            
        except Exception as e:
            logger.error(f"Error initializing ML models: {str(e)}")
            self.models = {}
    
    def predict(self, features: Dict[str, Any], 
                model_name: Optional[str] = None) -> MLPrediction:
        """
        Make prediction using ML model
        
        Args:
            features: Dictionary of feature values
            model_name: Specific model to use (None for ensemble)
            
        Returns:
            MLPrediction object with prediction results
        """
        try:
            if not self.models:
                logger.warning("No ML models available, using statistical fallback")
                return self._statistical_fallback(features)
            
            # Prepare features
            X = self._prepare_features(features)
            
            if model_name and model_name in self.models:
                # Use specific model
                prediction = self._predict_with_model(X, model_name)
            else:
                # Use ensemble prediction
                prediction = self._ensemble_prediction(X)
            
            logger.info(f"ML prediction: {prediction.prediction} with {prediction.confidence:.3f} confidence")
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error in ML prediction: {str(e)}")
            return self._statistical_fallback(features)
    
    def _prepare_features(self, features: Dict[str, Any]) -> np.ndarray:
        """Prepare features for ML model"""
        # Extract numeric features
        numeric_features = []
        for feature_name in self.config['features']['numeric']:
            value = features.get(feature_name, 0.0)
            # Handle missing values
            if value is None:
                value = 0.0
            numeric_features.append(float(value))
        
        # Handle categorical features (one-hot encoding simplified)
        categorical_features = []
        for feature_name in self.config['features']['categorical']:
            value = features.get(feature_name, 'unknown')
            # Simplified encoding - would need proper one-hot in production
            if value == 'improving':
                categorical_features.extend([1, 0, 0])
            elif value == 'declining':
                categorical_features.extend([0, 1, 0])
            else:  # stable or unknown
                categorical_features.extend([0, 0, 1])
        
        # Combine features
        all_features = numeric_features + categorical_features
        
        # Convert to numpy array
        X = np.array([all_features])
        
        # Scale features if scaler is fitted
        if hasattr(self.scalers['standard'], 'mean_'):
            X = self.scalers['standard'].transform(X)
        
        return X
    
    def _predict_with_model(self, X: np.ndarray, model_name: str) -> MLPrediction:
        """Make prediction with specific model"""
        model = self.models[model_name]
        
        # Get probabilities
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(X)[0]
        else:
            # Fallback for models without predict_proba
            prediction = model.predict(X)[0]
            probabilities = self._estimate_probabilities(prediction)
        
        # Get prediction
        prediction_idx = np.argmax(probabilities)
        prediction_map = {0: 'home', 1: 'draw', 2: 'away'}
        predicted_outcome = prediction_map.get(prediction_idx, 'draw')
        
        # Calculate confidence
        confidence = probabilities[prediction_idx]
        
        # Get feature importance if available
        feature_importance = self._get_feature_importance(model, model_name)
        
        # Generate explanation
        explanation = self._generate_explanation(
            predicted_outcome, confidence, probabilities, feature_importance
        )
        
        return MLPrediction(
            prediction=predicted_outcome,
            confidence=round(confidence, 3),
            probabilities={
                'home': round(probabilities[0], 3) if len(probabilities) > 0 else 0.33,
                'draw': round(probabilities[1], 3) if len(probabilities) > 1 else 0.34,
                'away': round(probabilities[2], 3) if len(probabilities) > 2 else 0.33
            },
            model_name=model_name,
            features_used=self.config['features']['numeric'] + self.config['features']['categorical'],
            feature_importance=feature_importance,
            model_metrics=self._get_model_metrics(model_name),
            explanation=explanation
        )
    
    def _ensemble_prediction(self, X: np.ndarray) -> MLPrediction:
        """Make ensemble prediction using multiple models"""
        predictions = []
        probabilities_list = []
        weights = []
        
        for model_name, model in self.models.items():
            # Get model weight
            weight = self.config['prediction']['ensemble_weight'].get(model_name, 0.1)
            
            # Get prediction
            if hasattr(model, 'predict_proba'):
                probs = model.predict_proba(X)[0]
            else:
                pred = model.predict(X)[0]
                probs = self._estimate_probabilities(pred)
            
            # Get predicted outcome
            pred_idx = np.argmax(probs)
            prediction_map = {0: 'home', 1: 'draw', 2: 'away'}
            pred_outcome = prediction_map.get(pred_idx, 'draw')
            
            predictions.append(pred_outcome)
            probabilities_list.append(probs)
            weights.append(weight)
        
        # Weighted ensemble probabilities
        ensemble_probs = np.zeros(3)
        for probs, weight in zip(probabilities_list, weights):
            ensemble_probs += probs * weight
        
        # Normalize
        ensemble_probs /= np.sum(ensemble_probs)
        
        # Get ensemble prediction
        pred_idx = np.argmax(ensemble_probs)
        prediction_map = {0: 'home', 1: 'draw', 2: 'away'}
        predicted_outcome = prediction_map.get(pred_idx, 'draw')
        
        # Calculate confidence
        confidence = ensemble_probs[pred_idx]
        
        # Get combined feature importance
        combined_importance = self._get_combined_feature_importance()
        
        # Generate ensemble explanation
        explanation = self._generate_ensemble_explanation(
            predictions, weights, predicted_outcome, confidence, ensemble_probs
        )
        
        return MLPrediction(
            prediction=predicted_outcome,
            confidence=round(confidence, 3),
            probabilities={
                'home': round(ensemble_probs[0], 3),
                'draw': round(ensemble_probs[1], 3),
                'away': round(ensemble_probs[2], 3)
            },
            model_name='ensemble',
            features_used=self.config['features']['numeric'] + self.config['features']['categorical'],
            feature_importance=combined_importance,
            model_metrics=self._get_ensemble_metrics(),
            explanation=explanation
        )
    
    def _estimate_probabilities(self, prediction: str) -> np.ndarray:
        """Estimate probabilities for models without predict_proba"""
        if prediction == 'home':
            return np.array([0.6, 0.25, 0.15])
        elif prediction == 'draw':
            return np.array([0.25, 0.5, 0.25])
        else:  # away
            return np.array([0.15, 0.25, 0.6])
    
    def _get_feature_importance(self, model, model_name: str) -> Dict[str, float]:
        """Get feature importance from model"""
        feature_names = self.config['features']['numeric']
        
        if hasattr(model, 'feature_importances_'):
            # Tree-based models
            importances = model.feature_importances_
            # Pad for categorical features
            if len(importances) < len(feature_names):
                importances = list(importances) + [0] * (len(feature_names) - len(importances))
            
            importance_dict = {}
            for i, feature in enumerate(feature_names):
                if i < len(importances):
                    importance_dict[feature] = round(float(importances[i]), 4)
                else:
                    importance_dict[feature] = 0.0
        
        elif hasattr(model, 'coef_'):
            # Linear models
            if len(model.coef_.shape) > 1:
                # Multi-class
                importances = np.mean(np.abs(model.coef_), axis=0)
            else:
                importances = np.abs(model.coef_)
            
            importance_dict = {}
            for i, feature in enumerate(feature_names):
                if i < len(importances):
                    importance_dict[feature] = round(float(importances[i]), 4)
                else:
                    importance_dict[feature] = 0.0
        
        else:
            # No feature importance available
            importance_dict = {feature: 0.0 for feature in feature_names}
        
        # Sort by importance
        sorted_importance = dict(sorted(
            importance_dict.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return sorted_importance
    
    def _get_combined_feature_importance(self) -> Dict[str, float]:
        """Get combined feature importance from all models"""
        if not self.models:
            return {}
        
        combined = defaultdict(float)
        model_count = 0
        
        for model_name, model in self.models.items():
            importance = self._get_feature_importance(model, model_name)
            for feature, imp in importance.items():
                combined[feature] += imp
            model_count += 1
        
        # Average
        if model_count > 0:
            for feature in combined:
                combined[feature] /= model_count
        
        # Sort by importance
        sorted_combined = dict(sorted(
            combined.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return {k: round(v, 4) for k, v in sorted_combined.items()}
    
    def _generate_explanation(self, prediction: str, confidence: float,
                            probabilities: np.ndarray, 
                            feature_importance: Dict[str, float]) -> Dict[str, Any]:
        """Generate explanation for the prediction"""
        
        explanation = {
            'key_factors': [],
            'confidence_level': 'medium',
            'risk_assessment': 'balanced',
            'model_insights': []
        }
        
        # Determine confidence level
        if confidence >= 0.7:
            explanation['confidence_level'] = 'high'
        elif confidence >= 0.55:
            explanation['confidence_level'] = 'medium'
        else:
            explanation['confidence_level'] = 'low'
        
        # Determine risk level
        max_prob = max(probabilities)
        if max_prob >= 0.6 and confidence >= 0.7:
            explanation['risk_assessment'] = 'low'
        elif max_prob >= 0.5 and confidence >= 0.55:
            explanation['risk_assessment'] = 'medium'
        else:
            explanation['risk_assessment'] = 'high'
        
        # Add key factors based on feature importance
        top_features = list(feature_importance.items())[:3]
        for feature, importance in top_features:
            if importance > 0.1:  # Only include meaningful factors
                explanation['key_factors'].append({
                    'feature': feature,
                    'importance': importance,
                    'description': self._describe_feature(feature)
                })
        
        # Add probability insights
        prob_diff = max(probabilities) - sorted(probabilities)[-2]  # Difference between top and second
        if prob_diff > 0.2:
            explanation['model_insights'].append('Clear favorite identified by model')
        elif prob_diff < 0.1:
            explanation['model_insights'].append('Close match predicted')
        
        # Add confidence insights
        if confidence > 0.8:
            explanation['model_insights'].append('High model confidence in prediction')
        elif confidence < 0.55:
            explanation['model_insights'].append('Low model confidence - prediction uncertain')
        
        return explanation
    
    def _generate_ensemble_explanation(self, predictions: List[str], 
                                     weights: List[float],
                                     final_prediction: str,
                                     confidence: float,
                                     probabilities: np.ndarray) -> Dict[str, Any]:
        """Generate explanation for ensemble prediction"""
        
        explanation = self._generate_explanation(final_prediction, confidence, 
                                               probabilities, {})
        
        # Add ensemble-specific insights
        explanation['ensemble_details'] = {
            'model_count': len(predictions),
            'agreement_level': self._calculate_agreement_level(predictions, final_prediction),
            'weight_distribution': {
                model_name: weight 
                for model_name, weight in zip(self.models.keys(), weights)
            }
        }
        
        # Check for model disagreement
        unique_predictions = set(predictions)
        if len(unique_predictions) > 1:
            explanation['model_insights'].append(
                f"Models disagree: {', '.join(unique_predictions)} predictions"
            )
        else:
            explanation['model_insights'].append("All models agree on prediction")
        
        return explanation
    
    def _calculate_agreement_level(self, predictions: List[str], 
                                 final_prediction: str) -> float:
        """Calculate level of agreement among models"""
        if not predictions:
            return 0.0
        
        agreement = sum(1 for pred in predictions if pred == final_prediction)
        return round(agreement / len(predictions), 3)
    
    def _describe_feature(self, feature_name: str) -> str:
        """Get description for a feature"""
        descriptions = {
            'form_advantage': 'Difference in recent form between teams',
            'momentum_advantage': 'Difference in form momentum/trend',
            'goal_supremacy': 'Expected goal difference',
            'home_expected_goals': 'Home team expected goals',
            'away_expected_goals': 'Away team expected goals',
            'h2h_home_advantage': 'Historical head-to-head advantage',
            'strength_advantage': 'Overall team strength difference',
            'home_consistency': 'Home team form consistency',
            'away_consistency': 'Away team form consistency',
            'home_trend': 'Home team recent form trend',
            'away_trend': 'Away team recent form trend',
            'h2h_recent_trend': 'Recent head-to-head trend'
        }
        
        return descriptions.get(feature_name, 'Match feature')
    
    def _get_model_metrics(self, model_name: str) -> Dict[str, float]:
        """Get model performance metrics (simplified - would be loaded from training)"""
        # In production, these would be loaded from model metadata
        return {
            'training_accuracy': 0.0,
            'validation_accuracy': 0.0,
            'precision': 0.0,
            'recall': 0.0,
            'f1_score': 0.0,
            'last_trained': datetime.now().isoformat()
        }
    
    def _get_ensemble_metrics(self) -> Dict[str, float]:
        """Get ensemble model metrics"""
        return {
            'component_models': len(self.models),
            'weighted_average_accuracy': 0.0,
            'ensemble_diversity': 0.0,
            'last_updated': datetime.now().isoformat()
        }
    
    def _statistical_fallback(self, features: Dict[str, Any]) -> MLPrediction:
        """Fallback prediction when ML is not available"""
        logger.warning("Using statistical fallback prediction")
        
        # Simple statistical prediction based on key features
        form_advantage = features.get('form_advantage', 0.0)
        goal_supremacy = features.get('goal_supremacy', 0.0)
        h2h_advantage = features.get('h2h_home_advantage', 0.0)
        
        # Calculate simple probabilities
        home_base = 0.33 + form_advantage * 0.1 + goal_supremacy * 0.05 + h2h_advantage * 0.15
        away_base = 0.33 - form_advantage * 0.1 - goal_supremacy * 0.05 - h2h_advantage * 0.15
        draw_base = 0.34
        
        # Normalize
        total = home_base + draw_base + away_base
        home_prob = home_base / total
        draw_prob = draw_base / total
        away_prob = away_base / total
        
        # Determine prediction
        probabilities = [home_prob, draw_prob, away_prob]
        pred_idx = np.argmax(probabilities)
        prediction_map = {0: 'home', 1: 'draw', 2: 'away'}
        predicted_outcome = prediction_map.get(pred_idx, 'draw')
        
        # Calculate confidence
        confidence = probabilities[pred_idx]
        
        return MLPrediction(
            prediction=predicted_outcome,
            confidence=round(confidence, 3),
            probabilities={
                'home': round(home_prob, 3),
                'draw': round(draw_prob, 3),
                'away': round(away_prob, 3)
            },
            model_name='statistical_fallback',
            features_used=list(features.keys()),
            feature_importance=self._get_statistical_feature_importance(features),
            model_metrics={'method': 'statistical_fallback'},
            explanation={
                'key_factors': ['Using statistical fallback (ML not available)'],
                'confidence_level': 'medium',
                'risk_assessment': 'high',
                'model_insights': ['Proceed with caution - using basic statistical model']
            }
        )
    
    def _get_statistical_feature_importance(self, features: Dict[str, Any]) -> Dict[str, float]:
        """Get feature importance for statistical fallback"""
        # Simple importance based on absolute values
        importance = {}
        for feature, value in features.items():
            if isinstance(value, (int, float)):
                importance[feature] = round(abs(value), 4)
            else:
                importance[feature] = 0.0
        
        # Sort by importance
        sorted_importance = dict(sorted(
            importance.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return sorted_importance
    
    # Model training methods (simplified - would be more complex in production)
    
    def train_model(self, training_data: List[Dict[str, Any]], 
                   target_data: List[str],
                   model_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Train ML model on provided data
        
        Args:
            training_data: List of feature dictionaries
            target_data: List of target outcomes ('home', 'draw', 'away')
            model_name: Specific model to train (None for all)
            
        Returns:
            Training results
        """
        if not ML_AVAILABLE:
            return {
                'success': False,
                'error': 'ML libraries not available',
                'models_trained': 0
            }
        
        try:
            logger.info(f"Starting model training with {len(training_data)} samples")
            
            # Prepare data
            X, y = self._prepare_training_data(training_data, target_data)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=self.config['training']['test_size'],
                random_state=self.config['training']['random_state']
            )
            
            # Scale features
            self.scalers['standard'].fit(X_train)
            X_train_scaled = self.scalers['standard'].transform(X_train)
            X_test_scaled = self.scalers['standard'].transform(X_test)
            
            # Train models
            trained_models = []
            performances = {}
            
            models_to_train = [model_name] if model_name else list(self.models.keys())
            
            for model_name in models_to_train:
                if model_name in self.models:
                    logger.info(f"Training {model_name}")
                    
                    model = self.models[model_name]
                    
                    # Train model
                    import time
                    start_time = time.time()
                    model.fit(X_train_scaled, y_train)
                    training_time = time.time() - start_time
                    
                    # Evaluate
                    start_time = time.time()
                    y_pred = model.predict(X_test_scaled)
                    inference_time = time.time() - start_time
                    
                    # Calculate metrics
                    accuracy = accuracy_score(y_test, y_pred)
                    precision = precision_score(y_test, y_pred, average='weighted')
                    recall = recall_score(y_test, y_pred, average='weighted')
                    f1 = f1_score(y_test, y_pred, average='weighted')
                    
                    # Confusion matrix
                    from sklearn.metrics import confusion_matrix
                    cm = confusion_matrix(y_test, y_pred)
                    
                    performances[model_name] = ModelPerformance(
                        accuracy=round(accuracy, 4),
                        precision=round(precision, 4),
                        recall=round(recall, 4),
                        f1_score=round(f1, 4),
                        confusion_matrix=self._format_confusion_matrix(cm),
                        roc_auc=None,  # Would need probability scores
                        training_time=round(training_time, 4),
                        inference_time=round(inference_time, 6)
                    )
                    
                    trained_models.append(model_name)
                    
                    logger.info(f"{model_name} trained - Accuracy: {accuracy:.4f}")
            
            # Save models
            self._save_models(trained_models)
            
            return {
                'success': True,
                'models_trained': trained_models,
                'performances': performances,
                'training_samples': len(training_data),
                'test_samples': len(X_test),
                'feature_count': X.shape[1]
            }
            
        except Exception as e:
            logger.error(f"Error in model training: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'models_trained': 0
            }
    
    def _prepare_training_data(self, training_data: List[Dict[str, Any]], 
                             target_data: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data for ML models"""
        X = []
        y = []
        
        # Map target labels to integers
        label_map = {'home': 0, 'draw': 1, 'away': 2}
        
        for features, target in zip(training_data, target_data):
            # Prepare features
            x_vector = self._prepare_features(features)[0]  # Remove batch dimension
            X.append(x_vector)
            
            # Prepare target
            y.append(label_map.get(target, 1))  # Default to draw
        
        return np.array(X), np.array(y)
    
    def _format_confusion_matrix(self, cm: np.ndarray) -> Dict[str, Dict[str, int]]:
        """Format confusion matrix for JSON serialization"""
        labels = ['home', 'draw', 'away']
        result = {}
        
        for i, true_label in enumerate(labels):
            result[true_label] = {}
            for j, pred_label in enumerate(labels):
                result[true_label][pred_label] = int(cm[i, j])
        
        return result
    
    def _save_models(self, model_names: List[str]):
        """Save trained models to disk"""
        try:
            import os
            os.makedirs(self.model_dir, exist_ok=True)
            
            for model_name in model_names:
                if model_name in self.models:
                    model_path = os.path.join(self.model_dir, f"{model_name}.pkl")
                    with open(model_path, 'wb') as f:
                        pickle.dump(self.models[model_name], f)
                    
                    # Save metadata
                    metadata = {
                        'model_name': model_name,
                        'trained_at': datetime.now().isoformat(),
                        'feature_columns': self.feature_columns,
                        'config': self.config['models'][model_name]
                    }
                    
                    metadata_path = os.path.join(self.model_dir, f"{model_name}_metadata.json")
                    with open(metadata_path, 'w') as f:
                        json.dump(metadata, f, indent=2)
            
            logger.info(f"Saved {len(model_names)} models to {self.model_dir}")
            
        except Exception as e:
            logger.error(f"Error saving models: {str(e)}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            import os
            if not os.path.exists(self.model_dir):
                logger.warning(f"Model directory {self.model_dir} does not exist")
                return False
            
            loaded_count = 0
            for filename in os.listdir(self.model_dir):
                if filename.endswith('.pkl'):
                    model_name = filename.replace('.pkl', '')
                    model_path = os.path.join(self.model_dir, filename)
                    
                    with open(model_path, 'rb') as f:
                        self.models[model_name] = pickle.load(f)
                    
                    loaded_count += 1
                    logger.info(f"Loaded model: {model_name}")
            
            logger.info(f"Loaded {loaded_count} models from {self.model_dir}")
            return loaded_count > 0
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about available models"""
        model_info = {
            'available_models': list(self.models.keys()),
            'ml_available': ML_AVAILABLE,
            'model_dir': self.model_dir,
            'config': self.config,
            'feature_count': len(self.config['features']['numeric']) + 
                           len(self.config['features']['categorical']) * 3,  # One-hot encoded
            'last_updated': datetime.now().isoformat()
        }
        
        return model_info