from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection
def get_db_connection():
    conn = psycopg2.connect(
        os.environ.get('DATABASE_URL'),
        sslmode='require' if os.environ.get('NODE_ENV') == 'production' else 'disable'
    )
    return conn

# Initialize database
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            endpoint VARCHAR(255) NOT NULL,
            method VARCHAR(10) NOT NULL,
            response_time INTEGER,
            accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    cur.close()
    conn.close()
    print("Analytics table initialized")

# Routes

# Get analytics summary
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Get total requests
        cur.execute('SELECT COUNT(*) as total_requests FROM analytics')
        total_requests = cur.fetchone()['total_requests']
        
        # Get average response time
        cur.execute('SELECT AVG(response_time) as avg_response_time FROM analytics')
        avg_response_time = cur.fetchone()['avg_response_time'] or 0
        
        # Get most accessed endpoint
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
        return jsonify({'error': 'Failed to fetch analytics'}), 500

# Log request (for tracking)
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
        return jsonify({'error': 'Failed to log request'}), 500

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'python-api'})

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'service': 'Task Manager Python API',
        'version': '1.0.0',
        'endpoints': [
            '/api/analytics',
            '/api/log-request',
            '/health'
        ]
    })

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 3002))
    app.run(host='0.0.0.0', port=port)