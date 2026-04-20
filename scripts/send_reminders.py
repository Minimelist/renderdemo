#!/usr/bin/env python3
"""
Run this script daily to send task reminders
Usage: python scripts/send_reminders.py
"""
import os
import sys
import psycopg2
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

DATABASE_URL = os.environ.get('DATABASE_URL')

def get_pending_tasks():
    """Fetch pending tasks older than 3 days"""
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cur = conn.cursor()
    
    three_days_ago = datetime.now() - timedelta(days=3)
    cur.execute("""
        SELECT id, title, created_at 
        FROM tasks 
        WHERE status = 'pending' AND created_at < %s
        ORDER BY created_at
    """, (three_days_ago,))
    
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return tasks

def send_reminder_email(tasks):
    """Send reminder email (configure your email settings)"""
    if not tasks:
        print("No pending tasks to remind")
        return
    
    print(f"📧 Would send reminder for {len(tasks)} tasks:")
    for task in tasks:
        print(f"  - {task[1]} (created {task[2].date()})")
    
    # Implement actual email sending here if needed
    # For now, just print the reminders

if __name__ == "__main__":
    print("🔍 Checking for pending tasks...")
    tasks = get_pending_tasks()
    send_reminder_email(tasks)