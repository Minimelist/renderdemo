import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:3002';

function App() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    
    // Log page view to Python API
    logRequest('page_view', 0);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${PYTHON_API_URL}/api/analytics`);
      const endTime = Date.now();
      setAnalytics(response.data);
      logRequest('analytics_fetch', endTime - startTime);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const logRequest = async (endpoint, responseTime) => {
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
      logRequest('create_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error creating task:', error);
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
      logRequest('update_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    const startTime = Date.now();
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      logRequest('delete_task', Date.now() - startTime);
    } catch (error) {
      console.error('Error deleting task:', error);
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
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total API Requests</h3>
              <div className="stat-value">{analytics.total_requests}</div>
            </div>
            <div className="stat-card">
              <h3>Average Response Time</h3>
              <div className="stat-value">{analytics.average_response_time}ms</div>
            </div>
            <div className="stat-card">
              <h3>Most Accessed Endpoint</h3>
              <div className="stat-value">
                {analytics.most_accessed_endpoint?.endpoint || 'N/A'}
                <small>{analytics.most_accessed_endpoint?.count} requests</small>
              </div>
            </div>
          </div>
          <div className="info-box">
            <h3>💡 About This Demo</h3>
            <p>
              This application demonstrates a full-stack deployment with:
            </p>
            <ul>
              <li><strong>Node.js API</strong> - Task management CRUD operations</li>
              <li><strong>Python API</strong> - Analytics and request logging</li>
              <li><strong>PostgreSQL</strong> - Data persistence (separate tables for tasks and analytics)</li>
              <li><strong>React</strong> - Interactive frontend</li>
            </ul>
            <p>
              All services are connected and working together on Render!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;