import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:3002';

function App() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [productivity, setProductivity] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [optimizing, setOptimizing] = useState(false);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchAnalytics();
    fetchInsights();
    fetchRecommendations();
    fetchProductivity();
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
      const response = await axios.get(`${PYTHON_API_URL}/api/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/task-insights`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/recommendations`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchProductivity = async () => {
    try {
      const response = await axios.get(`${PYTHON_API_URL}/api/productivity-report?period=weekly`);
      setProductivity(response.data);
    } catch (error) {
      console.error('Error fetching productivity:', error);
    }
  };

  const optimizeSchedule = async () => {
    setOptimizing(true);
    try {
      const response = await axios.post(`${PYTHON_API_URL}/api/schedule-optimization`, {
        available_hours: 8
      });
      setSchedule(response.data);
      setActiveTab('schedule');
    } catch (error) {
      console.error('Error optimizing schedule:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    
    try {
      const response = await axios.post(`${API_URL}/api/tasks`, newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({ title: '', description: '', status: 'pending' });
      fetchInsights(); // Refresh insights
      fetchRecommendations(); // Refresh recommendations
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (id, currentStatus) => {
    const task = tasks.find(t => t.id === id);
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await axios.put(`${API_URL}/api/tasks/${id}`, {
        ...task,
        status: newStatus
      });
      setTasks(tasks.map(t => t.id === id ? response.data : t));
      fetchInsights(); // Refresh insights
      fetchRecommendations(); // Refresh recommendations
      fetchProductivity(); // Refresh productivity
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      fetchInsights(); // Refresh insights
      fetchRecommendations(); // Refresh recommendations
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>📋 AI-Powered Task Manager</h1>
        <p>Node.js + Python + PostgreSQL + React with Smart Features</p>
        <button onClick={optimizeSchedule} className="optimize-btn" disabled={optimizing}>
          {optimizing ? 'Optimizing...' : '✨ AI Optimize My Schedule'}
        </button>
      </header>

      <div className="tabs">
        <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}>
          Tasks ({tasks.filter(t => t.status === 'pending').length})
        </button>
        <button className={activeTab === 'insights' ? 'active' : ''} onClick={() => setActiveTab('insights')}>
          📊 Insights
        </button>
        <button className={activeTab === 'recommendations' ? 'active' : ''} onClick={() => setActiveTab('recommendations')}>
          💡 AI Recommendations
        </button>
        <button className={activeTab === 'productivity' ? 'active' : ''} onClick={() => setActiveTab('productivity')}>
          📈 Productivity
        </button>
        <button className={activeTab === 'schedule' ? 'active' : ''} onClick={() => setActiveTab('schedule')}>
          🗓️ Smart Schedule
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
                <div key={task.id} className={`task-item ${task.status}`}>
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

      {activeTab === 'insights' && insights && (
        <div className="insights-container">
          <h2>📊 Task Analytics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Tasks</h3>
              <div className="stat-value">{insights.total_tasks}</div>
            </div>
            <div className="stat-card">
              <h3>Completion Rate</h3>
              <div className="stat-value">{insights.completion_rate}%</div>
            </div>
            <div className="stat-card">
              <h3>Avg Completion Time</h3>
              <div className="stat-value">{insights.average_completion_time} hours</div>
            </div>
          </div>
          
          <div className="info-box">
            <h3>💡 Recommendations</h3>
            <ul>
              {insights.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'recommendations' && recommendations && (
        <div className="recommendations-container">
          <h2>🤖 AI-Powered Recommendations</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Pending Tasks</h3>
              <div className="stat-value">{recommendations.pending_count}</div>
            </div>
            <div className="stat-card">
              <h3>Completed Tasks</h3>
              <div className="stat-value">{recommendations.completed_count}</div>
            </div>
          </div>
          
          <div className="info-box">
            <h3>✨ Smart Suggestions</h3>
            <ul>
              {recommendations.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'productivity' && productivity && (
        <div className="productivity-container">
          <h2>📈 Productivity Report ({productivity.period})</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Productivity Score</h3>
              <div className="stat-value">{productivity.productivity_score}/100</div>
            </div>
            <div className="stat-card">
              <h3>Tasks Completed</h3>
              <div className="stat-value">{productivity.completed_tasks}</div>
            </div>
            <div className="stat-card">
              <h3>Completion Rate</h3>
              <div className="stat-value">{productivity.completion_rate}%</div>
            </div>
          </div>
          
          <div className="info-box">
            <h3>📊 Insights</h3>
            <ul>
              {productivity.insights?.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
          </div>
          
          <div className="info-box">
            <h3>🎯 Recommendations</h3>
            <ul>
              {productivity.recommendations?.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && schedule && (
        <div className="schedule-container">
          <h2>🗓️ AI-Optimized Schedule</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Time Needed</h3>
              <div className="stat-value">{schedule.total_time_needed} hours</div>
            </div>
            <div className="stat-card">
              <h3>Available Hours</h3>
              <div className="stat-value">{schedule.available_hours} hours</div>
            </div>
            <div className="stat-card">
              <h3>Remaining Capacity</h3>
              <div className="stat-value">{schedule.remaining_capacity} hours</div>
            </div>
          </div>
          
          <div className="schedule-list">
            <h3>📅 Your Optimized Task Schedule</h3>
            {schedule.schedule?.map((task, i) => (
              <div key={i} className="schedule-item">
                <div className="schedule-time">{task.suggested_start_time}</div>
                <div className="schedule-task">
                  <strong>{task.title}</strong>
                  <span className="schedule-estimate">⏱️ {task.estimated_hours} hours</span>
                  <span className={`schedule-priority priority-${task.priority.toLowerCase()}`}>
                    {task.priority} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="info-box">
            <p>💡 {schedule.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;