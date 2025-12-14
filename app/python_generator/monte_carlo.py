# python_generator/monte_carlo.py

import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
import logging
import random
from collections import defaultdict
import math

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MonteCarloResult:
    """Results from Monte Carlo simulation"""
    win_probability: float
    expected_value: float
    confidence_interval: Tuple[float, float]
    risk_metrics: Dict[str, float]
    distribution: Dict[str, float]
    iterations: int
    convergence_rate: float

class MonteCarloSimulator:
    """Monte Carlo simulation for betting analysis"""
    
    def __init__(self):
        self.config = {
            'default_iterations': 10000,
            'convergence_threshold': 0.01,
            'min_iterations': 1000,
            'max_iterations': 100000,
            'confidence_level': 0.95,
            'risk_free_rate': 0.0,
            'bankroll_fraction': 0.05  # Maximum fraction of bankroll to risk
        }
        
        # Probability distribution models
        self.distribution_models = {
            'normal': self._normal_distribution,
            'poisson': self._poisson_distribution,
            'beta': self._beta_distribution,
            'triangular': self._triangular_distribution
        }
    
    def simulate_slip(self, slip_data: Dict[str, Any], 
                     iterations: Optional[int] = None) -> MonteCarloResult:
        """
        Run Monte Carlo simulation for a betting slip
        
        Args:
            slip_data: Dictionary containing slip information
            iterations: Number of simulation iterations
            
        Returns:
            MonteCarloResult with simulation outcomes
        """
        try:
            logger.info(f"Starting Monte Carlo simulation for slip")
            
            # Set iterations
            iterations = iterations or self.config['default_iterations']
            iterations = max(self.config['min_iterations'], 
                           min(self.config['max_iterations'], iterations))
            
            # Extract slip information
            matches = slip_data.get('matches', [])
            stake = slip_data.get('stake', 1.0)
            total_odds = slip_data.get('total_odds', 1.0)
            
            if not matches:
                raise ValueError("No matches in slip data")
            
            # Run simulation
            results = self._run_simulation(matches, stake, total_odds, iterations)
            
            # Analyze results
            win_probability = results['wins'] / iterations
            expected_value = np.mean(results['payouts'])
            
            # Calculate confidence interval
            ci_lower, ci_upper = self._calculate_confidence_interval(
                results['payouts'], self.config['confidence_level']
            )
            
            # Calculate risk metrics
            risk_metrics = self._calculate_risk_metrics(results['payouts'], stake, total_odds)
            
            # Calculate payout distribution
            distribution = self._calculate_payout_distribution(results['payouts'])
            
            # Check convergence
            convergence_rate = self._check_convergence(results['payouts'])
            
            logger.info(f"Monte Carlo simulation completed: {win_probability:.3f} win probability")
            
            return MonteCarloResult(
                win_probability=round(win_probability, 4),
                expected_value=round(expected_value, 4),
                confidence_interval=(round(ci_lower, 2), round(ci_upper, 2)),
                risk_metrics=risk_metrics,
                distribution=distribution,
                iterations=iterations,
                convergence_rate=round(convergence_rate, 4)
            )
            
        except Exception as e:
            logger.error(f"Error in Monte Carlo simulation: {str(e)}")
            raise
    
    def _run_simulation(self, matches: List[Dict[str, Any]], 
                       stake: float, total_odds: float, 
                       iterations: int) -> Dict[str, Any]:
        """Run the Monte Carlo simulation"""
        
        wins = 0
        payouts = []
        match_results = []
        
        for i in range(iterations):
            slip_wins = True
            match_outcomes = []
            
            for match in matches:
                # Simulate match outcome
                outcome = self._simulate_match_outcome(match)
                match_outcomes.append(outcome)
                
                # Check if this match would win the bet
                predicted = match.get('prediction', 'home')
                if outcome != predicted:
                    slip_wins = False
            
            # Calculate payout
            if slip_wins:
                payout = stake * total_odds
                wins += 1
            else:
                payout = 0  # Lost stake
            
            payouts.append(payout)
            match_results.append(match_outcomes)
        
        return {
            'wins': wins,
            'payouts': np.array(payouts),
            'match_results': match_results,
            'iterations': iterations
        }
    
    def _simulate_match_outcome(self, match: Dict[str, Any]) -> str:
        """Simulate outcome of a single match"""
        
        # Get probabilities for each outcome
        probabilities = match.get('probabilities', {})
        home_prob = probabilities.get('home', 0.33)
        draw_prob = probabilities.get('draw', 0.34)
        away_prob = probabilities.get('away', 0.33)
        
        # Normalize probabilities
        total = home_prob + draw_prob + away_prob
        home_prob /= total
        draw_prob /= total
        away_prob /= total
        
        # Generate random number
        rand = random.random()
        
        # Determine outcome based on probabilities
        if rand < home_prob:
            return 'home'
        elif rand < home_prob + draw_prob:
            return 'draw'
        else:
            return 'away'
    
    def _calculate_confidence_interval(self, payouts: np.ndarray, 
                                     confidence_level: float) -> Tuple[float, float]:
        """Calculate confidence interval for expected payout"""
        if len(payouts) < 2:
            return (0.0, 0.0)
        
        mean = np.mean(payouts)
        std_err = np.std(payouts) / np.sqrt(len(payouts))
        
        # Z-score for confidence level (simplified)
        z_score = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        }.get(confidence_level, 1.96)
        
        margin = z_score * std_err
        
        return (mean - margin, mean + margin)
    
    def _calculate_risk_metrics(self, payouts: np.ndarray, 
                              stake: float, total_odds: float) -> Dict[str, float]:
        """Calculate various risk metrics"""
        
        mean_payout = np.mean(payouts)
        std_payout = np.std(payouts)
        
        # Calculate Value at Risk (VaR) at 95% confidence
        sorted_payouts = np.sort(payouts)
        var_index = int(0.05 * len(sorted_payouts))
        var_95 = sorted_payouts[var_index] if var_index < len(sorted_payouts) else 0
        
        # Calculate Conditional VaR (Expected Shortfall)
        cvar_95 = np.mean(sorted_payouts[:var_index]) if var_index > 0 else 0
        
        # Calculate Sharpe Ratio (simplified)
        excess_return = mean_payout - stake
        sharpe_ratio = excess_return / std_payout if std_payout > 0 else 0
        
        # Calculate Sortino Ratio (only downside deviation)
        downside_payouts = payouts[payouts < mean_payout]
        downside_std = np.std(downside_payouts) if len(downside_payouts) > 0 else 0
        sortino_ratio = excess_return / downside_std if downside_std > 0 else 0
        
        # Calculate maximum drawdown
        cumulative = np.cumsum(payouts - stake)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = running_max - cumulative
        max_drawdown = np.max(drawdown) if len(drawdown) > 0 else 0
        
        # Calculate win rate and loss rate
        wins = np.sum(payouts > stake)
        losses = len(payouts) - wins
        win_rate = wins / len(payouts) if len(payouts) > 0 else 0
        
        # Calculate average win and loss
        win_amounts = payouts[payouts > stake]
        loss_amounts = payouts[payouts <= stake]
        
        avg_win = np.mean(win_amounts) if len(win_amounts) > 0 else 0
        avg_loss = np.mean(loss_amounts) if len(loss_amounts) > 0 else 0
        
        # Calculate profit factor
        total_wins = np.sum(win_amounts) if len(win_amounts) > 0 else 0
        total_losses = np.sum(loss_amounts) if len(loss_amounts) > 0 else 0
        profit_factor = total_wins / total_losses if total_losses > 0 else float('inf')
        
        return {
            'mean_payout': round(mean_payout, 4),
            'std_payout': round(std_payout, 4),
            'var_95': round(var_95, 4),
            'cvar_95': round(cvar_95, 4),
            'sharpe_ratio': round(sharpe_ratio, 4),
            'sortino_ratio': round(sortino_ratio, 4),
            'max_drawdown': round(max_drawdown, 4),
            'win_rate': round(win_rate, 4),
            'avg_win': round(avg_win, 4),
            'avg_loss': round(avg_loss, 4),
            'profit_factor': round(profit_factor, 4),
            'expected_return': round(mean_payout - stake, 4),
            'risk_return_ratio': round((mean_payout - stake) / std_payout if std_payout > 0 else 0, 4)
        }
    
    def _calculate_payout_distribution(self, payouts: np.ndarray) -> Dict[str, float]:
        """Calculate payout distribution statistics"""
        if len(payouts) == 0:
            return {}
        
        # Calculate percentiles
        percentiles = [0, 10, 25, 50, 75, 90, 100]
        percentile_values = np.percentile(payouts, percentiles)
        
        distribution = {}
        for p, val in zip(percentiles, percentile_values):
            distribution[f'percentile_{p}'] = round(val, 2)
        
        # Add skewness and kurtosis
        if len(payouts) > 2:
            from scipy import stats
            distribution['skewness'] = round(stats.skew(payouts), 4)
            distribution['kurtosis'] = round(stats.kurtosis(payouts), 4)
        
        # Add mode (most common payout)
        unique, counts = np.unique(payouts, return_counts=True)
        mode_index = np.argmax(counts)
        distribution['mode'] = round(unique[mode_index], 2)
        
        return distribution
    
    def _check_convergence(self, payouts: np.ndarray) -> float:
        """Check if simulation has converged"""
        if len(payouts) < 100:
            return 0.0
        
        # Calculate running mean and check stability
        running_means = np.cumsum(payouts) / np.arange(1, len(payouts) + 1)
        
        # Check last 10% of iterations
        check_start = int(0.9 * len(running_means))
        last_means = running_means[check_start:]
        
        if len(last_means) < 2:
            return 0.0
        
        # Calculate coefficient of variation in last segment
        std_last = np.std(last_means)
        mean_last = np.mean(last_means)
        
        if mean_last == 0:
            return 0.0
        
        cv = std_last / mean_last
        convergence = 1 - min(1.0, cv)  # 1 = perfect convergence
        
        return convergence
    
    def simulate_multiple_slips(self, slips: List[Dict[str, Any]], 
                              iterations: Optional[int] = None) -> Dict[str, Any]:
        """
        Compare multiple slips using Monte Carlo simulation
        
        Args:
            slips: List of slip data dictionaries
            iterations: Number of simulation iterations per slip
            
        Returns:
            Dictionary with comparative analysis
        """
        try:
            logger.info(f"Starting comparative Monte Carlo simulation for {len(slips)} slips")
            
            results = []
            iterations = iterations or self.config['default_iterations']
            
            for i, slip in enumerate(slips):
                logger.info(f"Simulating slip {i+1}/{len(slips)}")
                
                result = self.simulate_slip(slip, iterations)
                slip_info = {
                    'slip_id': slip.get('id', f'slip_{i+1}'),
                    'total_odds': slip.get('total_odds', 1.0),
                    'match_count': len(slip.get('matches', [])),
                    'result': result
                }
                results.append(slip_info)
            
            # Perform comparative analysis
            comparative_analysis = self._compare_slip_results(results)
            
            logger.info("Comparative Monte Carlo simulation completed")
            
            return {
                'individual_results': results,
                'comparative_analysis': comparative_analysis,
                'iterations_per_slip': iterations,
                'total_iterations': iterations * len(slips)
            }
            
        except Exception as e:
            logger.error(f"Error in comparative Monte Carlo simulation: {str(e)}")
            raise
    
    def _compare_slip_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare results from multiple slips"""
        if not results:
            return {}
        
        # Extract key metrics
        slip_ids = []
        win_probs = []
        expected_values = []
        sharpe_ratios = []
        
        for result in results:
            slip_ids.append(result['slip_id'])
            win_probs.append(result['result'].win_probability)
            expected_values.append(result['result'].expected_value)
            sharpe_ratios.append(result['result'].risk_metrics.get('sharpe_ratio', 0))
        
        # Find best by different metrics
        best_by_win_prob = slip_ids[np.argmax(win_probs)]
        best_by_ev = slip_ids[np.argmax(expected_values)]
        best_by_sharpe = slip_ids[np.argmax(sharpe_ratios)]
        
        # Calculate correlations if multiple slips
        correlations = {}
        if len(results) > 1:
            # This would require actual correlation calculation between slip outcomes
            # Simplified for now
            correlations['note'] = 'Correlation analysis requires joint simulation'
        
        return {
            'best_by_win_probability': best_by_win_prob,
            'best_by_expected_value': best_by_ev,
            'best_by_sharpe_ratio': best_by_sharpe,
            'average_win_probability': round(np.mean(win_probs), 4),
            'average_expected_value': round(np.mean(expected_values), 4),
            'win_probability_range': (round(min(win_probs), 4), round(max(win_probs), 4)),
            'expected_value_range': (round(min(expected_values), 4), round(max(expected_values), 4)),
            'correlation_analysis': correlations,
            'recommendations': self._generate_comparison_recommendations(results)
        }
    
    def _generate_comparison_recommendations(self, results: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations based on comparative analysis"""
        recommendations = []
        
        if len(results) < 2:
            return ["Single slip analysis - no comparison available"]
        
        # Extract metrics for comparison
        metrics = []
        for result in results:
            metrics.append({
                'id': result['slip_id'],
                'win_prob': result['result'].win_probability,
                'ev': result['result'].expected_value,
                'sharpe': result['result'].risk_metrics.get('sharpe_ratio', 0),
                'risk_level': 'high' if result['result'].win_probability < 0.4 else 
                            'medium' if result['result'].win_probability < 0.6 else 'low'
            })
        
        # Sort by different metrics
        by_win_prob = sorted(metrics, key=lambda x: x['win_prob'], reverse=True)
        by_ev = sorted(metrics, key=lambda x: x['ev'], reverse=True)
        by_sharpe = sorted(metrics, key=lambda x: x['sharpe'], reverse=True)
        
        # Generate recommendations
        recommendations.append(f"Highest win probability: {by_win_prob[0]['id']} ({by_win_prob[0]['win_prob']:.3f})")
        recommendations.append(f"Highest expected value: {by_ev[0]['id']} ({by_ev[0]['ev']:.3f})")
        recommendations.append(f"Best risk-adjusted return: {by_sharpe[0]['id']} (Sharpe: {by_sharpe[0]['sharpe']:.3f})")
        
        # Risk diversification recommendation
        risk_levels = [m['risk_level'] for m in metrics]
        if risk_levels.count('high') > len(risk_levels) * 0.7:
            recommendations.append("High concentration of high-risk slips - consider adding safer options")
        
        # Odds distribution analysis
        odds_values = [result['total_odds'] for result in results]
        avg_odds = np.mean(odds_values)
        if avg_odds > 10.0:
            recommendations.append("Average odds very high - consider adding lower-odds slips for balance")
        
        return recommendations
    
    def calculate_kelly_for_slip(self, slip_data: Dict[str, Any], 
                               bankroll: float = 1000.0) -> Dict[str, Any]:
        """Calculate Kelly Criterion for a slip"""
        try:
            # Run simulation to get win probability
            result = self.simulate_slip(slip_data, self.config['min_iterations'])
            
            win_prob = result.win_probability
            total_odds = slip_data.get('total_odds', 1.0)
            stake = slip_data.get('stake', 1.0)
            
            if total_odds <= 1.0:
                return {
                    'kelly_percentage': 0.0,
                    'recommended_stake': 0.0,
                    'bankroll_fraction': 0.0,
                    'note': 'Odds must be greater than 1.0'
                }
            
            # Calculate full Kelly
            b = total_odds - 1
            p = win_prob
            q = 1 - p
            
            full_kelly = (b * p - q) / b
            full_kelly = max(0.0, full_kelly)  # Non-negative
            
            # Conservative Kelly (half Kelly)
            half_kelly = full_kelly * 0.5
            
            # Quarter Kelly (more conservative)
            quarter_kelly = full_kelly * 0.25
            
            # Calculate recommended stakes
            full_stake = bankroll * full_kelly
            half_stake = bankroll * half_kelly
            quarter_stake = bankroll * quarter_kelly
            
            # Apply bankroll fraction limit
            max_stake = bankroll * self.config['bankroll_fraction']
            recommended_stake = min(half_stake, max_stake)
            
            return {
                'full_kelly_percentage': round(full_kelly * 100, 2),
                'half_kelly_percentage': round(half_kelly * 100, 2),
                'quarter_kelly_percentage': round(quarter_kelly * 100, 2),
                'full_kelly_stake': round(full_stake, 2),
                'half_kelly_stake': round(half_stake, 2),
                'quarter_kelly_stake': round(quarter_stake, 2),
                'recommended_stake': round(recommended_stake, 2),
                'bankroll_fraction': round(recommended_stake / bankroll * 100, 2),
                'win_probability': round(win_prob, 4),
                'odds': total_odds,
                'expected_value': round(result.expected_value, 4),
                'risk_metrics': result.risk_metrics
            }
            
        except Exception as e:
            logger.error(f"Error calculating Kelly Criterion: {str(e)}")
            return {
                'error': str(e),
                'kelly_percentage': 0.0,
                'recommended_stake': 0.0
            }
    
    # Distribution models for more advanced simulations
    
    def _normal_distribution(self, mean: float, std: float, size: int) -> np.ndarray:
        """Generate samples from normal distribution"""
        return np.random.normal(mean, std, size)
    
    def _poisson_distribution(self, lambda_val: float, size: int) -> np.ndarray:
        """Generate samples from Poisson distribution"""
        return np.random.poisson(lambda_val, size)
    
    def _beta_distribution(self, alpha: float, beta: float, size: int) -> np.ndarray:
        """Generate samples from beta distribution"""
        return np.random.beta(alpha, beta, size)
    
    def _triangular_distribution(self, left: float, mode: float, 
                               right: float, size: int) -> np.ndarray:
        """Generate samples from triangular distribution"""
        return np.random.triangular(left, mode, right, size)