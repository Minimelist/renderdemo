import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

function TaskItem({ task, onUpdate, onDelete, onToggle }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    user_name: task.user_name
  });

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSubmit = () => {
    if (editData.title.trim() && editData.user_name.trim()) {
      onUpdate(task.id, {
        ...editData,
        completed: task.completed
      });
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="task-item editing">
        <div className="task-edit-form">
          <input
            type="text"
            name="user_name"
            value={editData.user_name}
            onChange={handleEditChange}
            placeholder="Your Name"
            className="edit-input"
          />
          <input
            type="text"
            name="title"
            value={editData.title}
            onChange={handleEditChange}
            placeholder="Task Title"
            className="edit-input"
          />
          <textarea
            name="description"
            value={editData.description}
            onChange={handleEditChange}
            placeholder="Task Description"
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={handleEditSubmit} className="save-btn">
              <FaCheck /> Save
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-btn">
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-header">
        <div className="task-user">
          <span className="user-badge">{task.user_name}</span>
        </div>
        <div className="task-actions">
          <button onClick={() => onToggle(task.id)} className="toggle-btn">
            {task.completed ? '↺ Reopen' : '✓ Complete'}
          </button>
          <button onClick={() => setIsEditing(true)} className="edit-btn">
            <FaEdit />
          </button>
          <button onClick={() => onDelete(task.id)} className="delete-btn">
            <FaTrash />
          </button>
        </div>
      </div>
      
      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
      </div>
      
      <div className="task-footer">
        <small>Created: {new Date(task.created_at).toLocaleDateString()}</small>
        {task.completed && <span className="completed-badge">Completed ✓</span>}
      </div>
    </div>
  );
}

export default TaskItem;