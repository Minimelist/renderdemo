import React, { useState } from 'react';

function TaskForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    user_name: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() && formData.user_name.trim()) {
      onSubmit(formData);
      setFormData({ title: '', description: '', user_name: '' });
    }
  };

  return (
    <div className="task-form">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            name="user_name"
            placeholder="Your Name *"
            value={formData.user_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            name="title"
            placeholder="Task Title *"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <textarea
            name="description"
            placeholder="Task Description (optional)"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>
        <button type="submit" className="submit-btn">
          Add Task
        </button>
      </form>
    </div>
  );
}

export default TaskForm;