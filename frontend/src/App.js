import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Use environment variables with fallbacks
const API_URL = process.env.REACT_APP_API_URL || '';
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || '';

// For debugging
console.log('API_URL:', API_URL);
console.log('PYTHON_API_URL:', PYTHON_API_URL);

function App() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    logRequest('page_view', 0);
  }, []);

  const fetchTasks = async () => {
    try {
      setError(null);
      const url = `${API_URL}/api/tasks`;
      console.log('Fetching tasks from:', url);
      const response = await axios.get(url);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(`Failed to fetch tasks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const startTime = Date.now();
      const url = `${PYTHON_API_URL}/api/analytics`;
      console.log('Fetching analytics from:', url);
      const response = await axios.get(url);
      const endTime = Date.now();
      setAnalytics(response.data);
      await logRequest('analytics_fetch', endTime - startTime);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({ error: 'Failed to load analytics', total_requests: 0 });
    }
  };

  const logRequest = async (endpoint, responseTime) => {
    if (!PYTHON_API_URL) return;
    
    try {
      await axios.post(`${PYTHON_API_URL}/api/log-request`, {
        endpoint: endpoint,
        method: 'GET',
        response_time: responseTime
      });
    } catch (error) {
      console.error('Error logging request:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    const startTime = Date.now();
    try {
      const response = await axios.post(`${API_URL}/api/tasks`, newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({ title: '', description: '', status: 'pending' });
      await logRequest('create_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error creating task:', error);
      setError(`Failed to create task: ${error.message}`);
    }
  };

  const updateTaskStatus = async (id, currentStatus) => {
    const task = tasks.find(t => t.id === id);
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const startTime = Date.now();
    
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${id}`, {
        ...task,
        status: newStatus
      });
      setTasks(tasks.map(t => t.id === id ? response.data : t));
      await logRequest('update_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error updating task:', error);
      setError(`Failed to update task: ${error.message}`);
    }
  };

  const deleteTask = async (id) => {
    const startTime = Date.now();
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      await logRequest('delete_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(`Failed to delete task: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    return status === 'completed' ? 'completed' : 'pending';
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>📋 Task Manager</h1>
        <p>Full-stack deployment test with Node.js + Python + PostgreSQL + React</p>
      </header>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="tabs">
        <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>
          Tasks
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
          Analytics
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="tasks-container">
          <form onSubmit={createTask} className="task-form">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <button type="submit">Add Task</button>
          </form>

          <div className="tasks-list">
            <h2>Your Tasks ({tasks.length})</h2>
            {tasks.length === 0 ? (
              <p className="no-tasks">No tasks yet. Create one above!</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className={`task-item ${getStatusColor(task.status)}`}>
                  <div className="task-content">
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="task-meta">
                      <span className="status-badge">{task.status}</span>
                      <span className="task-date">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button 
                      className="toggle-btn"
                      onClick={() => updateTaskStatus(task.id, task.status)}
                    >
                      {task.status === 'completed' ? '↺ Mark Pending' : '✓ Mark Complete'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteTask(task.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="analytics-container">
          <h2>📊 API Analytics</h2>
          {analytics.error ? (
            <div className="error-message">{analytics.error}</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total API Requests</h3>
                <div className="stat-value">{analytics.total_requests || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Average Response Time</h3>
                <div className="stat-value">{analytics.average_response_time || 0}ms</div>
              </div>
              <div className="stat-card">
                <h3>Most Accessed Endpoint</h3>
                <div className="stat-value">
                  {analytics.most_accessed_endpoint?.endpoint || 'N/A'}
                  <small>{analytics.most_accessed_endpoint?.count || 0} requests</small>
                </div>
              </div>
            </div>
          )}
          <div className="info-box">
            <h3>💡 Debug Info</h3>
            <p>API URLs being used:</p>
            <ul>
              <li><strong>Node.js API:</strong> {API_URL || 'Not set'}</li>
              <li><strong>Python API:</strong> {PYTHON_API_URL || 'Not set'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;