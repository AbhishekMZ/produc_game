# FocusFlow AI Engine - Productivity Intelligence Service
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.linear_model import LinearRegression
import joblib
import logging

logger = logging.getLogger(__name__)

class ProductivityScorer:
    """Calculates productivity scores based on task completion and time tracking"""
    
    def __init__(self):
        self.weights = {
            'task_completion': 0.4,
            'time_efficiency': 0.3,
            'habit_consistency': 0.2,
            'focus_quality': 0.1
        }
    
    def calculate_daily_score(self, user_data: Dict) -> float:
        """
        Calculate daily productivity score (0-100)
        
        Input features:
        - tasks_completed: int
        - total_tasks: int
        - estimated_minutes: int
        - actual_minutes: int
        - habits_completed: int
        - total_habits: int
        - focus_sessions: int
        - distraction_events: int
        """
        
        # Task completion score
        task_completion_rate = (
            user_data.get('tasks_completed', 0) / 
            max(user_data.get('total_tasks', 1), 1)
        ) * 100
        
        # Time efficiency score
        if user_data.get('estimated_minutes', 0) > 0:
            time_efficiency = min(
                (user_data.get('estimated_minutes', 0) / 
                 max(user_data.get('actual_minutes', 1), 1)) * 100,
                100
            )
        else:
            time_efficiency = 50  # Neutral score
        
        # Habit consistency score
        habit_consistency = (
            user_data.get('habits_completed', 0) / 
            max(user_data.get('total_habits', 1), 1)
        ) * 100
        
        # Focus quality score
        if user_data.get('focus_sessions', 0) > 0:
            focus_quality = max(
                100 - (user_data.get('distraction_events', 0) * 10),
                0
            )
        else:
            focus_quality = 50
        
        # Weighted combination
        total_score = (
            task_completion_rate * self.weights['task_completion'] +
            time_efficiency * self.weights['time_efficiency'] +
            habit_consistency * self.weights['habit_consistency'] +
            focus_quality * self.weights['focus_quality']
        )
        
        return min(max(total_score, 0), 100)

class ProcrastinationDetector:
    """Detects procrastination patterns using ML"""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def extract_features(self, task_data: List[Dict]) -> np.ndarray:
        """
        Extract features for procrastination detection:
        - Delay between task creation and start
        - Ratio of estimated to actual time
        - Number of postponements
        - Time of day patterns
        - Task priority vs completion time
        """
        features = []
        
        for task in task_data:
            # Delay feature (hours between creation and first action)
            if task.get('created_at') and task.get('started_at'):
                delay = (
                    datetime.fromisoformat(task['started_at']) - 
                    datetime.fromisoformat(task['created_at'])
                ).total_seconds() / 3600
            else:
                delay = 0
            
            # Time ratio feature
            estimated = task.get('estimated_minutes', 60)
            actual = task.get('actual_minutes', 60)
            time_ratio = actual / max(estimated, 1)
            
            # Postponement feature
            postponements = task.get('postponement_count', 0)
            
            # Time of day feature (hour of completion)
            if task.get('completed_at'):
                completion_hour = datetime.fromisoformat(task['completed_at']).hour
            else:
                completion_hour = 12  # Default to noon
            
            # Priority urgency feature
            priority_weight = {
                'low': 1, 'medium': 2, 'high': 3, 'urgent': 4
            }
            priority = priority_weight.get(task.get('priority', 'medium'), 2)
            
            features.append([delay, time_ratio, postponements, completion_hour, priority])
        
        return np.array(features)
    
    def train(self, training_data: List[Dict]):
        """Train the procrastination detection model"""
        if len(training_data) < 50:
            logger.warning("Insufficient data for training procrastination detector")
            return
        
        features = self.extract_features(training_data)
        scaled_features = self.scaler.fit_transform(features)
        
        self.model.fit(scaled_features)
        self.is_trained = True
        logger.info("Procrastination detector trained successfully")
    
    def detect_procrastination(self, task_data: List[Dict]) -> List[Dict]:
        """Detect procrastination patterns in recent tasks"""
        if not self.is_trained:
            return []
        
        features = self.extract_features(task_data)
        scaled_features = self.scaler.transform(features)
        
        # Predictions: -1 for outliers (procrastination), 1 for normal
        predictions = self.model.predict(scaled_features)
        
        procrastination_tasks = []
        for i, (task, pred) in enumerate(zip(task_data, predictions)):
            if pred == -1:  # Outlier indicates potential procrastination
                procrastination_tasks.append({
                    'task_id': task.get('id'),
                    'task_title': task.get('title'),
                    'procrastination_score': abs(self.model.decision_function([scaled_features[i]])[0]),
                    'reasons': self._analyze_procrastination_reasons(task)
                })
        
        return procrastination_tasks
    
    def _analyze_procrastination_reasons(self, task: Dict) -> List[str]:
        """Analyze potential reasons for procrastination"""
        reasons = []
        
        # Check for excessive delay
        if task.get('created_at') and task.get('started_at'):
            delay_hours = (
                datetime.fromisoformat(task['started_at']) - 
                datetime.fromisoformat(task['created_at'])
            ).total_seconds() / 3600
            if delay_hours > 24:
                reasons.append("Task started more than 24 hours after creation")
        
        # Check for time overestimation
        if task.get('estimated_minutes') and task.get('actual_minutes'):
            if task['actual_minutes'] > task['estimated_minutes'] * 2:
                reasons.append("Task took significantly longer than estimated")
        
        # Check for priority mismatch
        if task.get('priority') == 'urgent' and task.get('completed_at'):
            delay = (
                datetime.fromisoformat(task['completed_at']) - 
                datetime.fromisoformat(task['created_at'])
            ).total_seconds() / 3600
            if delay > 4:
                reasons.append("Urgent task completed with significant delay")
        
        return reasons

class OptimalTimeAnalyzer:
    """Analyzes optimal working hours using clustering"""
    
    def __init__(self):
        self.model = KMeans(n_clusters=3, random_state=42)
        self.optimal_hours = None
    
    def analyze_productivity_patterns(self, time_logs: List[Dict]) -> Dict:
        """
        Analyze productivity patterns by time of day
        Returns optimal working hours and productivity by hour
        """
        if not time_logs:
            return {'optimal_hours': [], 'productivity_by_hour': {}}
        
        # Extract hourly productivity data
        hourly_data = {}
        for log in time_logs:
            if log.get('start_time'):
                hour = datetime.fromisoformat(log['start_time']).hour
                productivity = log.get('productivity_score', 50)
                
                if hour not in hourly_data:
                    hourly_data[hour] = []
                hourly_data[hour].append(productivity)
        
        # Calculate average productivity by hour
        productivity_by_hour = {}
        for hour, scores in hourly_data.items():
            productivity_by_hour[hour] = np.mean(scores)
        
        # Find optimal hours (top 3 most productive hours)
        if productivity_by_hour:
            sorted_hours = sorted(
                productivity_by_hour.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            optimal_hours = [hour for hour, _ in sorted_hours[:3]]
        else:
            optimal_hours = []
        
        return {
            'optimal_hours': optimal_hours,
            'productivity_by_hour': productivity_by_hour
        }

class BurnoutDetector:
    """Detects potential burnout patterns"""
    
    def __init__(self):
        self.burnout_thresholds = {
            'working_hours_daily': 10,  # hours
            'productivity_decline_days': 7,
            'task_completion_rate_drop': 0.3,  # 30% drop
            'habit_miss_rate': 0.5  # 50% habits missed
        }
    
    def assess_burnout_risk(self, user_data: Dict) -> Dict:
        """
        Assess burnout risk based on:
        - Working hours trends
        - Productivity decline
        - Task completion patterns
        - Habit consistency
        """
        risk_factors = []
        risk_score = 0
        
        # Check excessive working hours
        avg_daily_hours = user_data.get('avg_daily_working_hours', 0)
        if avg_daily_hours > self.burnout_thresholds['working_hours_daily']:
            risk_factors.append(f"Excessive working hours: {avg_daily_hours:.1f}h/day")
            risk_score += 25
        
        # Check productivity decline
        productivity_trend = user_data.get('productivity_trend', [])
        if len(productivity_trend) >= self.burnout_thresholds['productivity_decline_days']:
            recent_avg = np.mean(productivity_trend[-3:])
            earlier_avg = np.mean(productivity_trend[-7:-3])
            decline = (earlier_avg - recent_avg) / earlier_avg
            
            if decline > self.burnout_thresholds['task_completion_rate_drop']:
                risk_factors.append(f"Productivity declined by {decline*100:.1f}%")
                risk_score += 30
        
        # Check habit consistency
        habit_completion_rate = user_data.get('habit_completion_rate', 1.0)
        if habit_completion_rate < (1 - self.burnout_thresholds['habit_miss_rate']):
            risk_factors.append(f"Low habit consistency: {habit_completion_rate*100:.1f}%")
            risk_score += 20
        
        # Check task completion patterns
        task_overdue_rate = user_data.get('task_overdue_rate', 0)
        if task_overdue_rate > 0.3:
            risk_factors.append(f"High overdue task rate: {task_overdue_rate*100:.1f}%")
            risk_score += 25
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendations': self._generate_burnout_recommendations(risk_level, risk_factors)
        }
    
    def _generate_burnout_recommendations(self, risk_level: str, factors: List[str]) -> List[str]:
        """Generate personalized burnout prevention recommendations"""
        recommendations = []
        
        if risk_level == "high":
            recommendations.extend([
                "Consider taking a day off to recharge",
                "Reduce working hours to under 8 hours per day",
                "Schedule regular breaks during work sessions",
                "Practice stress management techniques"
            ])
        elif risk_level == "medium":
            recommendations.extend([
                "Focus on maintaining work-life balance",
                "Ensure adequate sleep and nutrition",
                "Consider delegating non-essential tasks"
            ])
        
        # Specific recommendations based on factors
        factor_text = " ".join(factors).lower()
        
        if "excessive working hours" in factor_text:
            recommendations.append("Set strict boundaries for work hours")
        
        if "productivity declined" in factor_text:
            recommendations.append("Review and optimize your work processes")
        
        if "habit consistency" in factor_text:
            recommendations.append("Focus on maintaining your daily routines")
        
        return recommendations

class TrendPredictor:
    """Predicts productivity trends using time series analysis"""
    
    def __init__(self):
        self.model = LinearRegression()
        self.is_trained = False
    
    def prepare_time_series_data(self, historical_data: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare time series data for trend prediction"""
        if len(historical_data) < 7:
            return np.array([]), np.array([])
        
        # Sort by date
        sorted_data = sorted(historical_data, key=lambda x: x.get('date', ''))
        
        # Extract dates and scores
        dates = [datetime.fromisoformat(item['date']) for item in sorted_data]
        scores = [item.get('productivity_score', 50) for item in sorted_data]
        
        # Convert dates to numerical values (days since first date)
        start_date = dates[0]
        X = np.array([(date - start_date).days for date in dates]).reshape(-1, 1)
        y = np.array(scores)
        
        return X, y
    
    def train(self, historical_data: List[Dict]):
        """Train the trend prediction model"""
        X, y = self.prepare_time_series_data(historical_data)
        
        if len(X) == 0:
            logger.warning("Insufficient data for trend prediction")
            return
        
        self.model.fit(X, y)
        self.is_trained = True
        logger.info("Trend predictor trained successfully")
    
    def predict_next_week(self, historical_data: List[Dict]) -> List[Dict]:
        """Predict productivity scores for the next 7 days"""
        if not self.is_trained:
            return []
        
        X, _ = self.prepare_time_series_data(historical_data)
        
        if len(X) == 0:
            return []
        
        # Get the last date from historical data
        last_date = datetime.fromisoformat(historical_data[-1]['date'])
        
        # Predict next 7 days
        predictions = []
        for i in range(1, 8):
            future_date = last_date + timedelta(days=i)
            days_since_start = (future_date - datetime.fromisoformat(historical_data[0]['date'])).days
            
            predicted_score = self.model.predict([[days_since_start]])[0]
            predicted_score = max(0, min(100, predicted_score))  # Clamp between 0-100
            
            predictions.append({
                'date': future_date.isoformat(),
                'predicted_score': round(predicted_score, 1),
                'confidence': 'medium' if len(historical_data) >= 30 else 'low'
            })
        
        return predictions

class FocusFlowAI:
    """Main AI engine that coordinates all ML models"""
    
    def __init__(self):
        self.productivity_scorer = ProductivityScorer()
        self.procrastination_detector = ProcrastinationDetector()
        self.optimal_time_analyzer = OptimalTimeAnalyzer()
        self.burnout_detector = BurnoutDetector()
        self.trend_predictor = TrendPredictor()
    
    def generate_comprehensive_insights(self, user_data: Dict) -> Dict:
        """
        Generate comprehensive AI insights for a user
        """
        insights = {
            'productivity_score': 0,
            'procrastination_patterns': [],
            'optimal_working_hours': [],
            'burnout_risk': {'risk_level': 'low', 'risk_score': 0},
            'weekly_predictions': [],
            'recommendations': [],
            'generated_at': datetime.now().isoformat()
        }
        
        try:
            # Calculate productivity score
            insights['productivity_score'] = self.productivity_scorer.calculate_daily_score(user_data)
            
            # Detect procrastination patterns
            if user_data.get('recent_tasks'):
                insights['procrastination_patterns'] = self.procrastination_detector.detect_procrastination(
                    user_data['recent_tasks']
                )
            
            # Analyze optimal working hours
            if user_data.get('time_logs'):
                time_analysis = self.optimal_time_analyzer.analyze_productivity_patterns(
                    user_data['time_logs']
                )
                insights['optimal_working_hours'] = time_analysis['optimal_hours']
            
            # Assess burnout risk
            insights['burnout_risk'] = self.burnout_detector.assess_burnout_risk(user_data)
            
            # Generate weekly predictions
            if user_data.get('historical_data'):
                self.trend_predictor.train(user_data['historical_data'])
                insights['weekly_predictions'] = self.trend_predictor.predict_next_week(
                    user_data['historical_data']
                )
            
            # Generate personalized recommendations
            insights['recommendations'] = self._generate_recommendations(insights)
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            insights['error'] = "Failed to generate complete insights"
        
        return insights
    
    def _generate_recommendations(self, insights: Dict) -> List[str]:
        """Generate personalized recommendations based on insights"""
        recommendations = []
        
        # Productivity-based recommendations
        score = insights.get('productivity_score', 0)
        if score < 50:
            recommendations.append("Focus on completing high-priority tasks first")
            recommendations.append("Break down large tasks into smaller, manageable chunks")
        elif score > 80:
            recommendations.append("Great job! Consider taking on more challenging tasks")
        
        # Procrastination-based recommendations
        if insights.get('procrastination_patterns'):
            recommendations.append("Use the 2-minute rule for tasks you're avoiding")
            recommendations.append("Set specific deadlines for each task")
            recommendations.append("Try timeboxing to limit task duration")
        
        # Burnout prevention recommendations
        burnout_risk = insights.get('burnout_risk', {})
        if burnout_risk.get('risk_level') in ['medium', 'high']:
            recommendations.extend(burnout_risk.get('recommendations', []))
        
        # Time optimization recommendations
        optimal_hours = insights.get('optimal_working_hours', [])
        if optimal_hours:
            peak_hour = optimal_hours[0] if optimal_hours else 10
            recommendations.append(f"Schedule your most important tasks around {peak_hour}:00")
        
        return recommendations[:5]  # Limit to top 5 recommendations

# Example usage and testing
if __name__ == "__main__":
    # Initialize AI engine
    ai_engine = FocusFlowAI()
    
    # Sample user data for testing
    sample_user_data = {
        'tasks_completed': 5,
        'total_tasks': 8,
        'estimated_minutes': 240,
        'actual_minutes': 300,
        'habits_completed': 3,
        'total_habits': 4,
        'focus_sessions': 4,
        'distraction_events': 2,
        'recent_tasks': [
            {
                'id': '1',
                'title': 'Complete project proposal',
                'created_at': '2024-01-15T09:00:00',
                'started_at': '2024-01-15T14:00:00',
                'estimated_minutes': 60,
                'actual_minutes': 120,
                'priority': 'high',
                'postponement_count': 2
            }
        ],
        'time_logs': [
            {
                'start_time': '2024-01-15T09:00:00',
                'productivity_score': 75
            }
        ],
        'historical_data': [
            {
                'date': '2024-01-10T00:00:00',
                'productivity_score': 70
            },
            {
                'date': '2024-01-11T00:00:00',
                'productivity_score': 75
            }
        ]
    }
    
    # Generate insights
    insights = ai_engine.generate_comprehensive_insights(sample_user_data)
    print("AI Insights Generated:")
    print(f"Productivity Score: {insights['productivity_score']}")
    print(f"Recommendations: {insights['recommendations']}")
