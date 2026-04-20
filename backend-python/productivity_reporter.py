from datetime import datetime, timedelta
import pandas as pd
import numpy as np

class ProductivityReporter:
    def generate_report(self, tasks, period='weekly'):
        """Generate productivity report"""
        
        if not tasks:
            return {
                'period': period,
                'total_tasks': 0,
                'completed_tasks': 0,
                'productivity_score': 0,
                'message': 'No tasks found for this period',
                'recommendations': ['Start tracking tasks to see your productivity!']
            }
        
        df = pd.DataFrame(tasks)
        
        # Calculate metrics
        total_tasks = len(df)
        completed_tasks = len(df[df['status'] == 'completed'])
        completion_rate = (completed_tasks / total_tasks) * 100 if total_tasks > 0 else 0
        
        # Calculate productivity score (0-100)
        productivity_score = min(100, completion_rate * 1.2)
        
        # Task completion trend
        df['date'] = pd.to_datetime(df['created_at']).dt.date
        daily_completions = df[df['status'] == 'completed'].groupby('date').size().to_dict()
        
        # Generate insights
        insights = []
        if completion_rate > 80:
            insights.append("Excellent productivity! You're completing most of your tasks.")
        elif completion_rate > 50:
            insights.append("Good progress! Try to focus on completing pending tasks.")
        else:
            insights.append("Room for improvement. Consider setting smaller, achievable goals.")
        
        if completed_tasks > 20:
            insights.append("Outstanding! You've completed over 20 tasks this period.")
        
        # Recommendations
        recommendations = []
        if completed_tasks < total_tasks * 0.5:
            recommendations.append("Focus on completing your oldest tasks first.")
        
        if period == 'daily':
            recommendations.append("Break down large tasks into smaller ones for better tracking.")
        elif period == 'weekly':
            recommendations.append("Review your weekly goals every Monday morning.")
        else:
            recommendations.append("Set monthly milestones to track long-term progress.")
        
        return {
            'period': period,
            'report_date': datetime.now().isoformat(),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': round(completion_rate, 2),
            'productivity_score': round(productivity_score, 2),
            'daily_breakdown': daily_completions,
            'insights': insights,
            'recommendations': recommendations
        }