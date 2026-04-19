import React, { useState, useEffect } from 'react';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import './styles/App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (!response.ok) throw new Error('Failed to add task');
      const newTask = await response.json();
      setTasks([newTask, ...tasks]);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateTask = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete task');
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleComplete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}/toggle`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('Failed to toggle task');
      const updatedTask = await response.json();
      setTasks(tasks.map(task => task.id === id ? updatedTask : task));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading tasks...</div>;

  return (
    <div className="App">
      <header className="app-header">
        <h1>📝 Task Manager</h1>
        <p>Manage your tasks efficiently</p>
      </header>
      
      <main className="app-main">
        {error && <div className="error-message">{error}</div>}
        
        <TaskForm onSubmit={addTask} />
        
        <TaskList 
          tasks={tasks}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onToggle={toggleComplete}
        />
      </main>
      
      <footer className="app-footer">
        <p>Task Manager App - CRUD Operations with PERN Stack</p>
      </footer>
    </div>
  );
}

export default App;