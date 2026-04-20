import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter, defaultdict

class TaskAnalyzer:
    def analyze_tasks(self, tasks):
        """Analyze tasks and provide insights"""
        if not tasks:
            return {
                'total_tasks': 0,
                'completion_rate': 0,
                'average_completion_time': 0,
                'status_distribution': {},
                'peak_creation_hours': [],
                'recommendations': ['Create your first task to get insights!']
            }
        
        df = pd.DataFrame(tasks)
        
        # Calculate metrics
        total_tasks = len(df)
        completed_tasks = len(df[df['status'] == 'completed'])
        completion_rate = (completed_tasks / total_tasks) * 100
        
        # Calculate average completion time
        avg_completion_time = 0
        for _, task in df.iterrows():
            if task['status'] == 'completed' and task.get('updated_at') and task.get('created_at'):
                created = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
                updated = datetime.fromisoformat(task['updated_at'].replace('Z', '+00:00'))
                time_diff = (updated - created).total_seconds() / 3600  # hours
                avg_completion_time = (avg_completion_time + time_diff) / 2
        
        # Status distribution
        status_dist = df['status'].value_counts().to_dict()
        
        # Peak creation hours
        df['hour'] = pd.to_datetime(df['created_at']).dt.hour
        peak_hours = df['hour'].value_counts().head(3).index.tolist()
        
        # Generate recommendations
        recommendations = []
        if completion_rate < 30:
            recommendations.append("Your completion rate is low. Try breaking tasks into smaller chunks.")
        elif completion_rate > 80:
            recommendations.append("Great job! You're very productive. Consider taking on more challenging tasks.")
        
        if len([t for t in tasks if t['status'] == 'pending']) > 10:
            recommendations.append("You have many pending tasks. Prioritize your top 3 for today.")
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': round(completion_rate, 2),
            'average_completion_time': round(avg_completion_time, 2),
            'status_distribution': status_dist,
            'peak_creation_hours': peak_hours,
            'recommendations': recommendations if recommendations else ['Keep up the good work!']
        }