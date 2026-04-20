import random
from collections import defaultdict
from datetime import datetime

class SmartRecommender:
    def generate_recommendations(self, tasks, history):
        """Generate AI-powered task recommendations"""
        
        if not tasks:
            return {
                'recommendations': ['Add some tasks to get personalized recommendations!'],
                'insights': {}
            }
        
        pending_tasks = [t for t in tasks if t['status'] == 'pending']
        completed_tasks = [t for t in tasks if t['status'] == 'completed']
        
        recommendations = []
        insights = {}
        
        # Analyze completion patterns
        if len(completed_tasks) > 0:
            avg_completion_time = sum([1 for t in completed_tasks]) / len(completed_tasks)
            insights['avg_completion_rate'] = round(avg_completion_time, 2)
        
        # Priority recommendations based on task age
        old_tasks = []
        for task in pending_tasks:
            created = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
            age_days = (datetime.now() - created).days
            if age_days > 7:
                old_tasks.append(task['title'])
        
        if old_tasks:
            recommendations.append(f"⚠️ These tasks are overdue: {', '.join(old_tasks[:3])}")
        
        # Productivity patterns
        if len(pending_tasks) > 5:
            recommendations.append("📊 You have many pending tasks. Consider delegating or reprioritizing.")
        
        # Smart grouping suggestions
        task_keywords = defaultdict(list)
        for task in pending_tasks:
            words = task['title'].lower().split()
            for word in words[:3]:  # Take first 3 words as keywords
                if len(word) > 3:
                    task_keywords[word].append(task['title'])
        
        similar_tasks = {k: v for k, v in task_keywords.items() if len(v) > 1}
        if similar_tasks:
            keyword = list(similar_tasks.keys())[0]
            recommendations.append(f"💡 Found {len(similar_tasks[keyword])} similar tasks related to '{keyword}'. Consider batching them together!")
        
        # Motivational recommendations
        if len(completed_tasks) > 10:
            recommendations.append("🎉 You're on fire! Keep up the great momentum!")
        elif len(completed_tasks) == 0 and len(pending_tasks) > 0:
            recommendations.append("🌟 Start with your easiest task to build momentum!")
        
        return {
            'recommendations': recommendations if recommendations else ['✅ All caught up! Great job managing your tasks!'],
            'insights': insights,
            'pending_count': len(pending_tasks),
            'completed_count': len(completed_tasks)
        }