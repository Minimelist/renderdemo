from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json
from task_analyzer import TaskAnalyzer
from task_scheduler import TaskScheduler
from smart_recommender import SmartRecommender
from productivity_reporter import ProductivityReporter

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize modules
task_analyzer = TaskAnalyzer()
task_scheduler = TaskScheduler()
smart_recommender = SmartRecommender()
productivity_reporter = ProductivityReporter()

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        os.environ.get('DATABASE_URL'),
        sslmode='require' if os.environ.get('NODE_ENV') == 'production' else 'disable'
    )
    return conn

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Analytics table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            endpoint VARCHAR(255) NOT NULL,
            method VARCHAR(10) NOT NULL,
            response_time INTEGER,
            accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Task insights table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS task_insights (
            id SERIAL PRIMARY KEY,
            insight_type VARCHAR(100),
            insight_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Productivity logs table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS productivity_logs (
            id SERIAL PRIMARY KEY,
            date DATE DEFAULT CURRENT_DATE,
            tasks_completed INTEGER DEFAULT 0,
            total_time_spent INTEGER DEFAULT 0,
            productivity_score FLOAT DEFAULT 0
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()
    print("All database tables initialized")

# Routes

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'Task Manager Python API with AI Features',
        'version': '2.0.0',
        'features': [
            'Task Analytics',
            'Smart Scheduling',
            'AI Recommendations',
            'Productivity Reports'
        ],
        'endpoints': {
            'analytics': '/api/analytics',
            'task_insights': '/api/task-insights',
            'schedule_optimization': '/api/schedule-optimization',
            'recommendations': '/api/recommendations',
            'productivity_report': '/api/productivity-report',
            'log_request': '/api/log-request',
            'health': '/health'
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'python-api',
        'features_loaded': {
            'analyzer': True,
            'scheduler': True,
            'recommender': True,
            'reporter': True
        }
    })

# 1. Task Analytics Endpoint
@app.route('/api/task-insights', methods=['GET'])
def get_task_insights():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all tasks from Node.js database
        cur.execute('SELECT * FROM tasks ORDER BY created_at DESC')
        tasks = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        # Analyze tasks using Python
        insights = task_analyzer.analyze_tasks(tasks)
        
        return jsonify(insights)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# 2. Smart Schedule Optimization
@app.route('/api/schedule-optimization', methods=['POST'])
def optimize_schedule():
    try:
        data = request.json
        available_hours = data.get('available_hours', 8)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get pending tasks
        cur.execute('SELECT * FROM tasks WHERE status = %s ORDER BY created_at', ('pending',))
        tasks = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        # Generate optimized schedule
        schedule = task_scheduler.create_optimized_schedule(tasks, available_hours)
        
        return jsonify(schedule)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# 3. AI Task Recommendations
@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get all tasks
        cur.execute('SELECT * FROM tasks ORDER BY created_at DESC')
        tasks = [dict(row) for row in cur.fetchall()]
        
        # Get historical completion data
        cur.execute('''
            SELECT status, created_at, updated_at 
            FROM tasks 
            WHERE status = 'completed'
        ''')
        history = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        # Generate AI recommendations
        recommendations = smart_recommender.generate_recommendations(tasks, history)
        
        return jsonify(recommendations)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# 4. Productivity Report
@app.route('/api/productivity-report', methods=['GET'])
def get_productivity_report():
    try:
        period = request.args.get('period', 'weekly')  # daily, weekly, monthly
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get tasks for the period
        if period == 'daily':
            date_filter = "created_at >= CURRENT_DATE"
        elif period == 'weekly':
            date_filter = "created_at >= CURRENT_DATE - INTERVAL '7 days'"
        else:  # monthly
            date_filter = "created_at >= CURRENT_DATE - INTERVAL '30 days'"
        
        cur.execute(f'SELECT * FROM tasks WHERE {date_filter}')
        tasks = [dict(row) for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        # Generate report
        report = productivity_reporter.generate_report(tasks, period)
        
        return jsonify(report)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# 5. Log analytics endpoint (existing)
@app.route('/api/log-request', methods=['POST'])
def log_request():
    try:
        data = request.json
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO analytics (endpoint, method, response_time) VALUES (%s, %s, %s)',
            (data.get('endpoint'), data.get('method'), data.get('response_time'))
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Request logged successfully'}), 201
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

# 6. Get analytics summary (existing but enhanced)
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        cur.execute('SELECT COUNT(*) as total_requests FROM analytics')
        total_requests = cur.fetchone()['total_requests']
        
        cur.execute('SELECT AVG(response_time) as avg_response_time FROM analytics')
        avg_response_time = cur.fetchone()['avg_response_time'] or 0
        
        cur.execute('''
            SELECT endpoint, COUNT(*) as count 
            FROM analytics 
            GROUP BY endpoint 
            ORDER BY count DESC 
            LIMIT 1
        ''')
        most_accessed = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return jsonify({
            'total_requests': total_requests,
            'average_response_time': round(avg_response_time, 2),
            'most_accessed_endpoint': dict(most_accessed) if most_accessed else None
        })
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 3002))
    app.run(host='0.0.0.0', port=port)