#!/usr/bin/env python3
"""
Run this script to populate your database with sample tasks
Usage: python scripts/seed_database.py
"""
import os
import sys
import psycopg2
from datetime import datetime, timedelta
import random

# Get database URL from environment or Render
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Please set DATABASE_URL environment variable")
    sys.exit(1)

# Sample tasks
sample_tasks = [
    ("Complete project documentation", "Write API docs and user guide", "pending"),
    ("Review pull requests", "Check team PRs and provide feedback", "pending"),
    ("Fix login bug", "Investigate authentication issue", "completed"),
    ("Deploy to production", "Schedule deployment for Friday", "pending"),
    ("Update dependencies", "Run npm audit fix", "completed"),
    ("Write unit tests", "Achieve 80% coverage", "pending"),
    ("Optimize database queries", "Add indexes and analyze performance", "pending"),
    ("Create presentation", "Prepare slides for team meeting", "completed"),
    ("Setup monitoring", "Configure alerts and dashboards", "pending"),
    ("Conduct code review", "Review new feature implementation", "pending"),
]

def seed_database():
    try:
        conn = psycopg2.connect(DATABASE_URL, sslmode='require')
        cur = conn.cursor()
        
        # Clear existing tasks
        cur.execute("DELETE FROM tasks")
        
        # Insert sample tasks
        for title, description, status in sample_tasks:
            created_at = datetime.now() - timedelta(days=random.randint(0, 30))
            cur.execute("""
                INSERT INTO tasks (title, description, status, created_at)
                VALUES (%s, %s, %s, %s)
            """, (title, description, status, created_at))
        
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Successfully seeded {len(sample_tasks)} tasks!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    seed_database()